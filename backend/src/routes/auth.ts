import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [users] = await pool.execute(
      'SELECT * FROM User_Login WHERE username = ? AND is_active = TRUE',
      [username]
    ) as [RowDataPacket[], any];

    if (users.length === 0) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    // Update last login
    await pool.execute(
      'UPDATE User_Login SET last_login = NOW() WHERE user_id = ?',
      [user.user_id]
    );

    const token = jwt.sign(
      { 
        user_id: user.user_id, 
        username: user.username,
        role_id: user.role_id,
        dokter_id: user.dokter_id,
        pawrent_id: user.pawrent_id
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        dokter_id: user.dokter_id,
        pawrent_id: user.pawrent_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

export default router;