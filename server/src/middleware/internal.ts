import { MiddlewareFn } from "type-graphql";
import { PRODUCTION } from "../constants";

export const internal: MiddlewareFn = (_, next) => {
  if (PRODUCTION) {
    throw new Error("internal queries can't be made in production");
  }
  return next();
};
