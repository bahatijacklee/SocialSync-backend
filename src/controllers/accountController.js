const Account = require('../models/Account');
const jwt = require('jsonwebtoken');

// Middleware to get userId from JWT
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

exports.connectAccount = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const { platform, username, accessToken } = req.body;
    const account = new Account({ userId, platform, username, accessToken });
    await account.save();
    res.status(201).json({ accountId: account._id, platform, username });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.listAccounts = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const accounts = await Account.find({ userId });
    res.status(200).json(accounts.map(acc => ({
      accountId: acc._id,
      platform: acc.platform,
      username: acc.username,
      isConnected: true
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.disconnectAccount = async (req, res) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const { id } = req.params;
    const account = await Account.findOneAndDelete({ _id: id, userId });
    if (!account) return res.status(404).json({ message: 'Account not found' });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}; 