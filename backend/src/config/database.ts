import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create separate connection pools for each role
const createPool = (user: string, password: string) => {
  return mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: user,
    password: password,
    database: process.env.DB_NAME || 'vet_buddy',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
};

// Admin pool
export const adminPool = createPool(
  process.env.DB_ADMIN_USER || 'admin_user',
  process.env.DB_ADMIN_PASSWORD || ''
);

// Vet pool
export const vetPool = createPool(
  process.env.DB_VET_USER || 'vet_user',
  process.env.DB_VET_PASSWORD || ''
);

// Pawrent pool
export const pawrentPool = createPool(
  process.env.DB_PAWRENT_USER || 'pawrent_user',
  process.env.DB_PAWRENT_PASSWORD || ''
);

// Helper function to get pool based on role
export const getPoolByRole = (roleId: number) => {
  switch (roleId) {
    case 1: // Admin
      return adminPool;
    case 2: // Vet
      return vetPool;
    case 3: // Pawrent
      return pawrentPool;
    default:
      throw new Error('Invalid role ID');
  }
};

// Default export for backward compatibility (admin pool)
export default adminPool;