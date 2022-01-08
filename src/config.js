/**
 * Site-wide configuration.
 * 
 * feedIndex maps the feedIndex numbers at the center of the database schema to a specific string we use in URL patterns
 */
const config = {
  feedIndexes: {
    8: `ddot`,
    9: `smart`,
    10: `the-ride`,
    11: `mta`,
    12: `transit-windsor`
  }
}

export default config;