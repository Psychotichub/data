const { verifyToken, findUserById } = require('./users');

// Authentication middleware
async function authenticate(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Get user
    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Add user to request
    req.user = {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Admin authorization middleware
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Collection owner or admin middleware
// Used to restrict collection operations to the owner or admin
function ownerOrAdmin(req, res, next) {
  const collectionName = req.params.collection || req.params.name;
  
  // If user is admin, allow access
  if (req.user.isAdmin) {
    return next();
  }
  
  // Check if collection name starts with username
  if (collectionName.startsWith(`${req.user.username}_`)) {
    return next();
  }
  
  return res.status(403).json({ 
    error: 'You do not have permission to access this collection' 
  });
}

module.exports = {
  authenticate,
  requireAdmin,
  ownerOrAdmin
}; 