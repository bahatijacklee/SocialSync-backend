const express = require('express');
const router = express.Router();
const instagramService = require('../services/instagramService');
const { authenticateToken } = require('../middleware/auth');
const Account = require('../models/Account');

// Redirect to Instagram OAuth
router.get('/instagram', authenticateToken, (req, res) => {
  const authUrl = instagramService.getAuthUrl();
  res.redirect(authUrl);
});

// Handle Instagram OAuth callback
router.get('/instagram/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Get short-lived access token
    const tokenData = await instagramService.getAccessToken(code);
    
    // Exchange for long-lived token
    const longLivedToken = await instagramService.getLongLivedToken(tokenData.access_token);
    
    // Get user profile
    const profile = await instagramService.getUserProfile(longLivedToken.access_token);

    // Save account to database
    const account = new Account({
      userId: req.user.id,
      platform: 'instagram',
      platformId: profile.id,
      username: profile.username,
      accessToken: longLivedToken.access_token,
      refreshToken: longLivedToken.refresh_token,
      tokenExpiresAt: new Date(Date.now() + longLivedToken.expires_in * 1000)
    });

    await account.save();

    // Redirect to dashboard with success message
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=instagram`);
  } catch (error) {
    console.error('Instagram OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=instagram_connection_failed`);
  }
});

// Get Instagram analytics
router.get('/instagram/analytics', authenticateToken, async (req, res) => {
  try {
    const account = await Account.findOne({
      userId: req.user.id,
      platform: 'instagram'
    });

    if (!account) {
      return res.status(404).json({ error: 'Instagram account not connected' });
    }

    const analytics = await instagramService.getAccountAnalytics(account.accessToken);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching Instagram analytics:', error);
    res.status(500).json({ error: 'Failed to fetch Instagram analytics' });
  }
});

module.exports = router; 