# multi-gtfs-gatsby

building a web site that can display ddot.info-like timetables for many agencies at once. you can find an example site at https://transit.det.city

## developing the main site

1. clone the repo

2. run `yarn`

3. populate your `.env.development` with: `PG_CONN`, `SANITY_TOKEN`, `SANITY_PROJECT_ID`, `SANITY_DATASET`, `MAPBOX_ACCESS_TOKEN`

4. run `gatsby develop`

You'll see the main site at localhost:8000 and the GraphQL Explorer at localhost:8000/___graphql

## developing the custom CMS

See the [README](./studio/README.md) for instructions on creating a local version of the CMS.

## database

we use [gtfs-sql-importer](https://github.com/fitnr/gtfs-sql-importer) to populate the database
