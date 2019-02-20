A small helper module to make rich postgres queries from graphql queries.

## comes with typedefs StringWhere, BooleanWhere, DateTimeWhere and others.

Use like:

```
type Query {
  users(input: UsersInput): UsersResults!
}

input UsersInput {
  where: UsersWhere
  limit: Int
  offset: Int
  sort: UserSort
}

input UsersWhere {
  OR: [UsersWhere]
  AND: [UsersWhere]
  id: StringWhere
  name: StringWhere
  email: StringWhere
  active: BooleanWhere
  createdAt: DateTimeWhere
  updatedAt: DateTimeWhere
}

input UserSort {
  id: SortDirection
  name: SortDirection
  email: SortDirection
  createdAt: SortDirection
  updatedAt: SortDirection
}

type UsersResults {
  hasMore: Boolean!
  totalCount: Int!
  items: [User]!
}

enum SortDirection {
  ASC
  DESC
}

```

## comes with Higher order Resolvers to quickly compose resolvers

```
import { getManyHOR } from "@jakelowen/knex-graphql-filters";

export default async (root, args, context, info) => {
  // "users" is table name.
  return getManyHOR("users")(root, args, context, info);
};

```

This will automatically enable very reach prisma style queries

```
query {
  users(
    input: {
      where: {
        OR: [
            { name: { starts_with: "Bil" } },
            { name: { starts_with: "Joe" } }
        ],
        createdAt: { gte: "2019-02-18 12:28:56.399868-06" }
      }
    }
  ) {
    hasMore
    totalCount
    items {
      id
      name
      email
      active
      createdAt
    }
  }
}
```
