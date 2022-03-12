import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Query {
    todo(id: ID!): Todo
    userTodo(title: String!, userId: ID!): Todo
    me: User
  }

  type Mutation {
    register(username: String!, email: String!, password: String!): User
    login(username: String!, password: String!): User
    createTodo(title: String!, description: String!, userId: ID!): Todo
    updateTodo(title: String!, description: String!): Todo
    deleteTodo(id: ID!): Boolean!
    deleteUserTodo(title: String!, userId: ID!): Boolean!
  }

  type User {
    id: ID!
    username: String!
    email: String!
    passwordHash: String!
    createdAt: String!
    updatedAt: String!
  }

  type Todo {
    id: ID!
    title: String!
    description: String!
    userId: ID!
    createdAt: String!
    updatedAt: String!
  }
`;
