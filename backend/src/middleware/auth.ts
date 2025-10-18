import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getPoolByRole } from '../config/database';

export interface AuthRequest extends Request {
  user?: any;
  dbPool?: any; // Add database pool to request
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token tidak ditemukan' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key') as any;
    req.user = decoded;
    
    // Assign appropriate database pool based on user role
    try {
      req.dbPool = getPoolByRole(decoded.role_id);
      console.log(`✅ [AUTH] User ${decoded.username} (role_id: ${decoded.role_id}) connected to appropriate DB pool`);
    } catch (error) {
      console.error('❌ [AUTH] Error getting DB pool:', error);
      return res.status(500).json({ message: 'Error setting up database connection' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

export const authorize = (...roles: number[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role_id)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }
    next();
  };
};