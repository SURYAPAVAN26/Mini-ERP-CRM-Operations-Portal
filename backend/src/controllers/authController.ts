import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/database';
import { config } from '../config/env';
import { AppError } from '../middleware/errorHandler';
import { User, JwtPayload } from '../types';
import { sendOtpEmail } from '../services/emailService';

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

// Helper to generate a random 6-digit numeric OTP
function generate6DigitOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 1. LOGIN
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT id, name, email, password_hash, role, is_email_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const user: User = result.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // SECURITY: Enforce email verification check before login
    if (!user.is_email_verified) {
      throw new AppError(
        'Please verify your email before signing in. Check your email inbox for the 6-digit OTP code.',
        403,
        'EMAIL_NOT_VERIFIED'
      );
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

// 2. REGISTER (Creates account & sends OTP to dynamic recipient email)
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email } = req.body;
    const recipientEmail = String(email).trim();
    const userPassword = req.body.password;

    // SECURITY: Public registration defaults to safe 'SALES' role
    // Privileged roles (ADMIN, WAREHOUSE, ACCOUNTS) cannot be self-assigned
    const safeRole = 'SALES';

    const existingUser = await query('SELECT id, is_email_verified FROM users WHERE email = $1', [recipientEmail]);
    if (existingUser.rows.length > 0) {
      if (existingUser.rows[0].is_email_verified) {
        throw new AppError('This email is already registered. Please sign in.', 400, 'USER_ALREADY_EXISTS');
      } else {
        // Unverified account exists: allow updating password and re-sending OTP to dynamic recipient email
        const password_hash = await bcrypt.hash(userPassword, 10);
        const otpCode = generate6DigitOtp();
        const otpHash = await bcrypt.hash(otpCode, 10);

        await query(
          `UPDATE users SET name = $1, password_hash = $2, role = $3, otp_code = $4, otp_expires_at = NOW() + INTERVAL '5 minutes', updated_at = NOW()
           WHERE email = $5`,
          [name, password_hash, safeRole, otpHash, recipientEmail]
        );

        // Send OTP to dynamic recipient email entered by the user
        await sendOtpEmail(recipientEmail, name, otpCode);

        res.status(200).json({
          success: true,
          message: 'OTP has been sent to your email.',
          data: { email: recipientEmail },
        });
        return;
      }
    }

    const password_hash = await bcrypt.hash(userPassword, 10);
    const otpCode = generate6DigitOtp();
    const otpHash = await bcrypt.hash(otpCode, 10);

    await query(
      `INSERT INTO users (name, email, password_hash, role, is_email_verified, otp_code, otp_expires_at)
       VALUES ($1, $2, $3, $4, FALSE, $5, NOW() + INTERVAL '5 minutes')`,
      [name, recipientEmail, password_hash, safeRole, otpHash]
    );

    // Send OTP to dynamic recipient email entered by the user
    await sendOtpEmail(recipientEmail, name, otpCode);

    res.status(201).json({
      success: true,
      message: 'OTP has been sent to your email.',
      data: { email: recipientEmail },
    });
  } catch (error) {
    next(error);
  }
};

// 3. VERIFY OTP
export const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, otp } = req.body;

    const userRes = await query(
      'SELECT id, name, email, role, otp_code, otp_expires_at, is_email_verified FROM users WHERE email = $1',
      [email]
    );

    if (userRes.rows.length === 0) {
      throw new AppError('Invalid email or verification session', 400, 'USER_NOT_FOUND');
    }

    const user = userRes.rows[0];

    if (user.is_email_verified) {
      res.json({
        success: true,
        message: 'Account is already verified. Please sign in.',
        data: { email: user.email },
      });
      return;
    }

    if (!user.otp_code || !user.otp_expires_at) {
      throw new AppError('OTP expired or not found. Please request a new OTP.', 400, 'EXPIRED_OTP');
    }

    // Expiry Check (5 minutes)
    if (new Date(user.otp_expires_at).getTime() < Date.now()) {
      throw new AppError('OTP expired. Please request a new OTP.', 400, 'EXPIRED_OTP');
    }

    // Verify OTP against secure hash
    const isOtpValid = await bcrypt.compare(otp, user.otp_code);
    if (!isOtpValid) {
      throw new AppError('Invalid OTP. Please try again.', 400, 'INVALID_OTP');
    }

    // Single-use: Mark email as verified and clear OTP hash
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
      message: 'Email verified successfully! Account activated.',
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

// 4. RESEND OTP (With 60-second rate limiting cooldown)
export const resendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const userRes = await query(
      'SELECT id, name, is_email_verified, otp_expires_at FROM users WHERE email = $1',
      [email]
    );

    if (userRes.rows.length === 0) {
      throw new AppError('Account with this email does not exist', 404, 'NOT_FOUND');
    }

    const user = userRes.rows[0];

    if (user.is_email_verified) {
      throw new AppError('This account is already verified.', 400, 'ALREADY_VERIFIED');
    }

    // Cooldown check (60-second rate limit)
    if (user.otp_expires_at) {
      const expiresTime = new Date(user.otp_expires_at).getTime();
      const createdTime = expiresTime - 5 * 60 * 1000;
      const secondsSinceLastRequest = (Date.now() - createdTime) / 1000;

      if (secondsSinceLastRequest < 60) {
        const remainingSeconds = Math.ceil(60 - secondsSinceLastRequest);
        throw new AppError(
          `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }
    }

    const newOtp = generate6DigitOtp();
    const newOtpHash = await bcrypt.hash(newOtp, 10);

    await query(
      "UPDATE users SET otp_code = $1, otp_expires_at = NOW() + INTERVAL '5 minutes', updated_at = NOW() WHERE email = $2",
      [newOtpHash, email]
    );

    // Send OTP via Nodemailer
    await sendOtpEmail(email, user.name || 'User', newOtp);

    res.json({
      success: true,
      message: 'OTP has been sent to your email.',
      data: { email },
    });
  } catch (error) {
    next(error);
  }
};

// 5. GET CURRENT USER
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.userId;

    const result = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const user: User = result.rows[0];

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
