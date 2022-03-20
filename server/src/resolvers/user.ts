import argon2 from "argon2";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from "type-graphql";
import { COOKIE_NAME } from "../constants";
import { Context } from "../context";
import { User } from "../entities/User";

@ObjectType()
class UserResponse {
  @Field(() => String, { nullable: true })
  error?: string;

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: Context) {
    if (req.session.userId === user.id) {
      return user.email;
    }
    return "";
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: Context) {
    if (!req.session.userId) {
      return null;
    }
    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse, { nullable: true })
  async register(
    @Arg("username") username: string,
    @Arg("email") email: string,
    @Arg("password") password: string,
    @Ctx() { req }: Context
  ): Promise<UserResponse> {
    if (req.session.userId) {
      return { error: "still logged in" };
    }

    const usernameTaken = await User.findOne({ username });
    if (usernameTaken) {
      return { error: "username taken" };
    }

    const passwordHash = await argon2.hash(password);
    const result = await User.createQueryBuilder()
      .insert()
      .into(User)
      .values({ username, email, passwordHash })
      .returning("*")
      .execute();
    const user = result.raw[0];

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("username") username: string,
    @Arg("password") password: string,
    @Ctx() { req }: Context
  ): Promise<UserResponse> {
    const user = await User.findOne({ username });
    if (!user) {
      return { error: "user not found" };
    }
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      return { error: "wrong password" };
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: Context) {
    console.log("logging out");
    let success = true;
    res.clearCookie(COOKIE_NAME);
    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session: ", err);
        success = false;
      }
    });
    return success;
  }
}
