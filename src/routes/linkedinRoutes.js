const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Account = require('../models/Account');
const linkedinService = require('../services/linkedinService');

// LinkedIn OAuth Initiation
router.get('/linkedin', authenticateToken, (req, res) => {
  try {
    const authUrl = linkedinService.getAuthUrl(); // Assuming linkedinService has getAuthUrl
    res.redirect(authUrl);
  } catch (error) {
    console.error('LinkedIn OAuth initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate LinkedIn OAuth' });
  }
});

// LinkedIn OAuth Callback
router.get('/linkedin/callback', authenticateToken, async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }
    
    const tokenData = await linkedinService.getAccessToken(code); // Assuming linkedinService has getAccessToken
    const profileData = await linkedinService.getUserProfile(tokenData.access_token); // Assuming linkedinService has getUserProfile

    // Save LinkedIn account
    const account = new Account({
      userId: req.user.id,
      platform: 'linkedin',
      platformId: profileData.id,
      username: `${profileData.localizedFirstName} ${profileData.localizedLastName}`,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token, // If LinkedIn provides refresh token
      tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000)
    });

    await account.save();

    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=linkedin`);
  } catch (error) {
    console.error('LinkedIn OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=linkedin_connection_failed`);
  }
});

module.exports = router; 