const mongoose = require('mongoose');

const TriggerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'new_lead', 'lead_updated', 'lead_qualified', 'lead_disqualified',
      'new_contact', 'contact_updated', 'contact_purchase',
      'tag_added', 'tag_removed', 'field_updated', 'scheduled'
    ],
    required: true
  },
  entityType: {
    type: String,
    enum: ['lead', 'contact', 'both'],
    default: 'both'
  },
  specificField: {
    type: String
  },
  specificValue: {
    type: mongoose.Schema.Types.Mixed
  },
  schedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6
    },
    dayOfMonth: {
      type: Number,
      min: 1,
      max: 31
    },
    time: {
      type: String
    }
  }
}, { _id: false });

const ConditionSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true
  },
  operator: {
    type: String,
    enum: [
      'equals', 'not_equals', 'contains', 'not_contains',
      'starts_with', 'ends_with', 'greater_than', 'less_than',
      'is_empty', 'is_not_empty', 'in_list', 'not_in_list'
    ],
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { _id: false });

const ActionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'update_field', 'add_tag', 'remove_tag', 'send_email',
      'create_task', 'convert_lead', 'add_note', 'webhook'
    ],
    required: true
  },
  params: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  delay: {
    type: Number,
    default: 0 // Delay in minutes
  }
}, { _id: true });

const AutomationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'draft'],
    default: 'draft'
  },
  trigger: {
    type: TriggerSchema,
    required: true
  },
  conditions: {
    type: [ConditionSchema],
    default: []
  },
  actions: {
    type: [ActionSchema],
    required: true
  },
  stats: {
    executionCount: {
      type: Number,
      default: 0
    },
    successCount: {
      type: Number,
      default: 0
    },
    failureCount: {
      type: Number,
      default: 0
    },
    lastExecuted: {
      type: Date
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for faster queries
AutomationSchema.index({ user: 1, status: 1 });
AutomationSchema.index({ user: 1, 'trigger.type': 1 });
AutomationSchema.index({ user: 1, 'trigger.entityType': 1 });

// Virtual for automation age in days
AutomationSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to check if automation is active
AutomationSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Method to activate automation
AutomationSchema.methods.activate = async function() {
  this.status = 'active';
  await this.save();
  return this;
};

// Method to pause automation
AutomationSchema.methods.pause = async function() {
  this.status = 'paused';
  await this.save();
  return this;
};

// Method to record execution
AutomationSchema.methods.recordExecution = async function(success = true) {
  this.stats.executionCount += 1;
  
  if (success) {
    this.stats.successCount += 1;
  } else {
    this.stats.failureCount += 1;
  }
  
  this.stats.lastExecuted = new Date();
  await this.save();
  return this;
};

// Static method to find automations by trigger type
AutomationSchema.statics.findByTriggerType = function(userId, triggerType) {
  return this.find({
    user: userId,
    status: 'active',
    'trigger.type': triggerType
  });
};

// Static method to find automations by entity type
AutomationSchema.statics.findByEntityType = function(userId, entityType) {
  return this.find({
    user: userId,
    status: 'active',
    $or: [
      { 'trigger.entityType': entityType },
      { 'trigger.entityType': 'both' }
    ]
  });
};

// Static method to find scheduled automations due for execution
AutomationSchema.statics.findScheduledDue = function() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentDate = now.getDate(); // 1-31
  
  return this.find({
    status: 'active',
    'trigger.type': 'scheduled',
    $or: [
      // Daily automations
      {
        'trigger.schedule.frequency': 'daily',
        'trigger.schedule.time': { $regex: new RegExp(`^${currentHour.toString().padStart(2, '0')}:`) }
      },
      // Weekly automations on the current day
      {
        'trigger.schedule.frequency': 'weekly',
        'trigger.schedule.dayOfWeek': currentDay,
        'trigger.schedule.time': { $regex: new RegExp(`^${currentHour.toString().padStart(2, '0')}:`) }
      },
      // Monthly automations on the current date
      {
        'trigger.schedule.frequency': 'monthly',
        'trigger.schedule.dayOfMonth': currentDate,
        'trigger.schedule.time': { $regex: new RegExp(`^${currentHour.toString().padStart(2, '0')}:`) }
      }
    ]
  });
};

module.exports = mongoose.model('Automation', AutomationSchema);

