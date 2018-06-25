import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
// Apollo
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
