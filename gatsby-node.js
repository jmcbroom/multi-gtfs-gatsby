const path = require(`path`);
const axios = require("axios");

// Calculate distance in meters between two lat/lon points using Haversine formula
const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

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

  // Fetch all bikeshare stations upfront for nearby calculations
  let allBikeshareStations = [];
  for (let b of allAgencies.data.allSanityBikeshare.edges) {
    try {
      const response = await axios.get(`${b.node.feedUrl}/station_information.json`);
      const stations = response.data.data.stations.map(s => ({
        ...s,
        bikeshareSlug: b.node.slug.current,
        feedUrl: b.node.feedUrl,
      }));
      allBikeshareStations = allBikeshareStations.concat(stations);
    } catch (err) {
      console.error(`Error fetching bikeshare stations for ${b.node.name}:`, err.message);
    }
  }

  for (let a of agencies) {
    // fetch information about the specific agency
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
          stopLat
          stopLon
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

    if (a.agencyType !== "local-bus") {
      continue;
    }

    result.data.postgres.agencies.forEach((agency) => {
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

    for (let s of result.data.postgres.stops) {
      // Find nearest bikeshare station within 500m
      let nearbyBikeshare = null;
      if (s.stopLat && s.stopLon && allBikeshareStations.length > 0) {
        let nearestDistance = Infinity;
        for (const station of allBikeshareStations) {
          const distance = getDistanceMeters(s.stopLat, s.stopLon, station.lat, station.lon);
          if (distance < nearestDistance && distance <= 500) {
            nearbyBikeshare = {
              station_id: station.station_id,
              name: station.name,
              lat: station.lat,
              lon: station.lon,
              distance: Math.round(distance),
              bikeshareSlug: station.bikeshareSlug,
              feedUrl: station.feedUrl,
            };
            nearestDistance = distance;
          }
        }
      }

      createPage({
        path: `/${a.slug.current}/stop/${s[a.stopIdentifierField]}`,
        component: path.resolve("./src/templates/stop-page.js"),
        context: {
          feedIndex: s.feedIndex,
          sanityFeedIndex: s.feedIndex,
          agencySlug: a.slug.current,
          stopId: s.stopId,
          nearbyBikeshare,
        },
      });
    }

    // make individual route pages
    let routesWithTrips = result.data.postgres.routes.filter(
      (r) => r.trips.totalCount > 0
    );
    routesWithTrips.forEach((r) => {
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

  for (let b of allAgencies.data.allSanityBikeshare.edges) {
    const response = await axios.get(
      `${b.node.feedUrl}/station_information.json`
    );

    let { stations } = response.data.data;

    // Create main bikeshare page
    createPage({
      path: `/${b.node.slug.current}/`,
      component: path.resolve("./src/templates/bikeshare-page.tsx"),
      context: {
        id: b.node.id,
        feedUrl: b.node.feedUrl,
        slug: b.node.slug.current,
        data: stations,
        initialTab: "home",
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
        initialTab: "map",
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
        initialTab: "stations",
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
        initialTab: "fares",
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
  }
};
