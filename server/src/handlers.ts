import { Request, Response } from "express";
import { verify } from "jsonwebtoken";
import {
  createAccessToken,
  createRefreshToken,
  sendRefreshToken,
} from "./auth";
import { User } from "./entities/User";

export const baseHandler = async (_: Request, res: Response) => {
  res.send("hello");
  console.log("request to /");
};

interface JwtPayload {
  userId: string;
  tokenVersion: number;
}

export const refreshUserAccessToken = async (req: Request, res: Response) => {
  const token = req.cookies.jid;
  if (!token) {
    return res.send({ ok: false, accessToken: "" });
  }

  let payload: JwtPayload;
  try {
    payload = verify(token, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload;
  } catch (err) {
    console.log(err);
    return res.send({ ok: false, accessToken: "" });
  }

  // token is valid and
  // we can send back an access token
  const user = await User.findOne({ id: parseInt(payload.userId) });

  if (!user) {
    return res.send({ ok: false, accessToken: "" });
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    return res.send({ ok: false, accessToken: "" });
  }

  sendRefreshToken(res, createRefreshToken(user));

  return res.send({ ok: true, accessToken: createAccessToken(user) });
};
