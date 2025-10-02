const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platform: { type: String, required: true },
  date: { type: Date, required: true },
  followers: { type: Number, default: 0 },
  engagementRate: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  sentiment: {
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 },
  },
});

module.exports = mongoose.model('Analytics', analyticsSchema); 