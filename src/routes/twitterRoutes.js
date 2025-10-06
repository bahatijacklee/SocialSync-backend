const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Account = require('../models/Account');
const twitterService = require('../services/twitterService');

// X (formerly Twitter) OAuth Initiation
router.get('/x', authenticateToken, (req, res) => {
  try {
    // Assuming twitterService has getAuthUrl
    const authUrl = twitterService.getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('X OAuth initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate X OAuth' });
  }
});

// X (formerly Twitter) OAuth Initiation - Legacy route for backward compatibility
router.get('/twitter', authenticateToken, (req, res) => {
  try {
    // Assuming twitterService has getAuthUrl
    const authUrl = twitterService.getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('X OAuth initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate X OAuth' });
  }
});

// X (formerly Twitter) OAuth Callback
router.get('/x/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.query;
     if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Assuming twitterService has methods for token exchange and profile fetching
    const tokenData = await twitterService.getAccessToken(code);
    const profileData = await twitterService.getUserProfile(tokenData.access_token);

    // Create the account record with platform 'x'
    const newAccount = new Account({
      userId: req.user.id,
      platform: 'x',
      platformId: profileData.id,
      username: profileData.username,
      displayName: profileData.name,
      profileUrl: `https://x.com/${profileData.username}`,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || null,
      tokenExpiry: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null
    });

    const savedAccount = await newAccount.save();
    console.log('X account connected successfully:', savedAccount);

    // Redirect to frontend dashboard
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=x`);
  } catch (error) {
    console.error('X OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=x_connection_failed`);
  }
});

// X (formerly Twitter) OAuth Callback - Legacy route for backward compatibility
router.get('/twitter/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.query;
     if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    // Assuming twitterService has methods for token exchange and profile fetching
    const tokenData = await twitterService.getAccessToken(code);
    const profileData = await twitterService.getUserProfile(tokenData.access_token);

     // Save account as 'x' platform for consistency
    const account = new Account({
      userId: req.user.id,
      platform: 'x',
      platformId: profileData.id,
      username: profileData.username,
      displayName: profileData.name,
      profileUrl: `https://x.com/${profileData.username}`,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token, // If Twitter provides refresh token
      tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000)
    });

    await account.save();

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=x`);
  } catch (error) {
    console.error('X OAuth callback error (legacy route):', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=x_connection_failed`);
  }
});

module.exports = router; 