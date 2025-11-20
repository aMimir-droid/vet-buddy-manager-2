import express from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execPromise = promisify(exec);
const router = express.Router();

// Directory untuk menyimpan backup
const BACKUP_DIR = path.join(__dirname, '../../backups');

// Pastikan directory backup ada
async function ensureBackupDir() {
  try {
    await fs.access(BACKUP_DIR);
  } catch {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  }
}

// ========================================================
// CREATE BACKUP
// ========================================================
router.post('/', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const { backup_name, description } = req.body;
    
    // Validation
    if (!backup_name || backup_name.trim() === '') {
      return res.status(400).json({ message: 'Nama backup wajib diisi' });
    }

    console.log('🔄 [CREATE BACKUP] Starting backup process...');
    console.log('📝 [CREATE BACKUP] Backup name:', backup_name);
    
    await ensureBackupDir();
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
    const sanitizedName = backup_name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${sanitizedName}_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    console.log('📁 [CREATE BACKUP] File path:', filepath);
    
    // Database credentials
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbName = process.env.DB_NAME || 'vet_buddy';
    const dbUser = process.env.DB_ADMIN_USER || 'admin_user';
    const dbPassword = process.env.DB_ADMIN_PASSWORD || 'admin_user123';
    
    // MySQL bin path - Laragon MySQL
    const mysqlBinPath = process.env.MYSQL_BIN_PATH || 'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin';
    const mysqldumpPath = path.join(mysqlBinPath, 'mysqldump.exe');
    
    // Execute mysqldump command - skip routines to avoid privilege issues
    const command = `"${mysqldumpPath}" -h ${dbHost} -u ${dbUser} -p${dbPassword} --single-transaction --triggers --no-tablespaces ${dbName} > "${filepath}"`;
    
    console.log('⚙️ [CREATE BACKUP] Executing mysqldump...');
    
    try {
      await execPromise(command);
      console.log('✅ [CREATE BACKUP] Mysqldump completed');
    } catch (dumpError: any) {
      console.error('❌ [CREATE BACKUP] Mysqldump error:', dumpError.message);
      return res.status(500).json({ 
        message: 'Gagal melakukan dump database',
        error: dumpError.message 
      });
    }
    
    // Get file size
    let fileSize = 0;
    try {
      const stats = await fs.stat(filepath);
      fileSize = stats.size;
      console.log('📊 [CREATE BACKUP] File size:', fileSize, 'bytes');
    } catch (statError) {
      console.error('⚠️ [CREATE BACKUP] Could not get file size:', statError);
    }
    
    // Record in database - FIX: Remove type annotation
    const insertQuery = `
      INSERT INTO Backup_History 
      (backup_name, description, created_by, file_path, file_size, backup_status, created_at) 
      VALUES (?, ?, ?, ?, ?, 'completed', NOW())
    `;
    
    const [result] = await pool.execute(
      insertQuery,
      [backup_name, description || null, req.user.user_id, filepath, fileSize]
    ) as [ResultSetHeader, any];
    
    console.log('💾 [CREATE BACKUP] Backup record saved, ID:', result.insertId);
    
    // Get created backup with user info - FIX: Remove type annotation
    const selectQuery = `
      SELECT 
        bh.backup_id,
        bh.backup_name,
        bh.description,
        bh.created_at,
        bh.backup_status,
        bh.file_size,
        bh.file_path,
        u.username as created_by_username
      FROM Backup_History bh
      LEFT JOIN User_Login u ON bh.created_by = u.user_id
      WHERE bh.backup_id = ?
    `;
    
    const [backups] = await pool.execute(selectQuery, [result.insertId]) as [RowDataPacket[], any];
    
    console.log('✅ [CREATE BACKUP] Backup completed successfully');
    
    res.json(backups[0]);
    
  } catch (error: any) {
    console.error('❌ [CREATE BACKUP] Error:', error);
    res.status(500).json({ 
      message: 'Gagal membuat backup',
      error: error.message 
    });
  }
});

