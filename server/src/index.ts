import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { User } from "./entities/User";
import { createConnection } from "typeorm";
import { typeDefs } from "./graphql/schema";

// iife
(async () => {
  const app = express();
  const PORT = 4000;

  const server = new ApolloServer({
    typeDefs,
  });

  await server.start();

  server.applyMiddleware({ app });

  await createConnection();

  app.get("/", async (_, res) => {
    res.send("hello world");
    const user = new User();
    user.username = "admin";
    user.email = "admin@example.com";
    user.passwordHash = "blah";
    user.save();
  });

  app.listen(PORT, () => {
    console.log("express server started on port", PORT);
  });
})();
