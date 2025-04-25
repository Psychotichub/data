const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const { initDB } = require('./db/database');
const { initUsers } = require('./auth/users');
const { initIndexes } = require('./indexes/indexManager');
const { initBackups } = require('./backup/backupManager');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration for external access
const corsOptions = {
  origin: '*', // Allow all origins (you can restrict this in production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

// Middleware
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Import routes
const collectionsRouter = require('./api/collections');
const documentsRouter = require('./api/documents');
const authRouter = require('./api/auth');
const indexesRouter = require('./api/indexes');
const aggregationRouter = require('./api/aggregation');
const backupRouter = require('./api/backup');

// Routes
app.use('/api/collections', collectionsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/auth', authRouter);
app.use('/api/indexes', indexesRouter);
app.use('/api/aggregation', aggregationRouter);
app.use('/api/backups', backupRouter);

// Home route - serve the web UI
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    name: 'PsychoticDB',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Initialize systems and start the server
async function start() {
  try {
    // Initialize all systems
    await initDB();
    await initUsers();
    await initIndexes();
    await initBackups();
    
    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`PsychoticDB server running on port ${PORT}`);
      console.log(`Access the web interface at http://localhost:${PORT}`);
      console.log(`External API available at http://YOUR_IP:${PORT}/api`);
    });
  } catch (err) {
    console.error('Failed to initialize systems:', err);
    process.exit(1);
  }
}

// Start the application
start(); 