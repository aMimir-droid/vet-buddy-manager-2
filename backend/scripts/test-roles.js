const mysql = require('mysql2/promise');
require('dotenv').config();

async function testRoleAccess() {
  console.log('🧪 Testing Role-Based Database Access\n');

  const configs = [
    {
      name: 'Admin',
      user: process.env.DB_ADMIN_USER || 'admin_user',
      password: process.env.DB_ADMIN_PASSWORD || ''
    },
    {
      name: 'Vet',
      user: process.env.DB_VET_USER || 'vet_user',
      password: process.env.DB_VET_PASSWORD || ''
    },
    {
      name: 'Pawrent',
      user: process.env.DB_PAWRENT_USER || 'pawrent_user',
      password: process.env.DB_PAWRENT_PASSWORD || ''
    }
  ];

  for (const config of configs) {
    console.log(`\n📝 Testing ${config.name} access (${config.user}):`);
    
    try {
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: config.user,
        password: config.password,
        database: process.env.DB_NAME || 'vet_buddy'
      });

      // Test SELECT on Kunjungan
      try {
        await connection.execute('SELECT COUNT(*) as count FROM Kunjungan');
        console.log(`  ✅ SELECT on Kunjungan: GRANTED`);
      } catch (error: any) {
        console.log(`  ❌ SELECT on Kunjungan: DENIED (${error.code})`);
      }

      // Test INSERT on Kunjungan
      try {
        await connection.execute(
          'INSERT INTO Kunjungan (hewan_id, dokter_id, tanggal_kunjungan, waktu_kunjungan, total_biaya, metode_pembayaran) VALUES (1, 1, CURDATE(), CURTIME(), 100000, "Cash")'
        );
        // Rollback
        await connection.execute('DELETE FROM Kunjungan WHERE kunjungan_id = LAST_INSERT_ID()');
        console.log(`  ✅ INSERT on Kunjungan: GRANTED`);
      } catch (error: any) {
        console.log(`  ❌ INSERT on Kunjungan: DENIED (${error.code})`);
      }

      // Test DELETE on Kunjungan
      try {
        await connection.execute('DELETE FROM Kunjungan WHERE kunjungan_id = 999999');
        console.log(`  ✅ DELETE on Kunjungan: GRANTED`);
      } catch (error: any) {
        console.log(`  ❌ DELETE on Kunjungan: DENIED (${error.code})`);
      }

      await connection.end();
    } catch (error: any) {
      console.log(`  ❌ Connection failed: ${error.message}`);
    }
  }

  console.log('\n✅ Testing complete!');
}

testRoleAccess();