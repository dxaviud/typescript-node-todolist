import "reflect-metadata";
import "dotenv-safe/config";
import express from "express";
import session from "express-session";
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
  const PORT = 4000;

  app.use(
    session({
      name: COOKIE_NAME,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: __prod__, // cookie only works in https
        // domain: __prod__ ? ".exmple.com" : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET as string,
      resave: false,
    })
  );

  const server = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, TodoResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res }),
  });

  await server.start();
  server.applyMiddleware({ app });

  app.get("/", async (_, res) => {
    res.send("hello world");
    console.log("request to /");
  });

  app.listen(PORT, () => {
    console.log("express server started on port", PORT);
  });
})();
