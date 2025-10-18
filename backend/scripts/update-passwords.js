const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function updatePasswords() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'admin_user',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'vet_buddy'
  });

  try {
    console.log('Generating password hashes...');
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);
    
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('');

    // Update semua user dengan password yang sama
    console.log('Updating passwords in database...');
    
    const [result] = await connection.execute(
      'UPDATE User_Login SET password_hash = ? WHERE user_id IN (1, 2, 3)',
      [hash]
    );
    
    console.log(`Updated ${result.affectedRows} users`);
    console.log('');
    
    // Verify
    console.log('Verifying users...');
    const [users] = await connection.execute(
      'SELECT user_id, username, email, role_id FROM User_Login'
    );
    
    console.table(users);
    console.log('');
    console.log('✅ Password update completed successfully!');
    console.log('');
    console.log('You can now login with:');
    console.log('  Admin:   username: admin     | password: password123');
    console.log('  Dokter:  username: drh.budi  | password: password123');
    console.log('  Pawrent: username: johndoe   | password: password123');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

updatePasswords();