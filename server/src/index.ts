import { ApolloServer } from "apollo-server-express";
import cookieParser from "cookie-parser";
import "dotenv-safe/config";
import express from "express";
import "reflect-metadata";
import { buildSchema } from "type-graphql";
import { createConnection } from "typeorm";
import { PORT } from "./constants";
import { baseHandler, refreshUserAccessToken } from "./handlers";
import { TodoResolver } from "./resolvers/todo";
import { UserResolver } from "./resolvers/user";

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
  app.use(cookieParser());

  app.get("/", baseHandler);
  app.post("/refresh_token", refreshUserAccessToken);

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, TodoResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ req, res }),
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({ app });

  app.listen(PORT, () => {
    console.log("express server started on port", PORT);
  });
})();
