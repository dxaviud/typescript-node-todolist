import {
  Arg,
  Ctx,
  Field,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Context } from "../context";
import { Todo } from "../entities/Todo";
import { authenticated } from "../middleware/authenticated";

@ObjectType()
class TodoResponse {
  @Field(() => String, { nullable: true })
  error?: string;

  @Field(() => Todo, { nullable: true })
  todo?: Todo;

  @Field(() => [Todo])
  todos?: Todo[];
}

@Resolver(Todo)
export class TodoResolver {
  @Query(() => TodoResponse, { nullable: true })
  @UseMiddleware(authenticated)
  async todoByTitle(
    @Arg("title") title: string,
    @Ctx() { req }: Context
  ): Promise<TodoResponse | null> {
    const userId = req.session.userId;
    const todo = await Todo.findOne({ where: { title, userId } });
    if (!todo) {
      return null;
    }
    return { todo };
  }

  @Query(() => TodoResponse)
  @UseMiddleware(authenticated)
  async todos(@Ctx() { req }: Context): Promise<TodoResponse> {
    const userId = req.session.userId;
    const todos = await Todo.find({ where: { userId } });
    return { todos };
  }

  // @Query(() => TodoResponse, { nullable: true })
  // async todoOfUser(
  //   @Arg("title") title: string,
  //   @Arg("userId") userId: string
  // ): Promise<TodoResponse | null> {
  //   const todo = await Todo.findOne({ where: { title, userId } });
  //   if (!todo) {
  //     return null;
  //   }
  //   return { todo };
  // }

  // @Query(() => TodoResponse)
  // async todosOfUser(@Arg("userId") userId: string) {
  //   const userExists = User.findOne(userId);
  //   if (!userExists) {
  //     return { error: "user does not exist" };
  //   }
  //   const todos = await Todo.find({ where: { userId } });
  //   return { todos };
  // }

  // @Query(() => TodoResponse, { nullable: true })
  // async todo(@Arg("id") id: number): Promise<TodoResponse | null> {
  //   const todo = await Todo.findOne(id);
  //   if (!todo) {
  //     return null;
  //   }
  //   return { todo };
  // }

  @Mutation(() => TodoResponse)
  @UseMiddleware(authenticated)
  async createTodo(
    @Arg("title") title: string,
    @Arg("description") description: string,
    @Ctx() { req }: Context
  ): Promise<TodoResponse> {
    const userId = req.session.userId;
    const titleExists = await Todo.findOne({ where: { title, userId } });
    if (titleExists) {
      return TITLE_EXISTS;
    }
    const todo = new Todo();
    todo.title = title;
    todo.description = description;
    todo.userId = userId!;
    todo.save();

    return { todo };
  }

  @Mutation(() => TodoResponse)
  @UseMiddleware(authenticated)
  async updateTodo(
    @Arg("oldTitle") oldTitle: string,
    @Arg("title") title: string,
    @Arg("description") description: string,
    @Ctx() { req }: Context
  ): Promise<TodoResponse> {
    const userId = req.session.userId;
    if (oldTitle !== title) {
      const titleExists = await Todo.findOne({ where: { title, userId } });
      if (titleExists) {
        return TITLE_EXISTS;
      }
    }
    const todo = await Todo.findOne({ where: { title: oldTitle, userId } });
    if (!todo) {
      return TODO_NOT_FOUND;
    }
    todo.title = title;
    todo.description = description;
    todo.save();

    return { todo };
  }

  @Mutation(() => TodoResponse)
  @UseMiddleware(authenticated)
  async deleteTodo(
    @Arg("title") title: string,
    @Ctx() { req }: Context
  ): Promise<TodoResponse> {
    const userId = req.session.userId;
    const todo = await Todo.findOne({ where: { title, userId } });
    if (!todo) {
      return TODO_NOT_FOUND;
    }
    await Todo.remove([todo]);

    return { todo };
  }
}

const TITLE_EXISTS = { error: "title already exists" };
const TODO_NOT_FOUND = { error: "todo not found" };
