# angular-apollo-example

An example of GraphQL queries/mutations with Angular Apollo Boost.

## Initial setup

We start with our [Apollo server from last time](https://github.com/arjunyel/firestore-apollo-graphql), placing the files in the backend folder. Set it up and run the server

```bash
npm run serve
```

Generate a new Angular app and install dependencies

```bash
ng new frontend
cd frontend
ng add apollo-angular

npm install --save-dev graphql-code-generator
npm install --save-dev graphql-codegen-apollo-angular-template
npm install --save-dev graphql-codegen-introspection-template
```

Because Apollo Angular supports schematics, it creates a ready to use setup for you:

Inside the graphql module setup the GraphQL endpoint:

```diff
import {NgModule} from '@angular/core';
import {ApolloModule, APOLLO_OPTIONS} from 'apollo-angular';
import {HttpLinkModule, HttpLink} from 'apollo-angular-link-http';
import {InMemoryCache} from 'apollo-cache-inmemory';

- const uri = ''; // <-- add the URL of the GraphQL server here
+ const uri = 'http://localhost:4000';

export function createApollo(httpLink: HttpLink) {
  return {
    link: httpLink.create({uri}),
    cache: new InMemoryCache(),
  };
}
```

And that's it! The GraphQL Module has been already added to the AppModule.

## Setup Query

Lets setup our GraphQL query that retrieves all the tweets. In `src/app/graphql` directory first we create a file called `tweets.graphql` with our tweet query:

```graphql
query tweets {
  tweets {
    id
    text
    likes
  }
}
```

One of the most useful tools to work with GraphQL is [GraphQL Code Generator](https://github.com/dotansimha/graphql-code-generator) which will generate types for our queries and also a [ready to use services](https://www.apollographql.com/docs/angular/basics/services.html) introduced in Apollo Angular v1.2.0.

To start out with, we point gql-gen at our GraphQL server to generate a schema.json file.

```bash
npx gql-gen --schema http://localhost:4000 --template graphql-codegen-introspection-template --out schema.json
```

Now that we have our schema we have code-gen read the graphql files to see which documents we have

```bash
npx gql-gen --schema schema.json --template graphql-codegen-apollo-angular-template --out src/app/graphql/index.ts src/app/graphql/*.graphql
```

Now let's add those commands to npm scripts to make the whole process easier. First one, under `graphql:introspect`, the second one will be `graphql:generate`.

With Apollo Angular and GraphQL Code Generator you don't have to manually inject `Apollo` service and use generated types in every of your query or mutation.

Now lets add a class property, a tweets observable, and call our query on init

```typescript
import { TweetsGQL, Tweets } from './graphql';

export class AppComponent implements OnInit {
  tweets: Observable<Tweets.Query>;

  constructor(private tweetsGQL: TweetsGQL) {}

  ngOnInit() {
    this.tweets = this.tweetsGQL
      .watch()
      .valueChanges.pipe(map(tweets => tweets.data));
  }
}
```

The `watch` method is going to update our observable whenever the underlying Apollo store on our client is updated, even from another query. We'll see that in the next section when we go over optimistic updates.

In our app.component.html lets output our tweets and a button/likeTweet function we'll cover in the next section to like a tweet.

```html
<div *ngFor="let tweet of (tweets | async)?.tweets">
  {{tweet.text}}
  <ion-icon name="flame" (click)="likeTweet(tweet.id, tweet.likes, tweet.text)"></ion-icon>
  {{tweet.likes}}
</div>
```

I used [Ionicons](https://ionicons.com/) for the button, when we use web components make sure to add

```typescript
schemas: [CUSTOM_ELEMENTS_SCHEMA];
```

in our app.module.ts. When you run the app you should now see tweets displayed on the screen!

## Setup Mutation

Lets setup a Mutation on our backend that increments the likes on a tweet by 1. Jump into the backend/src/index.ts file and add the mutation to the typeDefs:

```typescript
const typeDefs = gql`

  ...

  type Mutation {
    likeTweet(id: ID!): Tweet
  }
`;
```

Then we code our mutation in the resolver, note that in a real firebase application you would use a transaction to increment the likes. In our example we are just setting the variable, refetching it, and returning.

```typescript
const resolvers = {

  ...

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
```

Save and reload the server

```bash
npm run serve
```

Return back to our app and lets start setting up the like tweet mutation by create `like-tweet.graphql` file

```graphql
mutation likeTweet($id: ID!) {
  likeTweet(id: $id) {
    id
    text
    likes
  }
}
```

Make sure your terminal is in the src/app folder and re-run two npm scripts

```bash
npm run graphql:introspect
npm run graphql:generate
```

Now with our types and services we are ready to write the mutation function

```diff
- import { TweetsGQL, Tweets } from './graphql';
+ import { TweetsGQL, Tweets, LikeTweetGQL } from './graphql';
```

```typescript
constructor(
  private tweetsGQL: TweetsGQL,
  private likeTweetGQL: LikeTweetGQL
) {}

likeTweet(id: string, likes: number, text: string) {
  this.likeTweetGQL.mutate({
    id
  }).pipe(
    tap((data) => console.log(data.data))
  ).subscribe();
}
```

Clicking on the button should now increment the likes, congrats you've created a GraphQL mutation!

You'll notice that even though we didn't tie our query to our tweets observable, it still updated the number with the return from the server. This is because under the hood, Apollo client has its own store where it keeps track of things and one queries result can update another. We can use this to implement optimistic updates.

### Optimistic Mutation

Currently when we update the likes it will wait for the server response to update. However for a great user experience we might want to update the UI immediately while the update happens through the network, this is an example of optimistic UI.

We do this by telling Apollo the type, ID, and values of the object we're going to update. Apollo can update the local store immediately, then when the server response comes it will overwrite it in the store. Change the mutate function:

```typescript
this.likeTweetGQL
  .mutate(
    {
      id,
    },
    {
      optimisticResponse: {
        __typename: 'Mutation',
        likeTweet: {
          __typename: 'Tweet',
          id,
          likes: likes + 1,
          text,
        },
      },
    },
  )
  .pipe(tap(data => console.log(data.data)))
  .subscribe();
```

You can use your browser's dev tools to slow down your internet connection and see that now when you click the button the number changes instantly! Have fun!
