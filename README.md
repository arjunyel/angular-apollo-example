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
npm install apollo-angular-boost graphql
npm install apollo-codegen --save-dev
```

Generate the apoll graphql module

```bash
ng g module graphql --flat
```

Inside the graphql module setup Apollo Boost

```typescript
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ApolloBoostModule, ApolloBoost } from 'apollo-angular-boost';

@NgModule({
  exports: [
    HttpClientModule,
    ApolloBoostModule,
  ]
})
export class GraphQLModule {
  constructor(
    apolloBoost: ApolloBoost
  ) {
    apolloBoost.create({
      uri: 'http://localhost:4000/graphql'
    });
  }
}
```

Then add our graphQL module to our app.module.ts

```typescript
@NgModule({
  ...
  imports: [
    BrowserModule,
    GraphQLModule
  ],
  ...
})
export class AppModule { }
```

## Setup Query

Lets setup our GraphQL query that retrieves all the tweets. In our app.component.ts first we import the tools we need, inject Apollo, and create a new class property holding our tweet query.

```typescript
import { Apollo, gql } from 'apollo-angular-boost';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  tweetsQuery = gql`
  query tweets {
    tweets {
      id
      text
      likes
    }
  }`;

  constructor(private apollo: Apollo) {}
}
```

One of the coolest tools Apollo offers is [Apollo Codegen](https://github.com/apollographql/apollo-codegen) which will generate types for our queries.

```bash
cd src/app
mkdir types
```

To start out with, we point apollo-codegen at our GraphQL server to generate a schema.json file.

```bash
npx apollo-codegen introspect-schema http://localhost:4000/graphql --output ./types/schema.json
```

Now that we have our schema we have apollo codegen read the gql tag in our typescript files to see which types we are actually calling

```bash
npx apollo-codegen generate **/*.ts --schema ./types/schema.json --target typescript --output ./types/operation-result-types.ts
```

Using these types lets add a class property, a tweets observable, and call our query on init

```typescript
export class AppComponent implements OnInit {

  tweets: Observable<tweetsQuery>;

  ngOnInit() {
    this.tweets = this.apollo.watchQuery<tweetsQuery>({
      query: this.tweetsQuery,
    }).valueChanges.pipe(
      map((tweets) => tweets.data)
    );
  }
}
```

The watchQuery is going to update our observable whenever the underlying Apollo store  on our client is updated, even from another query. We'll see that in the next section when we go over optimistic updates.

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
schemas: [CUSTOM_ELEMENTS_SCHEMA]
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

Return back to the app.component.ts and lets start setting up the like tweet function by creating the gql tag we can generate types from

```typescript
likeTweet(id: string, likes: number, text: string) {
  const likeTweet = gql`
    mutation likeTweet($id: ID!) {
      likeTweet(id: $id) {
        id
        text
        likes
      }
    }
  `;
}
```

Make sure your terminal is in the src/app folder and re-run the apollo codegen

```bash
npx apollo-codegen introspect-schema http://localhost:4000/graphql --output ./types/schema.json
npx apollo-codegen generate **/*.ts --schema ./types/schema.json --target typescript --output ./types/operation-result-types.ts
```

Now with our types we are ready to write the mutation function

```typescript
likeTweet(id: string, likes: number, text: string) {
  const likeTweet = gql`
    mutation likeTweet($id: ID!) {
      likeTweet(id: $id) {
        id
        text
        likes
      }
    }
  `;

  this.apollo.mutate<likeTweetMutation, likeTweetMutationVariables>({
    mutation: likeTweet,
    variables: {
      id
    }
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
this.apollo.mutate<likeTweetMutation, likeTweetMutationVariables>({
  mutation: likeTweet,
  variables: {
    id
  },
  optimisticResponse: {
    __typename: 'Mutation',
    likeTweet: {
      __typename: 'Tweet',
      id,
      likes: likes + 1,
      text
    }
  }
}).pipe(
  tap((data) => console.log(data.data))
).subscribe();
```

You can use your browser's dev tools to slow down your internet connection and see that now when you click the button the number changes instantly! Have fun!
