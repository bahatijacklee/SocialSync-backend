const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Account = require('../models/Account');

// Get all connected accounts
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accounts = await Account.find({ userId: req.user.id });
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

// Get a specific account
router.get('/:platform', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.params;
    const account = await Account.findOne({
      userId: req.user.id,
      platform
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    res.status(500).json({ error: 'Failed to fetch account' });
  }
});

// Delete an account
router.delete('/:platform', authenticateToken, async (req, res) => {
  try {
    const { platform } = req.params;
    const account = await Account.findOneAndDelete({
      userId: req.user.id,
      platform
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    res.json({ message: 'Account disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting account:', error);
    res.status(500).json({ error: 'Failed to disconnect account' });
  }
});

module.exports = router; 