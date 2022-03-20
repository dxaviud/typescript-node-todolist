import argon2 from "argon2";
import { verify } from "jsonwebtoken";
import {
  Arg,
  Ctx,
  Field,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import {
  createAccessToken,
  createRefreshToken,
  sendRefreshToken,
} from "../auth";
import { Context } from "../context";
import { User } from "../entities/User";
import { internal } from "../middleware/internal";

@ObjectType()
class UserResponse {
  @Field(() => String, { nullable: true })
  error?: string;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => String, { nullable: true })
  accessToken?: string;
}

@ObjectType()
class InternalUsersResponse {
  @Field(() => String, { nullable: true })
  error?: string;

  @Field(() => [User], { nullable: true })
  users?: User[];
}

@Resolver(User)
export class UserResolver {
  // @FieldResolver(() => String)
  // email(@Root() user: User, @Ctx() { req }: Context) {
  //   if (req.session.userId === user.id) {
  //     return user.email;
  //   }
  //   return "";
  // }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: Context) {
    if (!req.headers.authorization) {
      return null;
    }
    try {
      const token = req.headers.authorization.split(" ")[1];
      const payload = verify(
        token,
        process.env.ACCESS_TOKEN_SECRET!
      ) as Context["payload"];
      return User.findOne(payload!.userId);
    } catch (err) {
      console.log(err);
      return null;
    }
  }

  @Mutation(() => UserResponse, { nullable: true })
  async register(
    @Arg("username") username: string,
    @Arg("email") email: string,
    @Arg("password") password: string
  ): Promise<UserResponse> {
    const usernameTaken = await User.findOne({ username });
    if (usernameTaken) {
      return { error: "username taken" };
    }

    const passwordHash = await argon2.hash(password);
    try {
      await User.insert({
        username,
        email,
        passwordHash,
      });
    } catch (err) {
      console.log("couldn't register user, err: ", err);
      return { error: "failed to register" };
    }

    return {};

    // const result = await User.createQueryBuilder()
    //   .insert()
    //   .into(User)
    //   .values({ username, email, passwordHash })
    //   .returning("*")
    //   .execute();
    // const user = result.raw[0];
    // return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("username") username: string,
    @Arg("password") password: string,
    @Ctx() { res }: Context
  ): Promise<UserResponse> {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return { error: "user not found" };
    }
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      return { error: "wrong password" };
    }
    sendRefreshToken(res, createRefreshToken(user));

    return {
      accessToken: createAccessToken(user),
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { res }: Context) {
    sendRefreshToken(res, "");
    return true;
  }

  @Mutation(() => Boolean)
  async revokeRefreshTokensForUser(@Arg("userId", () => Int) userId: number) {
    await getConnection()
      .getRepository(User)
      .increment({ id: userId }, "tokenVersion", 1);

    return true;
  }

  @Query(() => InternalUsersResponse)
  @UseMiddleware(internal)
  async internalAllUsers(@Arg("passphrase") passphrase: string) {
    if (passphrase === "falafel") {
      const users = await User.find();
      return { users };
    }
    return { error: "incorrect passphrase" };
  }
}
