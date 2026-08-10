import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issue = error.errors[0];
        res.status(400).json({
          success: false,
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Validation error',
          error: 'VALIDATION_ERROR',
          details: error.errors,
        });
        return;
      }
      next(error);
    }
  };
};
