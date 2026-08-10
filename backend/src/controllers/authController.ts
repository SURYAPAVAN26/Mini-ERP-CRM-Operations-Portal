import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/database';
import { config } from '../config/env';
import { AuthRequest, JwtPayload, User } from '../types';
import { AppError } from '../middleware/errorHandler';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']).optional().default('SALES'),
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new AppError('This email is already registered. Please sign in.', 400, 'USER_ALREADY_EXISTS');
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, password_hash, role || 'SALES']
    );

    const newUser: User = result.rows[0];

    const payload: JwtPayload = {
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const user: User = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const result = await query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user.userId]);
    if (result.rows.length === 0) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};
