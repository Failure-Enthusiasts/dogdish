# Storage

This module is where all of the database management tooling is located.

## Database

This project uses a PostgreSQL database and is managed using [Goose](https://pressly.github.io/goose/). The current schema for this project can be found at [schema.drawio](./schema.drawio).

## Migrations

Create new migration:

``` shell
goose -s create NAME_OF_NEW_MIGRATION sql
```

Apply all migrations:

``` shell
goose up
```

Downgrade your migration by a single version:

``` shell
goose down
```

## Environment Variables

There is a [example.env](./example.env) file which has default values that can be used for testing.

## Local Development

Before deploying locally, you should make a copy of the [example.env](./example.env), call it `.env.local` and update the environment variables if needed, for the most part you shouldn't need too.

To apply the environment variables in your terminal instance:

``` shell
export $(cat .env.local)
```

Next you can spin up the database:

``` shell
docker compose up -d
```

Apply the migrations:

``` shell
goose up
```

At the end of local development you will need to spun things down:

``` shell
docker compose down
```
