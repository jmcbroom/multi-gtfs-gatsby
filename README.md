# multi-gtfs-gatsby

building a web site that can display ddot.info-like timetables for many agencies at once

## developing

1. clone the repo

2. run `npm install` or `yarn`

3. populate your `.env.development` with a `PG_CONN` connection string

4. run `gatsby develop`

You'll see the main site at localhost:8000 and the GraphQL Explorer at localhost:8000/___graphql

## database

we use [gtfs-sql-importer](https://github.com/fitnr/gtfs-sql-importer) to populate the database