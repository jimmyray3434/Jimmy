const mongoose = require('mongoose');

const SocialAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['facebook', 'twitter', 'linkedin', 'instagram', 'pinterest', 'medium'],
    required: true
  },
  username: {
    type: String,
    trim: true
  },
  profileUrl: {
    type: String,
    trim: true
  },
  isConnected: {
    type: Boolean,
    default: false
  },
  followerCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  postCount: {
    type: Number,
    default: 0
  },
  tokenInfo: {
    accessToken: {
      type: String,
      select: false // Don't include in query results by default
    },
    refreshToken: {
      type: String,
      select: false
    },
    expiresAt: {
      type: Date
    }
  },
  lastConnected: {
    type: Date,
    default: Date.now
  },
  lastPostDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'error', 'disabled'],
    default: 'active'
  },
  statusMessage: {
    type: String
  },
  postingFrequency: {
    type: String,
    enum: ['hourly', 'daily', 'weekly', 'custom'],
    default: 'daily'
  },
  customPostingSchedule: {
    daysOfWeek: {
      type: [Number], // 0 = Sunday, 6 = Saturday
      default: [1, 3, 5] // Monday, Wednesday, Friday
    },
    timeOfDay: {
      type: [String], // Format: "HH:MM" in 24-hour format
      default: ["09:00", "15:00"]
    }
  },
  autoPostingEnabled: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Compound index for user and platform
SocialAccountSchema.index({ user: 1, platform: 1 }, { unique: true });

// Method to check if token is expired
SocialAccountSchema.methods.isTokenExpired = function() {
  if (!this.tokenInfo || !this.tokenInfo.expiresAt) {
    return true;
  }
  
  return new Date() > this.tokenInfo.expiresAt;
};

// Method to check if account is ready for posting
SocialAccountSchema.methods.isReadyForPosting = function() {
  return this.isConnected && 
         this.status === 'active' && 
         this.autoPostingEnabled && 
         !this.isTokenExpired();
};

// Method to check if it's time to post based on schedule
SocialAccountSchema.methods.isTimeToPost = function() {
  if (!this.isReadyForPosting()) {
    return false;
  }
  
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
  
  // Check if last post was too recent
  if (this.lastPostDate) {
    const hoursSinceLastPost = (now - this.lastPostDate) / (1000 * 60 * 60);
    
    switch (this.postingFrequency) {
      case 'hourly':
        if (hoursSinceLastPost < 1) return false;
        break;
      case 'daily':
        if (hoursSinceLastPost < 24) return false;
        break;
      case 'weekly':
        if (hoursSinceLastPost < 168) return false; // 7 days * 24 hours
        break;
    }
  }
  
  // For custom schedule, check day and time
  if (this.postingFrequency === 'custom') {
    // Check if today is a posting day
    if (!this.customPostingSchedule.daysOfWeek.includes(currentDay)) {
      return false;
    }
    
    // Check if current time matches any scheduled time (within 5 minutes)
    return this.customPostingSchedule.timeOfDay.some(scheduledTime => {
      const [scheduledHour, scheduledMinute] = scheduledTime.split(':').map(Number);
      const scheduledMinutes = scheduledHour * 60 + scheduledMinute;
      const currentMinutes = currentHour * 60 + currentMinute;
      
      return Math.abs(currentMinutes - scheduledMinutes) <= 5;
    });
  }
  
  // For non-custom schedules, we've already checked the time elapsed since last post
  return true;
};

// Static method to find accounts due for posting
SocialAccountSchema.statics.findDueForPosting = async function() {
  // Find all active, connected accounts with auto-posting enabled
  const accounts = await this.find({
    isConnected: true,
    status: 'active',
    autoPostingEnabled: true
  });
  
  // Filter accounts that are due for posting
  return accounts.filter(account => account.isTimeToPost());
};

module.exports = mongoose.model('SocialAccount', SocialAccountSchema);

