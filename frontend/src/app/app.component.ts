import { Component, OnInit } from '@angular/core';

import { Apollo, gql } from 'apollo-angular-boost';

import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { tweetsQuery, likeTweetMutation, likeTweetMutationVariables } from './types/operation-result-types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  tweets: Observable<tweetsQuery>;
  tweetsQuery = gql`
  query tweets {
    tweets {
      id
      text
      likes
    }
  }`;

  constructor(private apollo: Apollo) {}

  ngOnInit() {
    this.tweets = this.apollo.watchQuery<tweetsQuery>({
      query: this.tweetsQuery,
    }).valueChanges.pipe(
      map((tweets) => tweets.data)
    );
  }

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

    this.apollo.mutate<likeTweetMutation, likeTweetMutationVariables >({
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
  }
}
