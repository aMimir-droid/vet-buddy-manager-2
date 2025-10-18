import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, authorize(1), async (req, res) => {
  try {
    console.log('Fetching all users...');
    
    const [rows] = await pool.execute(`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        u.is_active,
        u.last_login,
        u.created_at,
        u.dokter_id,
        u.pawrent_id,
        COALESCE(r.role_name, 'Unknown') as role_name,
        COALESCE(r.description, '') as role_description,
        d.nama_dokter,
        d.title_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        p.nomor_hp as telepon_pawrent
      FROM User_Login u
      LEFT JOIN Role r ON u.role_id = r.role_id
      LEFT JOIN Dokter d ON u.dokter_id = d.dokter_id
      LEFT JOIN Pawrent p ON u.pawrent_id = p.pawrent_id
      ORDER BY u.created_at DESC
    `) as [RowDataPacket[], any];
    
    console.log('Users fetched successfully:', rows.length);
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticate, authorize(1), async (req, res) => {
  try {
    console.log('Fetching user by id:', req.params.id);
    
    const [rows] = await pool.execute(`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        u.is_active,
        u.last_login,
        u.created_at,
        u.dokter_id,
        u.pawrent_id,
        COALESCE(r.role_name, 'Unknown') as role_name,
        COALESCE(r.description, '') as role_description,
        d.nama_dokter,
        d.title_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        p.nomor_hp as telepon_pawrent
      FROM User_Login u
      LEFT JOIN Role r ON u.role_id = r.role_id
      LEFT JOIN Dokter d ON u.dokter_id = d.dokter_id
      LEFT JOIN Pawrent p ON u.pawrent_id = p.pawrent_id
      WHERE u.user_id = ?
    `, [req.params.id]) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    console.log('User fetched successfully');
    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error fetching user by id:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get available roles (moved before other routes to avoid conflicts)
router.get('/roles/list', authenticate, authorize(1), async (req, res) => {
  try {
    console.log('Fetching roles...');
    
    const [rows] = await pool.execute(`
      SELECT role_id, role_name, description 
      FROM Role 
      ORDER BY role_id
    `) as [RowDataPacket[], any];
    
    console.log('Roles fetched successfully:', rows.length);
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get available doctors (for linking user to doctor)
router.get('/dokters/available', authenticate, authorize(1), async (req, res) => {
  try {
    console.log('Fetching available doctors...');
    
    const currentDokterId = req.query.current_dokter_id || null;
    
    const [rows] = await pool.execute(`
      SELECT 
        d.dokter_id,
        d.nama_dokter,
        d.title_dokter,
        u.user_id
      FROM Dokter d
      LEFT JOIN User_Login u ON d.dokter_id = u.dokter_id
      WHERE u.user_id IS NULL ${currentDokterId ? 'OR d.dokter_id = ?' : ''}
      ORDER BY d.nama_dokter
    `, currentDokterId ? [currentDokterId] : []) as [RowDataPacket[], any];
    
    console.log('Available doctors fetched:', rows.length);
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching available doctors:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get available pawrents (for linking user to pawrent)
router.get('/pawrents/available', authenticate, authorize(1), async (req, res) => {
  try {
    console.log('Fetching available pawrents...');
    
    const currentPawrentId = req.query.current_pawrent_id || null;
    
    const [rows] = await pool.execute(`
      SELECT 
        p.pawrent_id,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent,
        p.nomor_hp,
        u.user_id
      FROM Pawrent p
      LEFT JOIN User_Login u ON p.pawrent_id = u.pawrent_id
      WHERE u.user_id IS NULL ${currentPawrentId ? 'OR p.pawrent_id = ?' : ''}
      ORDER BY p.nama_depan_pawrent, p.nama_belakang_pawrent
    `, currentPawrentId ? [currentPawrentId] : []) as [RowDataPacket[], any];
    
    console.log('Available pawrents fetched:', rows.length);
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching available pawrents:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create user (admin only)
router.post('/', authenticate, authorize(1), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { username, email, password, role_id, is_active, dokter_id, pawrent_id } = req.body;
    
    console.log('Creating user:', { username, email, role_id, is_active, dokter_id, pawrent_id });
    
    // Validate required fields
    if (!username || !email || !password || !role_id) {
      await connection.rollback();
      return res.status(400).json({ message: 'Username, email, password, dan role wajib diisi' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Check if dokter_id is already linked to another user
    if (dokter_id) {
      const [existingDokter] = await connection.execute(
        'SELECT user_id FROM User_Login WHERE dokter_id = ?',
        [dokter_id]
      ) as [RowDataPacket[], any];
      
      if (existingDokter.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: 'Dokter ini sudah terhubung dengan user lain' });
      }
    }

    // Check if pawrent_id is already linked to another user
    if (pawrent_id) {
      const [existingPawrent] = await connection.execute(
        'SELECT user_id FROM User_Login WHERE pawrent_id = ?',
        [pawrent_id]
      ) as [RowDataPacket[], any];
      
      if (existingPawrent.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: 'Pawrent ini sudah terhubung dengan user lain' });
      }
    }
    
    const [result] = await connection.execute(
      'INSERT INTO User_Login (username, email, password_hash, role_id, is_active, dokter_id, pawrent_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, password_hash, role_id, is_active !== false ? 1 : 0, dokter_id || null, pawrent_id || null]
    ) as [ResultSetHeader, any];
    
    const [newUser] = await connection.execute(`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        u.is_active,
        u.dokter_id,
        u.pawrent_id,
        COALESCE(r.role_name, 'Unknown') as role_name,
        d.nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent
      FROM User_Login u
      LEFT JOIN Role r ON u.role_id = r.role_id
      LEFT JOIN Dokter d ON u.dokter_id = d.dokter_id
      LEFT JOIN Pawrent p ON u.pawrent_id = p.pawrent_id
      WHERE u.user_id = ?
    `, [result.insertId]) as [RowDataPacket[], any];
    
    await connection.commit();
    console.log('User created successfully:', newUser[0].username);
    res.status(201).json(newUser[0]);
  } catch (error: any) {
    await connection.rollback();
    console.error('Error creating user:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username atau email sudah digunakan' });
    }
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
});

// Update user (admin only)
router.put('/:id', authenticate, authorize(1), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { username, email, password, role_id, is_active, dokter_id, pawrent_id } = req.body;
    
    console.log('Updating user:', req.params.id, { username, email, role_id, is_active, dokter_id, pawrent_id });
    
    // Validate required fields
    if (!username || !email || !role_id) {
      await connection.rollback();
      return res.status(400).json({ message: 'Username, email, dan role wajib diisi' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await connection.rollback();
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    // Check if dokter_id is already linked to another user
    if (dokter_id) {
      const [existingDokter] = await connection.execute(
        'SELECT user_id FROM User_Login WHERE dokter_id = ? AND user_id != ?',
        [dokter_id, req.params.id]
      ) as [RowDataPacket[], any];
      
      if (existingDokter.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: 'Dokter ini sudah terhubung dengan user lain' });
      }
    }

    // Check if pawrent_id is already linked to another user
    if (pawrent_id) {
      const [existingPawrent] = await connection.execute(
        'SELECT user_id FROM User_Login WHERE pawrent_id = ? AND user_id != ?',
        [pawrent_id, req.params.id]
      ) as [RowDataPacket[], any];
      
      if (existingPawrent.length > 0) {
        await connection.rollback();
        return res.status(400).json({ message: 'Pawrent ini sudah terhubung dengan user lain' });
      }
    }
    
    let query = 'UPDATE User_Login SET username = ?, email = ?, role_id = ?, is_active = ?, dokter_id = ?, pawrent_id = ?';
    let params: any[] = [username, email, role_id, is_active !== false ? 1 : 0, dokter_id || null, pawrent_id || null];
    
    // Update password jika diberikan
    if (password && password.trim() !== '') {
      const password_hash = await bcrypt.hash(password, 10);
      query += ', password_hash = ?';
      params.push(password_hash);
    }
    
    query += ' WHERE user_id = ?';
    params.push(req.params.id);
    
    await connection.execute(query, params);
    
    const [updated] = await connection.execute(`
      SELECT 
        u.user_id,
        u.username,
        u.email,
        u.role_id,
        u.is_active,
        u.dokter_id,
        u.pawrent_id,
        COALESCE(r.role_name, 'Unknown') as role_name,
        d.nama_dokter,
        CONCAT(p.nama_depan_pawrent, ' ', p.nama_belakang_pawrent) as nama_pawrent
      FROM User_Login u
      LEFT JOIN Role r ON u.role_id = r.role_id
      LEFT JOIN Dokter d ON u.dokter_id = d.dokter_id
      LEFT JOIN Pawrent p ON u.pawrent_id = p.pawrent_id
      WHERE u.user_id = ?
    `, [req.params.id]) as [RowDataPacket[], any];
    
    await connection.commit();
    console.log('User updated successfully:', updated[0].username);
    res.json(updated[0]);
  } catch (error: any) {
    await connection.rollback();
    console.error('Error updating user:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username atau email sudah digunakan' });
    }
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    connection.release();
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorize(1), async (req, res) => {
  try {
    console.log('Deleting user:', req.params.id);
    
    // Prevent deleting own account
    if ((req as any).user.user_id === parseInt(req.params.id)) {
      return res.status(400).json({ message: 'Tidak dapat menghapus akun sendiri' });
    }

    await pool.execute('DELETE FROM User_Login WHERE user_id = ?', [req.params.id]);
    console.log('User deleted successfully');
    res.json({ message: 'User berhasil dihapus' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Toggle user active status
router.patch('/:id/toggle-active', authenticate, authorize(1), async (req, res) => {
  try {
    console.log('Toggling user active status:', req.params.id);
    
    await pool.execute(
      'UPDATE User_Login SET is_active = NOT is_active WHERE user_id = ?',
      [req.params.id]
    );
    
    const [updated] = await pool.execute(
      'SELECT user_id, username, is_active FROM User_Login WHERE user_id = ?',
      [req.params.id]
    ) as [RowDataPacket[], any];
    
    console.log('User status toggled successfully');
    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;