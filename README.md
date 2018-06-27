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

The watchQuery is going to update our observable whenever the underlying APollo store is updated, even from another query. We'll see that in the next section when we go over optimistic updates.

In our app.component.html lets output our tweets and a button we'll cover in the next section to like a tweet.

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

in our app.module.ts. When you run the app you should now see tweets outputed on the screen!