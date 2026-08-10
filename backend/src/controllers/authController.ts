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

export const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const resendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new AppError('This email is already registered. Please sign in.', 400, 'USER_ALREADY_EXISTS');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, is_email_verified, otp_code, otp_expires_at)
       VALUES ($1, $2, $3, $4, FALSE, $5, NOW() + INTERVAL '10 minutes')
       RETURNING id, name, email, role, created_at`,
      [name, email, password_hash, role || 'SALES', otpCode]
    );

    const newUser = result.rows[0];

    console.log(`[EMAIL OTP VERIFICATION] Sent 6-digit OTP code '${otpCode}' to email: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Account created! A 6-digit email verification OTP code has been generated.',
      data: {
        email: newUser.email,
        otp_code: otpCode, // Provided for instant demo testing!
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const userRes = await query(
      'SELECT id, name, email, role, password_hash, otp_code, otp_expires_at, is_email_verified FROM users WHERE email = $1',
      [email]
    );

    if (userRes.rows.length === 0) {
      throw new AppError('Invalid email or verification session', 400, 'USER_NOT_FOUND');
    }

    const user = userRes.rows[0];

    if (user.otp_code !== otp) {
      throw new AppError('Invalid 6-digit OTP verification code. Please check and try again.', 400, 'INVALID_OTP');
    }

    if (new Date(user.otp_expires_at).getTime() < Date.now()) {
      throw new AppError('OTP verification code has expired. Please request a new code.', 400, 'EXPIRED_OTP');
    }

    // Mark email as verified
    await query(
      'UPDATE users SET is_email_verified = TRUE, otp_code = NULL, otp_expires_at = NULL, updated_at = NOW() WHERE id = $1',
      [user.id]
    );

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
      message: 'Email verified successfully! Access granted.',
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

export const resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const userRes = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      throw new AppError('Account with this email does not exist', 404, 'NOT_FOUND');
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    await query(
      "UPDATE users SET otp_code = $1, otp_expires_at = NOW() + INTERVAL '10 minutes', updated_at = NOW() WHERE email = $2",
      [newOtp, email]
    );

    console.log(`[RESEND OTP] Sent new 6-digit OTP '${newOtp}' to email: ${email}`);

    res.json({
      success: true,
      message: 'A new 6-digit verification code has been generated.',
      data: {
        email,
        otp_code: newOtp,
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
