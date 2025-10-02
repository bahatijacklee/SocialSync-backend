const express = require('express');
const router = express.Router();
const metaService = require('../services/metaService');
const { authenticateToken } = require('../middleware/auth');
const Account = require('../models/Account');

// Redirect to Meta OAuth
router.get('/meta/:platform', authenticateToken, (req, res) => {
  const { platform } = req.params;
  if (!['facebook', 'instagram'].includes(platform)) {
    return res.status(400).json({ error: 'Invalid platform' });
  }
  
  const authUrl = metaService.getAuthUrl(platform);
  res.redirect(authUrl);
});

// Handle Meta OAuth callback
router.get('/meta/callback', authenticateToken, async (req, res) => {
  try {
    const { code, state: platform } = req.query;
    if (!code || !platform) {
      return res.status(400).json({ error: 'Authorization code and platform are required' });
    }

    // Get access token
    const tokenData = await metaService.getAccessToken(code);
    
    // Exchange for long-lived token
    const longLivedToken = await metaService.getLongLivedToken(tokenData.access_token);

    if (platform === 'facebook') {
      // Get Facebook pages
      const pages = await metaService.getFacebookPages(longLivedToken.access_token);
      
      // Save each page as a separate account
      for (const page of pages) {
        const account = new Account({
          userId: req.user.id,
          platform: 'facebook',
          platformId: page.id,
          username: page.name,
          accessToken: page.access_token,
          refreshToken: longLivedToken.access_token,
          tokenExpiresAt: new Date(Date.now() + longLivedToken.expires_in * 1000),
          facebookPageId: page.id,
          facebookPageName: page.name,
          facebookPageCategory: page.category
        });

        await account.save();

        // Check for connected Instagram account
        const instagramAccount = await metaService.getInstagramAccounts(page.id, page.access_token);
        if (instagramAccount) {
          const igAccount = new Account({
            userId: req.user.id,
            platform: 'instagram',
            platformId: instagramAccount.id,
            username: instagramAccount.username,
            accessToken: page.access_token,
            refreshToken: longLivedToken.access_token,
            tokenExpiresAt: new Date(Date.now() + longLivedToken.expires_in * 1000),
            instagramBusinessId: instagramAccount.id,
            instagramAccountType: 'BUSINESS',
            connectedFacebookPageId: page.id
          });

          await igAccount.save();
        }
      }
    } else if (platform === 'instagram') {
      // Handle standalone Instagram account
      const profile = await metaService.getInstagramProfile(longLivedToken.access_token);
      
      const account = new Account({
        userId: req.user.id,
        platform: 'instagram',
        platformId: profile.id,
        username: profile.username,
        accessToken: longLivedToken.access_token,
        refreshToken: longLivedToken.access_token,
        tokenExpiresAt: new Date(Date.now() + longLivedToken.expires_in * 1000),
        instagramBusinessId: profile.id,
        instagramAccountType: profile.account_type || 'PERSONAL'
      });

      await account.save();
    }

    // Redirect to dashboard with success message
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?connected=${platform}`);
  } catch (error) {
    console.error('Meta OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/dashboard?error=meta_connection_failed`);
  }
});

// Get analytics for a specific platform
router.get('/meta/analytics/:platform', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.params;
    
    if (platform === 'instagram') {
      // Get standalone Instagram account
      const account = await Account.findOne({
        userId: req.user.id,
        platform: 'instagram',
        connectedFacebookPageId: { $exists: false }
      });

      if (!account) {
        return res.status(404).json({ error: 'No Instagram account connected' });
      }

      const analytics = await metaService.getInstagramAnalytics(account.platformId, account.accessToken);
      return res.json({ instagram: [analytics] });
    }

    if (platform === 'facebook') {
      // Get Facebook account
      const account = await Account.findOne({
        userId: req.user.id,
        platform: 'facebook'
      });

      if (!account) {
        return res.status(404).json({ error: 'No Facebook account connected' });
      }

      const analytics = await metaService.getFacebookAnalytics(account.platformId, account.accessToken);
      return res.json({ facebook: [analytics] });
    }

    return res.status(400).json({ error: 'Invalid platform' });
  } catch (error) {
    console.error('Error fetching Meta analytics:', error);
    res.status(500).json({ error: 'Failed to fetch Meta analytics' });
  }
});

// Get unified analytics
router.get('/meta/analytics', authenticateToken, async (req, res) => {
  try {
    const account = await Account.findOne({
      userId: req.user.id,
      $or: [
        { platform: 'facebook' },
        { platform: 'instagram', connectedFacebookPageId: { $exists: false } }
      ]
    });

    if (!account) {
      return res.status(404).json({ error: 'No Meta account connected' });
    }

    const analytics = await metaService.getUnifiedAnalytics(account.accessToken);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching Meta analytics:', error);
    res.status(500).json({ error: 'Failed to fetch Meta analytics' });
  }
});

module.exports = router; 