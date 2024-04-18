const { create } = require("domain");
const path = require(`path`);
const axios = require("axios");

exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
  if (stage === "build-html") {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            test: /mapbox-gl/,
            use: loaders.null(),
          },
        ],
      },
    });
  }
};

// exports.createPages = async ({ graphql, actions: { createPage }, createNodeId, createContentDigest }) => {
//   // Fetch JSON data from the endpoint
//   const response = await axios.get('https://example.com/api/data');

//   // Create nodes from the fetched data
//   const jsonData = response.data;
//   jsonData.forEach((item) => {
//     const nodeData = {
//       // Set the node fields based on the fetched data
//       // For example:
//       id: createNodeId(`my-node-${item.id}`),
//       internal: {
//         type: 'MyNodeType',
//         contentDigest: createContentDigest(item),
//       },
//       // Other fields...
//     };
// //
//     // Create the node
//     createNode(nodeData);
//   });

//   // Rest of your code...
// };

exports.createPages = async ({ graphql, actions: { createPage } }) => {
  const allAgencies = await graphql(`
    {
      allSanityAgency {
        edges {
          node {
            currentFeedIndex
            agencyId
            name
            stopIdentifierField
            serviceIds
            agencyType
            slug {
              current
            }
          }
        }
      }
      allSanityBikeshare {
        edges {
          node {
            id
            fullName
            feedUrl
            name
            slug {
              current
            }
            textColor {
              hex
            }
            color {
              hex
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
      allSanityRoute(filter: {agency: {currentFeedIndex: {eq: ${a.currentFeedIndex}}}}) {
        edges {
          node {
            id
            shortName
            routeType
            displayShortName
            longName
          }
        }
      }
    }
  `);

    result.data.postgres.agencies.forEach((agency) => {
      if (a.agencyType !== "local-bus") {
        return;
      }

      createPage({
        path: `/${a.slug.current}/`,
        component: path.resolve("./src/templates/agency-page.js"),
        context: {
          id: agency.agencyId,
          feedIndex: agency.feedIndex,
          agencySlug: a.slug.current,
          initialTab: "",
        },
      });

      createPage({
        path: `/${a.slug.current}/routes`,
        component: path.resolve("./src/templates/agency-page.js"),
        context: {
          id: agency.agencyId,
          feedIndex: agency.feedIndex,
          agencySlug: a.slug.current,
          initialTab: "routes",
        },
      });

      createPage({
        path: `/${a.slug.current}/map`,
        component: path.resolve("./src/templates/agency-page.js"),
        context: {
          id: agency.agencyId,
          feedIndex: agency.feedIndex,
          agencySlug: a.slug.current,
          initialTab: "map",
        },
      });
    });

    result.data.postgres.stops.forEach((s) => {
      createPage({
        path: `/${a.slug.current}/stop/${s[a.stopIdentifierField]}`,
        component: path.resolve("./src/templates/stop-page.js"),
        context: {
          feedIndex: s.feedIndex,
          sanityFeedIndex: s.feedIndex,
          agencySlug: a.slug.current,
          stopId: s.stopId,
        },
      });
    });

    if (a.agencyType !== "local-bus") {
      return;
    }

    result.data.postgres.routes
      .filter((r) => r.trips.totalCount > 0)
      .forEach((r) => {
        // override routeShortName from gtfs with displayShortName from Sanity
        let short = r.routeShortName;

        let matchingSanityRoute = result.data.allSanityRoute.edges
          .map((e) => e.node)
          .filter((sr) => sr.shortName === r.routeShortName);

        if (matchingSanityRoute.length === 1) {
          if (matchingSanityRoute[0].displayShortName) {
            short = matchingSanityRoute[0].displayShortName;
          }
        }

        createPage({
          path: `/${a.slug.current}/route/${short}/`,
          component: path.resolve("./src/templates/route-page.js"),
          context: {
            routeNo: r.routeShortName,
            feedIndex: r.feedIndex,
            agencySlug: a.slug.current,
            initialTab: "",
            serviceIds: a.serviceIds,
          },
        });
        createPage({
          path: `/${a.slug.current}/route/${short}/map`,
          component: path.resolve("./src/templates/route-page.js"),
          context: {
            routeNo: r.routeShortName,
            feedIndex: r.feedIndex,
            agencySlug: a.slug.current,
            initialTab: "map",
            serviceIds: a.serviceIds,
          },
        });
        createPage({
          path: `/${a.slug.current}/route/${short}/stops`,
          component: path.resolve("./src/templates/route-page.js"),
          context: {
            routeNo: r.routeShortName,
            feedIndex: r.feedIndex,
            agencySlug: a.slug.current,
            initialTab: "stops",
            serviceIds: a.serviceIds,
          },
        });
        createPage({
          path: `/${a.slug.current}/route/${short}/schedule`,
          component: path.resolve("./src/templates/route-page.js"),
          context: {
            routeNo: r.routeShortName,
            feedIndex: r.feedIndex,
            agencySlug: a.slug.current,
            initialTab: "schedule",
            serviceIds: a.serviceIds,
          },
        });
      });
  }

  allAgencies.data.allSanityBikeshare.edges.forEach((b) => {
    const fetchBikeshareData = async () => {
      const response = await axios.get(
        `${b.node.feedUrl}/en/station_information`
      );
      return response.data;
    };

    let stations;

    fetchBikeshareData().then((data) => {
      stations = data.data.stations;

      // Create main bikeshare page
      createPage({
        path: `/${b.node.slug.current}/`,
        component: path.resolve("./src/templates/bikeshare-page.tsx"),
        context: {
          id: b.node.id,
          feedUrl: b.node.feedUrl,
          slug: b.node.slug.current,
          data: stations,
          initialTab: "home"
        },
      });
      
      // create bikeshare map page
      createPage({
        path: `/${b.node.slug.current}/map`,
        component: path.resolve("./src/templates/bikeshare-page.tsx"),
        context: {
          id: b.node.id,
          feedUrl: b.node.feedUrl,
          slug: b.node.slug.current,
          data: stations,
          initialTab: 'map'
        },
      });

      // create bikeshare station list page
      createPage({
        path: `/${b.node.slug.current}/stations`,
        component: path.resolve("./src/templates/bikeshare-page.tsx"),
        context: {
          id: b.node.id,
          feedUrl: b.node.feedUrl,
          slug: b.node.slug.current,
          data: stations,
          initialTab: 'stations'
        },
      });

      // create bikeshare fares page
      createPage({
        path: `/${b.node.slug.current}/fares`,
        component: path.resolve("./src/templates/bikeshare-page.tsx"),
        context: {
          id: b.node.id,
          feedUrl: b.node.feedUrl,
          slug: b.node.slug.current,
          data: stations,
          initialTab: 'fares'
        },
      });

      // Create bikeshare station pages
      stations.forEach((s) => {
        createPage({
          path: `/${b.node.slug.current}/station/${s.station_id}`,
          component: path.resolve("./src/templates/bikeshare-station-page.tsx"),
          context: {
            feedUrl: b.node.feedUrl,
            station: s,
            slug: b.node.slug.current,
            lat: s.lat,
            lon: s.lon,
          },
        });
      });
    });
  });
};
