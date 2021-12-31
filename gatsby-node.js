const path = require(`path`)

exports.createPages = async ({ graphql, actions: { createPage } }) => {

  let agencyFeedIndexes = {
    8: `ddot`,
    9: `smart`
  }

  const result = await graphql(`
    {
      postgres {
        agencies: agenciesList(filter: {feedIndex: {greaterThan: 7}}) {
          agencyName
          agencyUrl
          agencyTimezone
          agencyLang
          agencyPhone
          agencyFareUrl
          agencyEmail
          bikesPolicyUrl
          feedIndex
        }
        routes: routesList(filter: {feedIndex: {greaterThan: 7}}) {
          agencyId
          routeShortName
          routeLongName
          routeDesc
          routeType
          routeUrl
          routeColor
          routeTextColor
          routeSortOrder
          feedIndex
        }
      }
    }
  `);

  result.data.postgres.agencies.forEach(a => {
    createPage({
      path: `/${agencyFeedIndexes[a.feedIndex]}`,
      component: path.resolve("./src/templates/agency-page.js"),
      context: {
        id: a.agencyId,
        feedIndex: a.feedIndex
      }
    });
  });

  result.data.postgres.routes.forEach(r => {
    createPage({
      path: `/${agencyFeedIndexes[r.feedIndex]}/route/${r.routeShortName}`,
      component: path.resolve("./src/templates/route-page.js"),
      context: {
        routeNo: r.routeShortName,
        feedIndex: r.feedIndex
      }
    });
  });
};