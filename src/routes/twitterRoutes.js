const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Account = require('../models/Account');
const twitterService = require('../services/twitterService');

// Twitter OAuth Initiation
router.get('/twitter', authenticateToken, (req, res) => {
  try {
    // Assuming twitterService has getAuthUrl
    const authUrl = twitterService.getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Twitter OAuth initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate Twitter OAuth' });
  }
});

// Twitter OAuth Callback
router.get('/twitter/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.query;
     if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Assuming twitterService has methods for token exchange and profile fetching
    const tokenData = await twitterService.getAccessToken(code);
    const profileData = await twitterService.getUserProfile(tokenData.access_token);

     // Save Twitter account
    const account = new Account({
      userId: req.user.id,
      platform: 'twitter',
      platformId: profileData.id,
      username: profileData.username,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token, // If Twitter provides refresh token
      tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000)
    });

    await account.save();

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=twitter`);
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=twitter_connection_failed`);
  }
});

module.exports = router; 