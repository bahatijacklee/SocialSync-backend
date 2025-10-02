const express = require('express');
const router = express.Router();
const Account = require('../models/Account');
const axios = require('axios');

// LinkedIn OAuth endpoints
router.get('/linkedin', (req, res) => {
  const state = Math.random().toString(36).substring(2);
  const scope = [
    'r_liteprofile',
    'r_emailaddress',
    'w_member_social',
    'r_organization_social',
    'rw_organization_admin',
    'r_organization_admin',
    'r_organization_followers',
    'r_organization_page_statistics',
    'r_organization_social',
  ].join(' ');
  const redirectUri = encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI);
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${encodeURIComponent(scope)}`;
  res.redirect(authUrl);
});

router.get('/linkedin/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('No code provided');
  try {
    // Exchange code for access token
    const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    const accessToken = tokenRes.data.access_token;

    // Get user profile (to get LinkedIn ID and name)
    const profileRes = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const linkedinId = profileRes.data.id;
    const firstName = profileRes.data.localizedFirstName;
    const lastName = profileRes.data.localizedLastName;

    // Save account (assumes user is logged in and userId is in session/cookie/JWT)
    // For demo, you may need to adjust how you get userId
    const userId = req.user?.userId || req.session?.userId; // Adjust as needed
    if (!userId) return res.status(401).send('User not authenticated');

    await Account.findOneAndUpdate(
      { userId, platform: 'LinkedIn' },
      {
        userId,
        platform: 'LinkedIn',
        username: `${firstName} ${lastName}`,
        accessToken,
        connectedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Redirect to dashboard or show success
    res.redirect('/dashboard/profile');
  } catch (error) {
    console.error('LinkedIn OAuth error:', error.response?.data || error.message);
    res.status(500).send('LinkedIn authentication failed');
  }
});

module.exports = router; 