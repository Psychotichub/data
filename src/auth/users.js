const fs = require('fs-extra');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Configuration
const USERS_DIR = path.join(__dirname, '../../data/users');
const USERS_FILE = path.join(USERS_DIR, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'psychotic-db-secret-key';
const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = '1d'; // 1 day

// Initialize users system
async function initUsers() {
  try {
    await fs.ensureDir(USERS_DIR);
    
    if (!await fs.pathExists(USERS_FILE)) {
      await fs.writeJson(USERS_FILE, [], { spaces: 2 });
      
      // Create admin user
      await registerUser({
        username: 'admin',
        password: 'admin',
        email: 'admin@psychoticdb.local',
        isAdmin: true
      });
      
      console.log('Users system initialized with default admin user');
    } else {
      console.log('Users system already initialized');
    }
  } catch (error) {
    console.error('Error initializing users system:', error);
    throw error;
  }
}

// Get all users
async function getUsers() {
  try {
    if (!await fs.pathExists(USERS_FILE)) {
      return [];
    }
    return await fs.readJson(USERS_FILE);
  } catch (error) {
    console.error('Error reading users:', error);
    throw error;
  }
}

// Find user by username
async function findUserByUsername(username) {
  try {
    const users = await getUsers();
    return users.find(user => user.username === username);
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
}

// Find user by ID
async function findUserById(userId) {
  try {
    const users = await getUsers();
    return users.find(user => user.id === userId);
  } catch (error) {
    console.error('Error finding user by ID:', error);
    throw error;
  }
}

// Save users
async function saveUsers(users) {
  try {
    await fs.writeJson(USERS_FILE, users, { spaces: 2 });
  } catch (error) {
    console.error('Error saving users:', error);
    throw error;
  }
}

// Register new user
async function registerUser({ username, password, email, isAdmin = false }) {
  try {
    // Check if username already exists
    const users = await getUsers();
    if (users.some(user => user.username === username)) {
      throw new Error(`Username "${username}" is already taken`);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Create user
    const newUser = {
      id: uuidv4(),
      username,
      password: hashedPassword,
      email,
      isAdmin,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    // Save user
    users.push(newUser);
    await saveUsers(users);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

// Login user
async function loginUser(username, password) {
  try {
    // Find user
    const user = await findUserByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }
    
    // Update last login
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex].lastLogin = new Date().toISOString();
    await saveUsers(users);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        isAdmin: user.isAdmin 
      }, 
      JWT_SECRET, 
      { expiresIn: TOKEN_EXPIRES_IN }
    );
    
    // Return token and user data
    const { password: _, ...userWithoutPassword } = users[userIndex];
    return { 
      token, 
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    throw error;
  }
}

// Change password
async function changePassword(userId, currentPassword, newPassword) {
  try {
    // Find user
    const users = await getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Check current password
    const isPasswordValid = await bcrypt.compare(currentPassword, users[userIndex].password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    
    // Update password
    users[userIndex].password = hashedPassword;
    await saveUsers(users);
    
    return { success: true };
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
}

// Update user profile
async function updateUserProfile(userId, updates) {
  try {
    const users = await getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Don't allow updates to sensitive fields
    const { password, id, isAdmin, ...allowedUpdates } = updates;
    
    // Apply updates
    users[userIndex] = {
      ...users[userIndex],
      ...allowedUpdates
    };
    
    await saveUsers(users);
    
    // Return updated user without password
    const { password: _, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// Delete user
async function deleteUser(userId) {
  try {
    const users = await getUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Don't allow deleting the last admin
    if (users[userIndex].isAdmin && users.filter(user => user.isAdmin).length === 1) {
      throw new Error('Cannot delete the last admin user');
    }
    
    // Remove user
    users.splice(userIndex, 1);
    await saveUsers(users);
    
    return { deleted: true, userId };
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Error verifying token:', error);
    throw error;
  }
}

module.exports = {
  initUsers,
  getUsers,
  findUserByUsername,
  findUserById,
  registerUser,
  loginUser,
  changePassword,
  updateUserProfile,
  deleteUser,
  verifyToken
}; 