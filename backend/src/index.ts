import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
import userRoutes from './routes/users';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pawrent', pawrentRoutes);
app.use('/api/hewan', hewanRoutes);
app.use('/api/kunjungan', kunjunganRoutes);
app.use('/api/dokter', dokterRoutes);
app.use('/api/obat', obatRoutes);
app.use('/api/auditlog', auditlogRoutes);
app.use('/api/klinik', klinikRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});

export default app;