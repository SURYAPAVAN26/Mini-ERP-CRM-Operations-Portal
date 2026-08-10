import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  errorCode: string;

  constructor(message: string, statusCode = 400, errorCode = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error handling request:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.errorCode,
    });
    return;
  }

  // Handle unique constraint postgres errors (23505)
  if (err.code === '23505') {
    res.status(400).json({
      success: false,
      message: 'Duplicate key error: A record with this unique value already exists.',
      error: 'DUPLICATE_KEY',
    });
    return;
  }

  // Handle foreign key constraint postgres errors (23503)
  if (err.code === '23503') {
    res.status(400).json({
      success: false,
      message: 'Referenced entity cannot be deleted or does not exist.',
      error: 'FOREIGN_KEY_VIOLATION',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: 'SERVER_ERROR',
  });
};
