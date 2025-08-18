import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandler<T extends Request = Request> = (req: T, res: Response, next: NextFunction) => Promise<any>;

export const asyncHandler = <T extends Request = Request>(fn: AsyncHandler<T>): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
};
