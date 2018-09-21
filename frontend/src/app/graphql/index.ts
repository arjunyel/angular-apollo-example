/* tslint:disable */
import { GraphQLResolveInfo } from "graphql";

export type Resolver<Result, Parent = any, Context = any, Args = any> = (
  parent: Parent,
  args: Args,
  context: Context,
  info: GraphQLResolveInfo
) => Promise<Result> | Result;

export type SubscriptionResolver<
  Result,
  Parent = any,
  Context = any,
  Args = any
> = {
  subscribe<R = Result, P = Parent>(
    parent: P,
    args: Args,
    context: Context,
    info: GraphQLResolveInfo
  ): AsyncIterator<R | Result>;
  resolve?<R = Result, P = Parent>(
    parent: P,
    args: Args,
    context: Context,
    info: GraphQLResolveInfo
  ): R | Result | Promise<R | Result>;
};

/** The `Upload` scalar type represents a file upload promise that resolves an object containing `stream`, `filename`, `mimetype` and `encoding`. */
export type Upload = any;

export interface Query {
  tweets?: (Tweet | null)[] | null;
  user?: User | null;
}

export interface Tweet {
  id: string;
  text: string;
  userId: string;
  user: User;
  likes: number;
}

export interface User {
  id: string;
  name: string;
  screenName: string;
  statusesCount: number;
  tweets: (Tweet | null)[];
}

export interface Mutation {
  likeTweet?: Tweet | null;
}
export interface UserQueryArgs {
  id: string;
}
export interface LikeTweetMutationArgs {
  id: string;
}

export enum CacheControlScope {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE"
}

export namespace QueryResolvers {
  export interface Resolvers<Context = any> {
    tweets?: TweetsResolver<(Tweet | null)[] | null, any, Context>;
    user?: UserResolver<User | null, any, Context>;
  }

  export type TweetsResolver<
    R = (Tweet | null)[] | null,
    Parent = any,
    Context = any
  > = Resolver<R, Parent, Context>;
  export type UserResolver<
    R = User | null,
    Parent = any,
    Context = any
  > = Resolver<R, Parent, Context, UserArgs>;
  export interface UserArgs {
    id: string;
  }
}

export namespace TweetResolvers {
  export interface Resolvers<Context = any> {
    id?: IdResolver<string, any, Context>;
    text?: TextResolver<string, any, Context>;
    userId?: UserIdResolver<string, any, Context>;
    user?: UserResolver<User, any, Context>;
    likes?: LikesResolver<number, any, Context>;
  }

  export type IdResolver<R = string, Parent = any, Context = any> = Resolver<
    R,
    Parent,
    Context
  >;
  export type TextResolver<R = string, Parent = any, Context = any> = Resolver<
    R,
    Parent,
    Context
  >;
  export type UserIdResolver<
    R = string,
    Parent = any,
    Context = any
  > = Resolver<R, Parent, Context>;
  export type UserResolver<R = User, Parent = any, Context = any> = Resolver<
    R,
    Parent,
    Context
  >;
  export type LikesResolver<R = number, Parent = any, Context = any> = Resolver<
    R,
    Parent,
    Context
  >;
}

export namespace UserResolvers {
  export interface Resolvers<Context = any> {
    id?: IdResolver<string, any, Context>;
    name?: NameResolver<string, any, Context>;
    screenName?: ScreenNameResolver<string, any, Context>;
    statusesCount?: StatusesCountResolver<number, any, Context>;
    tweets?: TweetsResolver<(Tweet | null)[], any, Context>;
  }

  export type IdResolver<R = string, Parent = any, Context = any> = Resolver<
    R,
    Parent,
    Context
  >;
  export type NameResolver<R = string, Parent = any, Context = any> = Resolver<
    R,
    Parent,
    Context
  >;
  export type ScreenNameResolver<
    R = string,
    Parent = any,
    Context = any
  > = Resolver<R, Parent, Context>;
  export type StatusesCountResolver<
    R = number,
    Parent = any,
    Context = any
  > = Resolver<R, Parent, Context>;
  export type TweetsResolver<
    R = (Tweet | null)[],
    Parent = any,
    Context = any
  > = Resolver<R, Parent, Context>;
}

export namespace MutationResolvers {
  export interface Resolvers<Context = any> {
    likeTweet?: LikeTweetResolver<Tweet | null, any, Context>;
  }

  export type LikeTweetResolver<
    R = Tweet | null,
    Parent = any,
    Context = any
  > = Resolver<R, Parent, Context, LikeTweetArgs>;
  export interface LikeTweetArgs {
    id: string;
  }
}

export namespace LikeTweet {
  export type Variables = {
    id: string;
  };

  export type Mutation = {
    __typename?: "Mutation";
    likeTweet?: LikeTweet | null;
  };

  export type LikeTweet = {
    __typename?: "Tweet";
    id: string;
    text: string;
    likes: number;
  };
}

export namespace Tweets {
  export type Variables = {};

  export type Query = {
    __typename?: "Query";
    tweets?: (Tweets | null)[] | null;
  };

  export type Tweets = {
    __typename?: "Tweet";
    id: string;
    text: string;
    likes: number;
  };
}

import { Injectable } from "@angular/core";

import * as Apollo from "apollo-angular";

import gql from "graphql-tag";

@Injectable({
  providedIn: "root"
})
export class LikeTweetGQL extends Apollo.Mutation<
  LikeTweet.Mutation,
  LikeTweet.Variables
> {
  document: any = gql`
    mutation likeTweet($id: ID!) {
      likeTweet(id: $id) {
        id
        text
        likes
      }
    }
  `;
}
@Injectable({
  providedIn: "root"
})
export class TweetsGQL extends Apollo.Query<Tweets.Query, Tweets.Variables> {
  document: any = gql`
    query tweets {
      tweets {
        id
        text
        likes
      }
    }
  `;
}
