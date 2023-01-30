import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2021-08-21" });

let query = `
  *[_type == "route"]{
    _id,
    shortName,
    routeType,
    longName,
    agency->{slug}
  }
`;

client.fetch(query).then((routes) => {
  console.log("Routes:");
  routes.forEach((route) => {
    let importance = 2;
    
    // ddot
    if (route.agency.slug.current === "ddot") {
      let routeNum = parseInt(route.shortName)
      // ConnectTen
      if (routeNum < 11) {
        importance = 1
      }
      // Key
      if ([16, 17, 18, 19, 23, 27, 30, 31, 32, 38, 60].indexOf(routeNum) > -1) {
        importance = 2
      }
      // Neighborhood
      if ([11, 12, 13, 15, 29, 39, 40, 41, 42, 43, 47, 52, 54, 67, 68].indexOf(routeNum) > -1) {
        importance = 3
      }
      // Peak-Hour
      if (routeNum == 46) {
        importance = 4
      }
    }

    if (route.agency.slug.current === 'smart') {
      if (route.routeType === 'fast') {
        importance = 1
      }
    }

    console.log(`${route.agency.slug.current} ${route.shortName} importance: ${importance}`)
    
    // client
    //   .patch(route._id)
    //   .set({ importance: 1 })
    //   .commit()
    //   .then(
    //     console.log(
    //       `updated ${route.agency.slug.current} ${route.shortName}`
    //     )
    //   ).catch((err) => console.log(err));
  });
});
