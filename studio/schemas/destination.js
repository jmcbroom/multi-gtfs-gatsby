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
      description: "Extended content for the route page",
      type: "blockContent",
    },
    {
      name: "routes",
      title: "Routes",
      description: "Ways to get to the destination",
      type: "array",
      of: [{ type: "destinationRoute" }],
    },
  ],
};
