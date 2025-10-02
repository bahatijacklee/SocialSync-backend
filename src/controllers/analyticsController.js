const Analytics = require('../models/Analytics');
const Account = require('../models/Account');
const jwt = require('jsonwebtoken');
const twitterService = require('../services/twitterService');
const linkedinService = require('../services/linkedinService');

// Stub/mock for Instagram analytics
async function getInstagramAnalytics(account) {
  // Replace with real API integration later
  return {
    followers: 5000,
    engagement: { likes: 1200, retweets: 0, replies: 300 },
    impressions: 8000,
  };
}

// Stub/mock for LinkedIn analytics
async function getLinkedInAnalytics(account) {
  // Replace with real API integration later
  return {
    followers: 2000,
    engagement: { likes: 400, retweets: 0, replies: 100 },
    impressions: 3000,
  };
}

function getUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

exports.getOverview = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch all connected accounts for the user
    const accounts = await Account.find({ userId });
    if (!accounts.length) {
      return res.json({
        totalFollowers: 0,
        engagementRate: 0,
        impressions: 0,
        platforms: [],
      });
    }

    let totalFollowers = 0;
    let totalImpressions = 0;
    let totalEngagement = 0;
    let engagementDenominator = 0;
    const platforms = [];

    for (const account of accounts) {
      let analytics;
      if (account.platform === 'Twitter') {
        analytics = await twitterService.getAccountAnalytics(account.username);
      } else if (account.platform === 'Instagram') {
        analytics = await getInstagramAnalytics(account);
      } else if (account.platform === 'LinkedIn') {
        analytics = await linkedinService.getAccountAnalytics(account);
      } else {
        continue; // skip unknown platforms
      }
      totalFollowers += analytics.followers;
      totalImpressions += analytics.impressions;
      // Engagement rate: (likes + retweets) / followers * 100
      const engagement = ((analytics.engagement.likes + (analytics.engagement.retweets || 0)) / analytics.followers) * 100;
      totalEngagement += engagement;
      engagementDenominator++;
      platforms.push({
        platform: account.platform,
        followers: analytics.followers,
        impressions: analytics.impressions,
        engagementRate: engagement.toFixed(1),
      });
    }

    const avgEngagementRate = engagementDenominator ? (totalEngagement / engagementDenominator).toFixed(1) : 0;

    res.json({
      totalFollowers,
      engagementRate: avgEngagementRate,
      impressions: totalImpressions,
      platforms,
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
};

exports.getSentiment = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const sentiment = await twitterService.getSentimentAnalysis(req.query.username || 'elonmusk');
    res.json(sentiment);
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Error fetching sentiment', error: error.message });
  }
};

exports.getPerformance = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const twitterData = await twitterService.getAccountAnalytics(req.query.username || 'elonmusk');
    
    // Transform tweet data into daily performance metrics
    const performanceData = twitterData.tweets.reduce((acc, tweet) => {
      const date = tweet.date.split('T')[0];
      const existingDay = acc.find(day => day.date === date);
      
      if (existingDay) {
        existingDay.followers = twitterData.followers; // Use current follower count
        existingDay.engagement = ((tweet.metrics.like_count + tweet.metrics.retweet_count) / twitterData.followers * 100).toFixed(1);
      } else {
        acc.push({
          date,
          followers: twitterData.followers,
          engagement: ((tweet.metrics.like_count + tweet.metrics.retweet_count) / twitterData.followers * 100).toFixed(1)
        });
      }
      return acc;
    }, []);

    res.json(performanceData);
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Error fetching performance data', error: error.message });
  }
}; 