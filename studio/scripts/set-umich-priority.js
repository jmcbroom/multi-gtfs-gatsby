import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2021-08-21" });

// Query for all UMich routes (adjust the agency slug if different)
let query = `
  *[_type == "route" && agency->slug.current == "umich"]{
    _id,
    shortName,
    longName,
    mapPriority
  }
`;

client.fetch(query).then((routes) => {
  console.log(`Found ${routes.length} UMich routes`);

  routes.forEach((route) => {
    console.log(`Setting ${route.shortName} "${route.longName}" to priority 4 (was: ${route.mapPriority || 'undefined'})`);

    client
      .patch(route._id)
      .set({ mapPriority: 4 })
      .commit()
      .then(() => {
        console.log(`✓ Updated ${route.shortName}`);
      })
      .catch((err) => {
        console.error(`✗ Error updating ${route.shortName}:`, err);
      });
  });
});
