/* tslint:disable */
//  This file was automatically generated and should not be edited.

export interface tweetsQuery {
  tweets:  Array< {
    id: string,
    text: string,
    likes: number,
  } | null > | null,
};

export interface likeTweetMutationVariables {
  id: string,
};

export interface likeTweetMutation {
  likeTweet:  {
    id: string,
    text: string,
    likes: number,
  } | null,
};
