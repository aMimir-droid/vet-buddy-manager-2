const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'password123';
  const hash = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hash:', hash);
  
  // Test verify
  const isValid = await bcrypt.compare(password, hash);
  console.log('Verification:', isValid);
}

generateHash();