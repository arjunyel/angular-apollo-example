import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import {
  TweetsGQL,
  Tweets,
  LikeTweetGQL,
} from './graphql';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  tweets: Observable<Tweets.Query>;

  constructor(
    private tweetsGQL: TweetsGQL,
    private likeTweetGQL: LikeTweetGQL,
  ) {}

  ngOnInit() {
    this.tweets = this.tweetsGQL
      .watch()
      .valueChanges.pipe(map(tweets => tweets.data));
  }

  likeTweet(id: string, likes: number, text: string) {
    this.likeTweetGQL
      .mutate(
        { id },
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
  }
}
