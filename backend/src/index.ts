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
import jenisHewanRoutes from './routes/jenis-hewan';
import pencarianRouter from './routes/pencarian';
import bookingRoutes from './routes/booking';
import shiftDokterRoutes from './routes/shiftDokter';
import kunjunganLayananRoutes from './routes/kunjungan-layanan';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ========================================================
// CORS Configuration - PENTING!
// ========================================================
const corsOptions = {
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://127.0.0.1:8080'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

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
app.use('/api/jenis-hewan', jenisHewanRoutes);
app.use('/api/pencarian', pencarianRouter);
app.use('/api/booking', bookingRoutes);
app.use('/api/shift-dokter', shiftDokterRoutes);
app.use('/api/kunjungan-layanan', kunjunganLayananRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server after testing connections
testConnections().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📡 CORS enabled for: http://localhost:8080`);
  });
});


export default app;