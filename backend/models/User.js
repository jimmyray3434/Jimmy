const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  apiKeys: {
    openai: String,
    stripe: String,
    amazonAffiliateId: String,
    shareasaleApiToken: String,
    shareasaleAffiliateId: String
  },
  settings: {
    contentGeneration: {
      targetNiche: String,
      contentTypes: [String],
      publishingFrequency: String,
      qualityLevel: {
        type: Number,
        default: 0.7,
        min: 0.1,
        max: 1.0
      }
    },
    affiliate: {
      networks: [String],
      productCategories: [String],
      minCommissionRate: Number
    },
    digitalProducts: {
      productTypes: [String],
      priceRange: {
        min: Number,
        max: Number
      },
      autoGenerate: Boolean
    },
    automation: {
      scheduleActive: {
        type: Boolean,
        default: true
      },
      contentSchedule: String,
      affiliateUpdateSchedule: String,
      analyticsSchedule: String
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

