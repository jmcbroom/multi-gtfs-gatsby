const { create } = require("domain");
const path = require(`path`);

exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
  if (stage === "build-html") {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /mapbox-gl/,
            use: loaders.null()
          }
        ]
      }
    });
  }
};

exports.createPages = async ({ graphql, actions: { createPage } }) => {
  const allAgencies = await graphql(`
    {
      allSanityAgency {
        edges {
          node {
            currentFeedIndex
            agencyId
            name
            slug {
              current
            }
          }
        }
      }
    }
  `);

  let agencies = allAgencies.data.allSanityAgency.edges.map((e) => e.node);
  for (let a of agencies) {
    const result = await graphql(`
    {
      postgres {
        agencies: agenciesList(filter: {feedIndex: {equalTo: ${a.currentFeedIndex}}, agencyId: {equalTo: "${a.agencyId}"}}) {
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
        routes: routesList(filter: {feedIndex: {equalTo: ${a.currentFeedIndex}}, agencyId: {equalTo: "${a.agencyId}"}}) {
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
          trips: tripsByFeedIndexAndRouteId {
            totalCount
          }
        }
        stops: stopsList(filter: {feedIndex: {equalTo: ${a.currentFeedIndex}}}) {
          stopId
          stopCode
          feedIndex
        }
      }
    }
  `);

    result.data.postgres.agencies.forEach((agency) => {

      createPage({
        path: `/${a.slug.current}/`,
        component: path.resolve("./src/templates/agency-page.js"),
        context: {
          id: agency.agencyId,
          feedIndex: agency.feedIndex,
          agencySlug: a.slug.current,
          initialTab: ''
        },
      });

      createPage({
        path: `/${a.slug.current}/routes`,
        component: path.resolve("./src/templates/agency-page.js"),
        context: {
          id: agency.agencyId,
          feedIndex: agency.feedIndex,
          agencySlug: a.slug.current,
          initialTab: 'routes'
        },
      });

      createPage({
        path: `/${a.slug.current}/map`,
        component: path.resolve("./src/templates/agency-page.js"),
        context: {
          id: agency.agencyId,
          feedIndex: agency.feedIndex,
          agencySlug: a.slug.current,
          initialTab: 'map'
        },
      });


    });

    result.data.postgres.stops
      .forEach(s => {
        createPage({
          path: `/${a.slug.current}/stop/${a.slug.current === 'ddot' ? s.stopCode : s.stopId}`,
          component: path.resolve("./src/templates/stop-page.js"),
          context: {
            feedIndex: s.feedIndex,
            sanityFeedIndex: s.feedIndex,
            agencySlug: a.slug.current,
            stopId: s.stopId
          }
        })
      })

    result.data.postgres.routes
      .filter((r) => r.trips.totalCount > 0)
      .forEach((r) => {

        createPage({
          path: `/${a.slug.current}/route/${r.routeShortName}/`,
          component: path.resolve("./src/templates/route-page.js"),
          context: {
            routeNo: r.routeShortName,
            feedIndex: r.feedIndex,
            agencySlug: a.slug.current,
            initialTab: ''
          },
        });
        createPage({
          path: `/${a.slug.current}/route/${r.routeShortName}/map`,
          component: path.resolve("./src/templates/route-page.js"),
          context: {
            routeNo: r.routeShortName,
            feedIndex: r.feedIndex,
            agencySlug: a.slug.current,
            initialTab: 'map'
          },
        });
        createPage({
          path: `/${a.slug.current}/route/${r.routeShortName}/stops`,
          component: path.resolve("./src/templates/route-page.js"),
          context: {
            routeNo: r.routeShortName,
            feedIndex: r.feedIndex,
            agencySlug: a.slug.current,
            initialTab: 'stops'
          },
        });
        createPage({
          path: `/${a.slug.current}/route/${r.routeShortName}/schedule`,
          component: path.resolve("./src/templates/route-page.js"),
          context: {
            routeNo: r.routeShortName,
            feedIndex: r.feedIndex,
            agencySlug: a.slug.current,
            initialTab: 'schedule'
          },
        });


      });
  }
};
