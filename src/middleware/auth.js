const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // If no token in header, check query parameter (for redirects)
  if (!token && req.query.token) {
    req.token = req.query.token; // Store the token on the request object
    // Optionally, remove from query to keep URLs clean after processing
    delete req.query.token;
  }

  // Use the token from either header or query parameter
  const finalToken = token || req.token;

  if (!finalToken) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(finalToken, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

module.exports = { authenticateToken }; 