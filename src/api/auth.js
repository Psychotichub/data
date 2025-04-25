const express = require('express');
const router = express.Router();
const {
  getUsers,
  registerUser,
  loginUser,
  changePassword,
  updateUserProfile,
  deleteUser
} = require('../auth/users');
const { authenticate, requireAdmin } = require('../auth/middleware');

// Register a new user (admin only)
router.post('/register', authenticate, requireAdmin, async (req, res) => {
  try {
    const { username, password, email, isAdmin } = req.body;
    
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, password, and email are required' });
    }
    
    const user = await registerUser({ username, password, email, isAdmin });
    res.status(201).json(user);
  } catch (error) {
    if (error.message.includes('already taken')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const result = await loginUser(username, password);
    res.json(result);
  } catch (error) {
    if (error.message.includes('Invalid username or password')) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    const result = await changePassword(req.user.id, currentPassword, newPassword);
    res.json(result);
  } catch (error) {
    if (error.message.includes('incorrect')) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const updates = req.body;
    const user = await updateUserProfile(req.user.id, updates);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (admin only)
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await getUsers();
    // Remove passwords from response
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    res.json(sanitizedUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a user (admin only)
router.delete('/users/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const result = await deleteUser(userId);
    res.json(result);
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('Cannot delete')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

module.exports = router; 