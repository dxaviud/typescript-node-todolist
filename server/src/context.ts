import { Request, Response } from "express";

export interface Context {
  req: Request & { session: { userId?: number } };
  res: Response;
}