// ========================================================
// GET ALL BACKUPS
// ========================================================
router.get('/', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    console.log('📋 [GET ALL BACKUPS] Request received');
    
    const query = `
      SELECT 
        bh.backup_id,
        bh.backup_name,
        bh.description,
        bh.created_at,
        bh.backup_status,
        bh.file_size,
        bh.file_path,
        u.username as created_by_username
      FROM Backup_History bh
      LEFT JOIN User_Login u ON bh.created_by = u.user_id
      ORDER BY bh.created_at DESC
    `;
    
    const [backups] = await pool.execute(query) as [RowDataPacket[], any];
    
    console.log(`✅ [GET ALL BACKUPS] Found ${backups.length} backups`);
    
    res.json(backups);
    
  } catch (error: any) {
    console.error('❌ [GET ALL BACKUPS] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: error.message 
    });
  }
});

// ========================================================
// GET BACKUP BY ID
// ========================================================
router.get('/:id', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const { id } = req.params;
    
    console.log(`📋 [GET BACKUP] Request for ID: ${id}`);
    
    const query = `
      SELECT 
        bh.backup_id,
        bh.backup_name,
        bh.description,
        bh.created_at,
        bh.backup_status,
        bh.file_size,
        bh.file_path,
        u.username as created_by_username
      FROM Backup_History bh
      LEFT JOIN User_Login u ON bh.created_by = u.user_id
      WHERE bh.backup_id = ?
    `;
    
    const [backups] = await pool.execute(query, [id]) as [RowDataPacket[], any];
    
    if (backups.length === 0) {
      return res.status(404).json({ message: 'Backup tidak ditemukan' });
    }
    
    console.log(`✅ [GET BACKUP] Found backup: ${backups[0].backup_name}`);
    
    res.json(backups[0]);
    
  } catch (error: any) {
    console.error('❌ [GET BACKUP] Error:', error);
    res.status(500).json({ 
      message: 'Terjadi kesalahan server',
      error: error.message 
    });
  }
});

// ========================================================
// DOWNLOAD BACKUP
// ========================================================
router.get('/:id/download', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const { id } = req.params;
    
    console.log(`📥 [DOWNLOAD BACKUP] Request for ID: ${id}`);
    
    const query = 'SELECT file_path, backup_name FROM Backup_History WHERE backup_id = ?';
    const [rows] = await pool.execute(query, [id]) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Backup tidak ditemukan' });
    }
    
    const { file_path, backup_name } = rows[0];
    
    console.log(`📁 [DOWNLOAD BACKUP] File path: ${file_path}`);
    
    // Check if file exists
    try {
      await fs.access(file_path);
    } catch {
      console.error('❌ [DOWNLOAD BACKUP] File not found on disk');
      return res.status(404).json({ message: 'File backup tidak ditemukan di server' });
    }
    
    console.log(`✅ [DOWNLOAD BACKUP] Sending file: ${backup_name}.sql`);
    
    res.download(file_path, `${backup_name}.sql`, (err) => {
      if (err) {
        console.error('❌ [DOWNLOAD BACKUP] Download error:', err);
      } else {
        console.log('✅ [DOWNLOAD BACKUP] File sent successfully');
      }
    });
    
  } catch (error: any) {
    console.error('❌ [DOWNLOAD BACKUP] Error:', error);
    res.status(500).json({ 
      message: 'Gagal mengunduh backup',
      error: error.message 
    });
  }
});

