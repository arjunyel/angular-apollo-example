import * as admin from 'firebase-admin';

const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

import { ApolloServer, ApolloError, ValidationError, gql } from 'apollo-server';

interface User {
  id: string;
  name: string;
  screenName: string;
  statusesCount: number;
}

interface Tweet {
  id: string;
  likes: number;
  text: string;
  userId: string;
}

const typeDefs = gql`
  # A Twitter User
  type User {
    id: ID!
    name: String!
    screenName: String!
    statusesCount: Int!
    tweets: [Tweet]!
  }

  # A Tweet Object
  type Tweet {
    id: ID!
    text: String!
    userId: String!
    user: User!
    likes: Int!
  }

  type Query {
    tweets: [Tweet]
    user(id: String!): User
  }

  type Mutation {
    likeTweet(id: ID!): Tweet
  }
`;

const resolvers = {
  User: {
    async tweets(user) {
      try {
        const userTweets = await admin
          .firestore()
          .collection('tweets')
          .where('userId', '==', user.id)
          .get();
        return userTweets.docs.map(tweet => tweet.data()) as Tweet[];
      } catch (error) {
        throw new ApolloError(error);
      }
    }
  },
  Tweet: {
    async user(tweet) {
      try {
        const tweetAuthor = await admin
          .firestore()
          .doc(`users/${tweet.userId}`)
          .get();
        return tweetAuthor.data() as User;
      } catch (error) {
        throw new ApolloError(error);
      }
    }
  },
  Query: {
    async tweets() {
      const tweets = await admin
        .firestore()
        .collection('tweets')
        .get();
      return tweets.docs.map(tweet => tweet.data()) as Tweet[];
    },
    async user(_: null, args: { id: string }) {
      try {
        const userDoc = await admin
          .firestore()
          .doc(`users/${args.id}`)
          .get();
        const user = userDoc.data() as User | undefined;
        return user || new ValidationError('User ID not found');
      } catch (error) {
        throw new ApolloError(error);
      }
    }
  },
  Mutation: {
    likeTweet: async (_, args: {id: string} ) => {
      try {
        const tweetRef = admin.firestore().doc(`tweets/${args.id}`);

        // Increment likes on tweet, in real life you'd use a transaction!
        let tweetDoc = await tweetRef.get();
        const tweet = tweetDoc.data() as Tweet;
        await tweetRef.update({ likes: tweet.likes + 1 });

        tweetDoc = await tweetRef.get();
        return tweetDoc.data();
      } catch (error) {
        throw new ApolloError(error);
      }
    }
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
