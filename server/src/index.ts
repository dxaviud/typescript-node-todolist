import "reflect-metadata";
import express from "express";
import { User } from "./entities/User";
import { createConnection } from "typeorm";

// iife
(async () => {
  const app = express();
  const PORT = 4000;

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