// ========================================================
// RESTORE BACKUP
// ========================================================
router.post('/:id/restore', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const { id } = req.params;
    
    console.log(`🔄 [RESTORE BACKUP] Starting restore for ID: ${id}`);
    
    const query = 'SELECT file_path, backup_name FROM Backup_History WHERE backup_id = ?';
    const [rows] = await pool.execute(query, [id]) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Backup tidak ditemukan' });
    }
    
    const { file_path, backup_name } = rows[0];
    
    console.log(`📁 [RESTORE BACKUP] Backup name: ${backup_name}`);
    console.log(`📁 [RESTORE BACKUP] File path: ${file_path}`);
    
    // Check if file exists
    try {
      await fs.access(file_path);
    } catch {
      console.error('❌ [RESTORE BACKUP] File not found on disk');
      return res.status(404).json({ message: 'File backup tidak ditemukan di server' });
    }
    
    // BACKUP CURRENT Backup_History table before restore
    console.log('💾 [RESTORE BACKUP] Backing up current Backup_History...');
    const backupHistoryQuery = 'SELECT * FROM Backup_History';
    const [backupHistoryData] = await pool.execute(backupHistoryQuery) as [RowDataPacket[], any];
    
    // Database credentials - use root for restore to avoid privilege issues
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbName = process.env.DB_NAME || 'vet_buddy';
    const dbUser = process.env.DB_ROOT_USER || 'root';
    const dbPassword = process.env.DB_ROOT_PASSWORD || '';
    
    // MySQL bin path - Laragon MySQL
    const mysqlBinPath = process.env.MYSQL_BIN_PATH || 'C:\\laragon\\bin\\mysql\\mysql-8.0.30-winx64\\bin';
    const mysqlPath = path.join(mysqlBinPath, 'mysql.exe');
    
    // Build command based on password availability
    let command;
    if (dbPassword && dbPassword.trim() !== '') {
      command = `"${mysqlPath}" -h ${dbHost} -u ${dbUser} -p${dbPassword} ${dbName} < "${file_path}"`;
    } else {
      command = `"${mysqlPath}" -h ${dbHost} -u ${dbUser} ${dbName} < "${file_path}"`;
    }
    
    console.log('⚙️ [RESTORE BACKUP] Executing mysql restore...');
    
    try {
      await execPromise(command);
      console.log('✅ [RESTORE BACKUP] Restore completed successfully');
      
      // RESTORE Backup_History records
      console.log('🔄 [RESTORE BACKUP] Restoring Backup_History records...');
      
      if (backupHistoryData.length > 0) {
        // Clear current backup history (from restored backup)
        await pool.execute('DELETE FROM Backup_History');
        
        // Re-insert all backup history records
        const insertQuery = `
          INSERT INTO Backup_History 
          (backup_id, backup_name, description, created_by, file_path, file_size, backup_status, created_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        for (const record of backupHistoryData) {
          await pool.execute(insertQuery, [
            record.backup_id,
            record.backup_name,
            record.description,
            record.created_by,
            record.file_path,
            record.file_size,
            record.backup_status,
            record.created_at
          ]);
        }
        
        console.log(`✅ [RESTORE BACKUP] Restored ${backupHistoryData.length} backup history records`);
      }
      
    } catch (restoreError: any) {
      console.error('❌ [RESTORE BACKUP] Restore error:', restoreError.message);
      return res.status(500).json({ 
        message: 'Gagal melakukan restore database',
        error: restoreError.message,
        note: 'File backup tetap tersimpan dan bisa dicoba lagi'
      });
    }
    
    res.json({ 
      message: 'Database berhasil di-restore',
      backup_name: backup_name,
      note: 'File backup tetap tersimpan dan history backup tetap terjaga'
    });
    
  } catch (error: any) {
    console.error('❌ [RESTORE BACKUP] Error:', error);
    res.status(500).json({ 
      message: 'Gagal restore backup',
      error: error.message 
    });
  }
});

// ========================================================
// DELETE BACKUP
// ========================================================
router.delete('/:id', authenticate, authorize(1), async (req: AuthRequest, res) => {
  const pool = req.dbPool;
  
  try {
    const { id } = req.params;
    
    console.log(`🗑️ [DELETE BACKUP] Request for ID: ${id}`);
    
    // Get file path before deleting
    const selectQuery = 'SELECT file_path, backup_name FROM Backup_History WHERE backup_id = ?';
    const [rows] = await pool.execute(selectQuery, [id]) as [RowDataPacket[], any];
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Backup tidak ditemukan' });
    }
    
    const { file_path, backup_name } = rows[0];
    
    console.log(`📁 [DELETE BACKUP] Backup: ${backup_name}`);
    console.log(`📁 [DELETE BACKUP] File path: ${file_path}`);
    
    // Delete file from disk
    try {
      await fs.unlink(file_path);
      console.log('✅ [DELETE BACKUP] File deleted from disk');
    } catch (error) {
      console.warn('⚠️ [DELETE BACKUP] File not found on disk, continuing with database deletion');
    }
    
    // Delete database record
    const deleteQuery = 'DELETE FROM Backup_History WHERE backup_id = ?';
    const [result] = await pool.execute(deleteQuery, [id]) as [ResultSetHeader, any];
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Backup tidak ditemukan' });
    }
    
    console.log('✅ [DELETE BACKUP] Backup deleted successfully');
    
    res.json({ 
      message: 'Backup berhasil dihapus',
      backup_name: backup_name 
    });
    
  } catch (error: any) {
    console.error('❌ [DELETE BACKUP] Error:', error);
    res.status(500).json({ 
      message: 'Gagal menghapus backup',
      error: error.message 
    });
  }
});

export default router;