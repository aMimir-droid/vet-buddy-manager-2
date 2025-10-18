import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { adminPool } from '../config/database';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// ========================================================
// PUBLIC ENDPOINTS FOR REGISTRATION (Tambahkan di awal)
// ========================================================

// Get public dokters list
router.get('/public/dokters', async (req, res) => {
  try {
    console.log('📋 [PUBLIC DOKTERS] Request received');
    const [rows] = await adminPool.execute('CALL GetPublicDokters()') as [RowDataPacket[][], any];
    console.log(`✅ [PUBLIC DOKTERS] Success - ${rows[0]?.length || 0} dokters found`);
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [PUBLIC DOKTERS] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get public kliniks list
router.get('/public/kliniks', async (req, res) => {
  try {
    console.log('📋 [PUBLIC KLINIKS] Request received');
    const [rows] = await adminPool.execute('CALL GetPublicKliniks()') as [RowDataPacket[][], any];
    console.log(`✅ [PUBLIC KLINIKS] Success - ${rows[0]?.length || 0} kliniks found`);
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [PUBLIC KLINIKS] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Get public spesialisasi list
router.get('/public/spesialisasi', async (req, res) => {
  try {
    console.log('📋 [PUBLIC SPESIALISASI] Request received');
    const [rows] = await adminPool.execute('CALL GetPublicSpesialisasi()') as [RowDataPacket[][], any];
    console.log(`✅ [PUBLIC SPESIALISASI] Success - ${rows[0]?.length || 0} spesialisasi found`);
    res.json(rows[0]);
  } catch (error) {
    console.error('❌ [PUBLIC SPESIALISASI] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Check username availability
router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ message: 'Username wajib diisi' });
    }

    const [rows] = await adminPool.execute(
      'CALL CheckUsernameAvailability(?)',
      [username]
    ) as [RowDataPacket[][], any];

    const isAvailable = rows[0][0].count === 0;
    res.json({ available: isAvailable });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Check email availability
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email wajib diisi' });
    }

    const [rows] = await adminPool.execute(
      'CALL CheckEmailAvailability(?)',
      [email]
    ) as [RowDataPacket[][], any];

    const isAvailable = rows[0][0].count === 0;
    res.json({ available: isAvailable });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// LOGIN ROUTE
// ========================================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }

    console.log(`🔐 [LOGIN] Attempt for user: ${username}`);

    const [users] = await adminPool.execute(
      `SELECT u.*, r.role_name 
       FROM User_Login u 
       JOIN Role r ON u.role_id = r.role_id 
       WHERE u.username = ?`,
      [username]
    ) as [RowDataPacket[], any];

    if (users.length === 0) {
      console.log(`❌ [LOGIN] User not found: ${username}`);
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const user = users[0];

    if (!user.is_active) {
      console.log(`❌ [LOGIN] Inactive user: ${username}`);
      return res.status(401).json({ message: 'Akun tidak aktif. Hubungi administrator.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log(`❌ [LOGIN] Invalid password for user: ${username}`);
      return res.status(401).json({ message: 'Username atau password salah' });
    }

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

    console.log(`✅ [LOGIN] Success for user: ${username} (role_id: ${user.role_id})`);

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
        dokter_id: user.dokter_id,
        pawrent_id: user.pawrent_id,
        is_active: user.is_active
      }
    });

  } catch (error) {
    console.error('❌ [LOGIN] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// REGISTER ROUTE - Using Stored Procedures
// ========================================================
router.post('/register', async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      role_id,
      pawrent_data,
      dokter_data
    } = req.body;

    console.log(`🔐 [REGISTER] Attempt for user: ${username}, role: ${role_id}`);

    // Validate input
    if (!username || !email || !password || !role_id) {
      return res.status(400).json({ 
        message: 'Username, email, password, dan role wajib diisi' 
      });
    }

    // Only allow Pawrent (3) or Dokter (2) to register
    if (![2, 3].includes(role_id)) {
      return res.status(400).json({ 
        message: 'Hanya role Dokter atau Pawrent yang dapat mendaftar' 
      });
    }

    // Validate role-specific data
    if (role_id === 3 && !pawrent_data) {
      return res.status(400).json({ message: 'Data Pawrent wajib diisi' });
    }
    if (role_id === 2 && !dokter_data) {
      return res.status(400).json({ message: 'Data Dokter wajib diisi' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    let result: any = null;

    // ========================================================
    // REGISTER PAWRENT - Using Stored Procedure
    // ========================================================
    if (role_id === 3) {
      const {
        nama_depan_pawrent,
        nama_belakang_pawrent,
        alamat_pawrent,
        kota_pawrent,
        kode_pos_pawrent,
        nomor_hp,
        dokter_id
      } = pawrent_data;

      // Validate required fields
      if (!nama_depan_pawrent || !nama_belakang_pawrent || !nomor_hp || !dokter_id) {
        return res.status(400).json({ 
          message: 'Nama depan, nama belakang, nomor HP, dan dokter wajib diisi' 
        });
      }

      try {
        const [rows] = await adminPool.execute(
          'CALL RegisterPawrent(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            username,
            email,
            password_hash,
            nama_depan_pawrent,
            nama_belakang_pawrent,
            alamat_pawrent || null,
            kota_pawrent || null,
            kode_pos_pawrent || null,
            nomor_hp,
            dokter_id
          ]
        ) as [RowDataPacket[][], any];

        result = rows[0][0];
        console.log(`✅ [REGISTER] Pawrent created:`, result);

      } catch (error: any) {
        console.error('❌ [REGISTER PAWRENT] Error:', error);
        
        // Handle specific error messages from stored procedure
        if (error.sqlMessage) {
          return res.status(400).json({ message: error.sqlMessage });
        }
        throw error;
      }
    }

    // ========================================================
    // REGISTER DOKTER - Using Stored Procedure
    // ========================================================
    if (role_id === 2) {
      const {
        title_dokter,
        nama_dokter,
        telepon_dokter,
        tanggal_mulai_kerja,
        spesialisasi_id,
        klinik_id
      } = dokter_data;

      // Validate required fields
      if (!title_dokter || !nama_dokter) {
        return res.status(400).json({ 
          message: 'Title dokter dan nama dokter wajib diisi' 
        });
      }

      try {
        const [rows] = await adminPool.execute(
          'CALL RegisterDokter(?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            username,
            email,
            password_hash,
            title_dokter,
            nama_dokter,
            telepon_dokter || null,
            tanggal_mulai_kerja || null,
            spesialisasi_id || null,
            klinik_id || null
          ]
        ) as [RowDataPacket[][], any];

        result = rows[0][0];
        console.log(`✅ [REGISTER] Dokter created:`, result);

      } catch (error: any) {
        console.error('❌ [REGISTER DOKTER] Error:', error);
        
        // Handle specific error messages from stored procedure
        if (error.sqlMessage) {
          return res.status(400).json({ message: error.sqlMessage });
        }
        throw error;
      }
    }

    // ========================================================
    // CHECK IF RESULT EXISTS
    // ========================================================
    if (!result) {
      console.error('❌ [REGISTER] No result returned from stored procedure');
      return res.status(500).json({ 
        message: 'Registrasi gagal. Silakan coba lagi.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: result.user_id, 
        username: result.username,
        role_id: result.role_id,
        dokter_id: result.dokter_id || null,
        pawrent_id: result.pawrent_id || null
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    console.log(`✅ [REGISTER] Success for user: ${username} (user_id: ${result.user_id})`);

    res.status(201).json({
      message: 'Registrasi berhasil',
      token,
      user: {
        user_id: result.user_id,
        username: result.username,
        email: result.email,
        role_id: result.role_id,
        dokter_id: result.dokter_id || null,
        pawrent_id: result.pawrent_id || null,
        full_name: result.full_name,
        is_active: result.is_active
      }
    });

  } catch (error: any) {
    console.error('❌ [REGISTER] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========================================================
// LOGIN ROUTE
// ========================================================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }

    console.log(`🔐 [LOGIN] Attempt for user: ${username}`);

    const [users] = await adminPool.execute(
      `SELECT u.*, r.role_name 
       FROM User_Login u 
       JOIN Role r ON u.role_id = r.role_id 
       WHERE u.username = ?`,
      [username]
    ) as [RowDataPacket[], any];

    if (users.length === 0) {
      console.log(`❌ [LOGIN] User not found: ${username}`);
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const user = users[0];

    if (!user.is_active) {
      console.log(`❌ [LOGIN] Inactive user: ${username}`);
      return res.status(401).json({ message: 'Akun tidak aktif. Hubungi administrator.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      console.log(`❌ [LOGIN] Invalid password for user: ${username}`);
      return res.status(401).json({ message: 'Username atau password salah' });
    }

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

    console.log(`✅ [LOGIN] Success for user: ${username} (role_id: ${user.role_id})`);

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        role_id: user.role_id,
        role_name: user.role_name,
        dokter_id: user.dokter_id,
        pawrent_id: user.pawrent_id,
        is_active: user.is_active
      }
    });

  } catch (error) {
    console.error('❌ [LOGIN] Error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ========================================================
// REGISTER ROUTE - Using Stored Procedures
// ========================================================
router.post('/register', async (req, res) => {
  try {
    const { 
      username, 
      email, 
      password, 
      role_id,
      pawrent_data,
      dokter_data
    } = req.body;

    console.log(`🔐 [REGISTER] Attempt for user: ${username}, role: ${role_id}`);

    // Validate input
    if (!username || !email || !password || !role_id) {
      return res.status(400).json({ 
        message: 'Username, email, password, dan role wajib diisi' 
      });
    }

    // Only allow Pawrent (3) or Dokter (2) to register
    if (![2, 3].includes(role_id)) {
      return res.status(400).json({ 
        message: 'Hanya role Dokter atau Pawrent yang dapat mendaftar' 
      });
    }

    // Validate role-specific data
    if (role_id === 3 && !pawrent_data) {
      return res.status(400).json({ message: 'Data Pawrent wajib diisi' });
    }
    if (role_id === 2 && !dokter_data) {
      return res.status(400).json({ message: 'Data Dokter wajib diisi' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    let result: any = null;

    // ========================================================
    // REGISTER PAWRENT - Using Stored Procedure
    // ========================================================
    if (role_id === 3) {
      const {
        nama_depan_pawrent,
        nama_belakang_pawrent,
        alamat_pawrent,
        kota_pawrent,
        kode_pos_pawrent,
        nomor_hp,
        dokter_id
      } = pawrent_data;

      // Validate required fields
      if (!nama_depan_pawrent || !nama_belakang_pawrent || !nomor_hp || !dokter_id) {
        return res.status(400).json({ 
          message: 'Nama depan, nama belakang, nomor HP, dan dokter wajib diisi' 
        });
      }

      try {
        const [rows] = await adminPool.execute(
          'CALL RegisterPawrent(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            username,
            email,
            password_hash,
            nama_depan_pawrent,
            nama_belakang_pawrent,
            alamat_pawrent || null,
            kota_pawrent || null,
            kode_pos_pawrent || null,
            nomor_hp,
            dokter_id
          ]
        ) as [RowDataPacket[][], any];

        result = rows[0][0];
        console.log(`✅ [REGISTER] Pawrent created:`, result);

      } catch (error: any) {
        console.error('❌ [REGISTER PAWRENT] Error:', error);
        
        // Handle specific error messages from stored procedure
        if (error.sqlMessage) {
          return res.status(400).json({ message: error.sqlMessage });
        }
        throw error;
      }
    }

    // ========================================================
    // REGISTER DOKTER - Using Stored Procedure
    // ========================================================
    if (role_id === 2) {
      const {
        title_dokter,
        nama_dokter,
        telepon_dokter,
        tanggal_mulai_kerja,
        spesialisasi_id,
        klinik_id
      } = dokter_data;

      // Validate required fields
      if (!title_dokter || !nama_dokter) {
        return res.status(400).json({ 
          message: 'Title dokter dan nama dokter wajib diisi' 
        });
      }

      try {
        const [rows] = await adminPool.execute(
          'CALL RegisterDokter(?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            username,
            email,
            password_hash,
            title_dokter,
            nama_dokter,
            telepon_dokter || null,
            tanggal_mulai_kerja || null,
            spesialisasi_id || null,
            klinik_id || null
          ]
        ) as [RowDataPacket[][], any];

        result = rows[0][0];
        console.log(`✅ [REGISTER] Dokter created:`, result);

      } catch (error: any) {
        console.error('❌ [REGISTER DOKTER] Error:', error);
        
        // Handle specific error messages from stored procedure
        if (error.sqlMessage) {
          return res.status(400).json({ message: error.sqlMessage });
        }
        throw error;
      }
    }

    // ========================================================
    // CHECK IF RESULT EXISTS
    // ========================================================
    if (!result) {
      console.error('❌ [REGISTER] No result returned from stored procedure');
      return res.status(500).json({ 
        message: 'Registrasi gagal. Silakan coba lagi.' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        user_id: result.user_id, 
        username: result.username,
        role_id: result.role_id,
        dokter_id: result.dokter_id || null,
        pawrent_id: result.pawrent_id || null
      },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '24h' }
    );

    console.log(`✅ [REGISTER] Success for user: ${username} (user_id: ${result.user_id})`);

    res.status(201).json({
      message: 'Registrasi berhasil',
      token,
      user: {
        user_id: result.user_id,
        username: result.username,
        email: result.email,
        role_id: result.role_id,
        dokter_id: result.dokter_id || null,
        pawrent_id: result.pawrent_id || null,
        full_name: result.full_name,
        is_active: result.is_active
      }
    });

  } catch (error: any) {
    console.error('❌ [REGISTER] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;