import express from 'express';
const bcrypt = require('bcryptjs');
import jwt from 'jsonwebtoken';
import { Admin } from '../../models/Admin';

const router = express.Router();

// Admin login endpoint
router.post('/login', async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;

    // Find admin by username
    const admin = await Admin.findByUsername(username);
    if (!admin) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin logout endpoint
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get current admin profile
router.get('/profile', async (req, res) => {
  try {
    // This would normally verify JWT token from req.headers.authorization
    // For now, return a placeholder response
    res.json({
      id: 1,
      username: 'admin',
      role: 'administrator'
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
