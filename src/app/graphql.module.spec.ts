import { GraphQLModule } from './graphql.module';

describe('GraphqlModule', () => {
  let graphqlModule: GraphQLModule;

  beforeEach(() => {
    graphqlModule = new GraphqlModule();
  });

  it('should create an instance', () => {
    expect(graphqlModule).toBeTruthy();
  });
});
