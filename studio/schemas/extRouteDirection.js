export default {
  name: "extRouteDirection",
  title: "Route direction info",
  type: "document",
  fields: [
    {
      name: "directionId",
      title: "Direction ID",
      description: "A direction_id from the GTFS data",
      type: "number",
    },
    {
      name: "directionHeadsign",
      title: "Direction Headsign",
      description: "An alternate headsign for this direction",
      type: "string",
    },
    {
      name: "directionName",
      title: "Direction Name",
      description: "The name of this direction",
      type: "string",
      options: {
        list: [
          "northbound",
          "southbound",
          "eastbound",
          "westbound",
          "clockwise",
          "counterclockwise",
          "inbound",
          "outbound",
          "uptown",
          "downtown",
        ],
      },
    },
  ],
};
