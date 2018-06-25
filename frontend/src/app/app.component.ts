import { Component, OnInit } from '@angular/core';

import { Apollo, gql } from 'apollo-angular-boost';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { tweetsQuery } from './types/operation-result-types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';

  tweets: Observable<tweetsQuery>;

  constructor(private apollo: Apollo) {}

  ngOnInit() {
    this.tweets = this.apollo.watchQuery<tweetsQuery>({
      query: gql`
      query tweets {
        tweets {
          id
          text
          likes
        }
      }`,
    }).valueChanges.pipe(
      map((tweets) => tweets.data)
    );
  }

  likeTweet(id: string) {
    console.log(id);
  }


}
