import { MiddlewareFn } from "type-graphql";
import { Context } from "../context";

export const authenticated: MiddlewareFn<Context> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error("not authenticated");
  }

  return next();
};
