import express from 'express';
import pool from '../config/database';
import { authenticate, authorize } from '../middleware/auth';
import bcrypt from 'bcrypt';

const router = express.Router();

// ========================================================
// GET ALL USERS - Menggunakan Stored Procedure
// ========================================================
router.get('/', authenticate, authorize(1), async (req, res) => {
  console.log('📋 [GET ALL USERS] Request received');
  try {
    console.log('🔄 [GET ALL USERS] Calling stored procedure GetAllUsers');
    const [rows]: any = await pool.execute('CALL GetAllUsers()');
    console.log(`✅ [GET ALL USERS] Success - ${rows[0]?.length || 0} users found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ALL USERS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET USER BY ID - Menggunakan Stored Procedure
// ========================================================
router.get('/:id', authenticate, authorize(1), async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [GET USER BY ID] Request received for ID: ${id}`);
  try {
    console.log(`🔄 [GET USER BY ID] Calling stored procedure GetUserById with ID: ${id}`);
    const [rows]: any = await pool.execute('CALL GetUserById(?)', [id]);
    
    if (rows[0].length === 0) {
      console.log(`⚠️ [GET USER BY ID] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    console.log(`✅ [GET USER BY ID] Success for ID: ${id}`);
    res.json(rows[0][0]);
  } catch (error: any) {
    console.error(`❌ [GET USER BY ID] Error for ID: ${id}`, error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET ROLES - Menggunakan Stored Procedure
// ========================================================
router.get('/roles/list', authenticate, authorize(1), async (req, res) => {
  console.log('📋 [GET ROLES] Request received');
  try {
    console.log('🔄 [GET ROLES] Calling stored procedure GetAllRoles');
    const [rows]: any = await pool.execute('CALL GetAllRoles()');
    console.log(`✅ [GET ROLES] Success - ${rows[0]?.length || 0} roles found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET ROLES] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET AVAILABLE DOCTORS - Menggunakan Stored Procedure
// ========================================================
router.get('/dokters/available', authenticate, authorize(1), async (req, res) => {
  console.log('📋 [GET AVAILABLE DOCTORS] Request received');
  try {
    const currentDokterId = req.query.current_dokter_id || null;
    console.log(`🔄 [GET AVAILABLE DOCTORS] Calling stored procedure GetAvailableDoctors with current ID: ${currentDokterId || 'None'}`);
    
    const [rows]: any = await pool.execute(
      'CALL GetAvailableDoctors(?)', 
      [currentDokterId]
    );
    
    console.log(`✅ [GET AVAILABLE DOCTORS] Success - ${rows[0]?.length || 0} doctors found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET AVAILABLE DOCTORS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET AVAILABLE PAWRENTS - Menggunakan Stored Procedure
// ========================================================
router.get('/pawrents/available', authenticate, authorize(1), async (req, res) => {
  console.log('📋 [GET AVAILABLE PAWRENTS] Request received');
  try {
    const currentPawrentId = req.query.current_pawrent_id || null;
    console.log(`🔄 [GET AVAILABLE PAWRENTS] Calling stored procedure GetAvailablePawrents with current ID: ${currentPawrentId || 'None'}`);
    
    const [rows]: any = await pool.execute(
      'CALL GetAvailablePawrents(?)', 
      [currentPawrentId]
    );
    
    console.log(`✅ [GET AVAILABLE PAWRENTS] Success - ${rows[0]?.length || 0} pawrents found`);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('❌ [GET AVAILABLE PAWRENTS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// CREATE USER - Menggunakan Stored Procedure
// ========================================================
router.post('/', authenticate, authorize(1), async (req, res) => {
  console.log('📋 [CREATE USER] Request received');
  console.log('📝 [CREATE USER] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { username, email, password, role_id, is_active, dokter_id, pawrent_id } = req.body;
    
    // Validate required fields
    if (!username || !email || !password || !role_id) {
      return res.status(400).json({ 
        message: 'Username, email, password, dan role wajib diisi' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    // Hash password
    console.log('🔐 [CREATE USER] Hashing password');
    const password_hash = await bcrypt.hash(password, 10);
    
    console.log('🔄 [CREATE USER] Calling stored procedure CreateUser');
    console.log(`📊 [CREATE USER] Parameters: Username: ${username}, Email: ${email}, Role: ${role_id}, Dokter: ${dokter_id || 'None'}, Pawrent: ${pawrent_id || 'None'}`);
    
    const [result]: any = await pool.execute(
      'CALL CreateUser(?, ?, ?, ?, ?, ?, ?)',
      [
        username, 
        email, 
        password_hash, 
        role_id, 
        is_active !== false ? 1 : 0, 
        dokter_id || null, 
        pawrent_id || null
      ]
    );
    
    const newUser = result[0][0];
    console.log(`✅ [CREATE USER] Success - New User ID: ${newUser?.user_id}`);
    res.status(201).json(newUser);
  } catch (error: any) {
    console.error('❌ [CREATE USER] Error:', error);
    console.error('Error details:', error.message);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username atau email sudah terdaftar' });
    }
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// UPDATE USER - Menggunakan Stored Procedure
// ========================================================
router.put('/:id', authenticate, authorize(1), async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [UPDATE USER] Request received for ID: ${id}`);
  console.log('📝 [UPDATE USER] Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { username, email, password, role_id, is_active, dokter_id, pawrent_id } = req.body;
    
    // Validate required fields
    if (!username || !email || !role_id) {
      return res.status(400).json({ 
        message: 'Username, email, dan role wajib diisi' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    // Hash password if provided
    let password_hash = null;
    if (password && password.trim() !== '') {
      console.log('🔐 [UPDATE USER] Hashing new password');
      password_hash = await bcrypt.hash(password, 10);
    }
    
    console.log('🔄 [UPDATE USER] Calling stored procedure UpdateUser');
    console.log(`📊 [UPDATE USER] Parameters: ID: ${id}, Username: ${username}, Email: ${email}, Role: ${role_id}, Password Changed: ${password_hash ? 'Yes' : 'No'}`);
    
    const [result]: any = await pool.execute(
      'CALL UpdateUser(?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        username, 
        email, 
        password_hash, 
        role_id, 
        is_active !== false ? 1 : 0, 
        dokter_id || null, 
        pawrent_id || null
      ]
    );
    
    const updatedUser = result[0][0];
    console.log(`✅ [UPDATE USER] Success for ID: ${id}`);
    res.json(updatedUser);
  } catch (error: any) {
    console.error(`❌ [UPDATE USER] Error for ID: ${id}`, error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Username atau email sudah terdaftar' });
    }
    if (error.sqlState === '45000') {
      return res.status(400).json({ message: error.sqlMessage });
    }
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// DELETE USER - Menggunakan Stored Procedure
// ========================================================
router.delete('/:id', authenticate, authorize(1), async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [DELETE USER] Request received for ID: ${id}`);
  try {
    console.log(`🔄 [DELETE USER] Calling stored procedure DeleteUser for ID: ${id}`);
    const [result]: any = await pool.execute('CALL DeleteUser(?)', [id]);
    
    const affectedRows = result[0][0].affected_rows;

    if (affectedRows === 0) {
      console.log(`⚠️ [DELETE USER] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    console.log(`✅ [DELETE USER] Success - Deleted ID: ${id}`);
    res.json({ message: 'User berhasil dihapus' });
  } catch (error: any) {
    console.error(`❌ [DELETE USER] Error for ID: ${id}`, error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// TOGGLE USER ACTIVE STATUS - Menggunakan Stored Procedure
// ========================================================
router.patch('/:id/toggle-active', authenticate, authorize(1), async (req, res) => {
  const { id } = req.params;
  console.log(`📋 [TOGGLE USER ACTIVE] Request received for ID: ${id}`);
  try {
    console.log(`🔄 [TOGGLE USER ACTIVE] Calling stored procedure ToggleUserActiveStatus for ID: ${id}`);
    const [result]: any = await pool.execute('CALL ToggleUserActiveStatus(?)', [id]);
    
    const updatedUser = result[0][0];
    
    if (!updatedUser) {
      console.log(`⚠️ [TOGGLE USER ACTIVE] Not found for ID: ${id}`);
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    console.log(`✅ [TOGGLE USER ACTIVE] Success for ID: ${id} - New status: ${updatedUser.is_active ? 'Active' : 'Inactive'}`);
    res.json({
      message: `User berhasil ${updatedUser.is_active ? 'diaktifkan' : 'dinonaktifkan'}`,
      data: updatedUser
    });
  } catch (error: any) {
    console.error(`❌ [TOGGLE USER ACTIVE] Error for ID: ${id}`, error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// GET USER STATISTICS - Menggunakan Stored Procedure
// ========================================================
router.get('/stats/summary', authenticate, authorize(1), async (req, res) => {
  console.log('📋 [GET USER STATISTICS] Request received');
  try {
    console.log('🔄 [GET USER STATISTICS] Calling stored procedure GetUserStatistics');
    const [rows]: any = await pool.execute('CALL GetUserStatistics()');
    console.log('✅ [GET USER STATISTICS] Success');
    res.json(rows[0][0]);
  } catch (error: any) {
    console.error('❌ [GET USER STATISTICS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;