export default {
  name: "destination",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Place name",
      description: "The name of the destination",
      type: "string",
    },
    {
      name: "content",
      title: "Extended content",
      description: "Extended content for the destination page",
      type: "blockContent",
    },
    {
      name: "journeys",
      title: "Journeys",
      description: "Ways to get to the destination",
      type: "array",
      of: [{ type: "journey" }],
    },
    {
      name: "timezone",
      title: "Time Zone",
      description: "What time zone the destination is in",
      type: "string",
      options: {
        list: [
          {value: 'America/New York', title: 'America/New York',},
          {value: 'America/Chicago', title: 'America/Chicago',},
          {value: 'America/Detroit', title: 'America/Detroit',},
          {value: 'America/Toronto', title: 'America/Toronto',}
        ]
      }
    }

  ],
};
