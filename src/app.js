const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// CORS configuration for production and development
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000', // For local development
  'http://127.0.0.1:3000', // Alternative localhost
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'SocialSync Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'SocialSync API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      ai: '/api/ai',
      accounts: '/api/accounts',
      analytics: '/api/analytics'
    }
  });
});

// Routes
const authRoutes = require('./routes/auth');
const aiRoutes = require('./routes/aiRoutes');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);

// Mount specific social media routes first
const metaRoutes = require('./routes/metaRoutes');
app.use('/api/accounts', metaRoutes);

const linkedinRoutes = require('./routes/linkedinRoutes');
app.use('/api/accounts', linkedinRoutes);

const twitterRoutes = require('./routes/twitterRoutes');
app.use('/api/accounts', twitterRoutes);

// Then mount the more general account routes
const accountRoutes = require('./routes/account');
app.use('/api/accounts', accountRoutes);

const analyticsRoutes = require('./routes/analytics');
app.use('/api/analytics', analyticsRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
