import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { adminPool, vetPool, pawrentPool } from './config/database';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import dokterRoutes from './routes/dokter';
import pawrentRoutes from './routes/pawrent';
import hewanRoutes from './routes/hewan';
import kunjunganRoutes from './routes/kunjungan';
import obatRoutes from './routes/obat';
import klinikRoutes from './routes/klinik';
import dashboardRoutes from './routes/dashboard';
import auditlogRoutes from './routes/auditlog';
import layananRoutes from './routes/layanan';
import kunjunganObatRoutes from './routes/kunjungan-obat';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test database connections on startup
async function testConnections() {
  try {
    console.log('🔌 Testing database connections...');
    
    await adminPool.query('SELECT 1');
    console.log('✅ Admin pool connected');
    
    await vetPool.query('SELECT 1');
    console.log('✅ Vet pool connected');
    
    await pawrentPool.query('SELECT 1');
    console.log('✅ Pawrent pool connected');
    
    console.log('✅ All database pools connected successfully\n');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pawrent', pawrentRoutes);
app.use('/api/hewan', hewanRoutes);
app.use('/api/kunjungan', kunjunganRoutes);
app.use('/api/dokter', dokterRoutes);
app.use('/api/obat', obatRoutes);
app.use('/api/auditlog', auditlogRoutes);
app.use('/api/klinik', klinikRoutes);
app.use('/api/layanan', layananRoutes);
app.use('/api/kunjungan-obat', kunjunganObatRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server after testing connections
testConnections().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di port ${PORT}`);
  });
});

export default app;