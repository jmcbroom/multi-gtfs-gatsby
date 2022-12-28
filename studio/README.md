# multi-gtfs-gatsby Studio

This `/studio` folder represents an instance of the [Sanity Studio].

## Developing

1. `cd` into the `studio` directory & either `npm install` or `yarn` to install dependencies
2. Run `npm run develop` to spin up a local instance of the Studio at localhost:3333. Note: even though your Studio is running locally, you are editing the production dataset on Sanity's servers.
3. Once you've made changes to the studio, run `sanity deploy` to deploy those changes to the live Studio
4. Please also run `sanity graphql deploy` to push schema changes to the GraphQL endpoint; this is ultimately what is referenced by the `gatsby-source-sanity` plugin.

## Structure

Important folders are, at this stage:

- `/schemas`:
  - `route.js` and `agency.js` represent the two custom document models
  - `schema.js` is where the final set of document schemas is exported

## Agency

The `agency` object controls which `feedIndex` is pulled for each agency; you can see this happening at the top of `gatsby-node.js`:

- First we ask Sanity for the agencies which are published
- We loop through those agencies, make our GraphQL queries, and generate pages for that agency

Therefore, the process to add a new agency to the site looks like this:

1. Ingest agency data with `gtfs-sql-importer`
2. Create new `agency` document referencing that new feed's `feed_index`/`feedIndex` value

## Scripts

- `deleteDocsByFilter.js` is a quick way to delete all routes: run with `sanity exec deleteDocsByFilter.js --with-user-token`