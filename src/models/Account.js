const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['linkedin', 'twitter', 'instagram', 'facebook'],
    required: true
  },
  platformId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String,
    required: true
  },
  tokenExpiresAt: {
    type: Date,
    required: true
  },
  // Facebook-specific fields
  facebookPageId: {
    type: String,
    required: function() {
      return this.platform === 'facebook';
    }
  },
  facebookPageName: {
    type: String,
    required: function() {
      return this.platform === 'facebook';
    }
  },
  facebookPageCategory: {
    type: String,
    required: function() {
      return this.platform === 'facebook';
    }
  },
  // Instagram-specific fields
  instagramBusinessId: {
    type: String,
    required: function() {
      return this.platform === 'instagram';
    }
  },
  instagramAccountType: {
    type: String,
    enum: ['BUSINESS', 'CREATOR', 'PERSONAL'],
    required: function() {
      return this.platform === 'instagram';
    }
  },
  connectedFacebookPageId: {
    type: String,
    required: function() {
      return this.platform === 'instagram' && this.instagramAccountType === 'BUSINESS';
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
accountSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Account', accountSchema); 