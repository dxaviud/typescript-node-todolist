import "reflect-metadata";
import "dotenv-safe/config";
import express from "express";
import session from "express-session";
// import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { createConnection } from "typeorm";
import { buildSchema } from "type-graphql";
import { COOKIE_NAME, __prod__ } from "./constants";
import { UserResolver } from "./resolvers/user";
import { TodoResolver } from "./resolvers/todo";

// iife
(async () => {
  await createConnection();

  const app = express();

  // app.use(
  //   cors({
  //     origin: process.env.CORS_ORIGIN,
  //     credentials: true,
  //   })
  // );
  app.use(
    session({
      name: COOKIE_NAME,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: false, // cookie only works in https
        // domain: __prod__ ? ".exmple.com" : undefined,
      },
      saveUninitialized: true,
      secret: process.env.SESSION_SECRET!,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, TodoResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app });

  app.get("/", async (_, res) => {
    res.send("hello");
    console.log("request to /");
  });

  const PORT = parseInt(process.env.PORT!);
  app.listen(PORT, () => {
    console.log("express server started on port", PORT);
  });
})();
