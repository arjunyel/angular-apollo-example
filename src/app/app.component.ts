import { Component, OnInit } from '@angular/core';

import { Apollo, gql } from 'apollo-angular-boost';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { productsQuery } from './types/operation-result-types';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';

  todos: Observable<productsQuery>;

  constructor(private apollo: Apollo) {}

  ngOnInit() {
    this.todos = this.apollo.watchQuery<productsQuery>({
      query: gql`
      query products {
        allProducts {
          name
          price
        }
	    }`,
    }).valueChanges.pipe(
      map((todos) => todos.data)
    );
  }
}
