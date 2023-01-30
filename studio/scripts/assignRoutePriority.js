import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2021-08-21" });

let query = `
  *[_type == "route"][!defined(mapPriority)][0...10]{
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
    let routeNum = parseInt(route.shortName)

    // ddot
    if (route.agency.slug.current === "ddot") {
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
      if ([400, 615, 550, 430, 140, 525, 250, 160, 760, 730, 420, 405, 796, 200, 210, 375, 780, 494, 275].indexOf(routeNum) > -1) {
        importance = 3
      }
      if ([805, 851, 830, 620, 530, 255, 635].indexOf(routeNum) > -1) {
        importance = 4
      }
    }

    if (route.agency.slug.current === 'the-ride') {
      if ([4, 5, 23, 28].indexOf(routeNum) > -1) {
        importance = 1
      }
      if ([68, 61, 33, 65].indexOf(routeNum) > -1) {
        importance = 3
      }
      if ([63, 34, 64].indexOf(routeNum) > -1) {
        importance = 4
      }
    }

    console.log(`${route.agency.slug.current} ${route.shortName} importance: ${importance}`)
    
    client
      .patch(route._id)
      .set({ mapPriority: importance })
      .commit()
      .then(
        console.log(
          `updated ${route.agency.slug.current} ${route.shortName}`
        )
      ).catch((err) => console.log(err));
  });
});
