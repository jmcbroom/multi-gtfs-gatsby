export default {
  name: "destination",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Place name",
      description: "The name of the destination",
      type: "string"
    },
    {
      name: "content",
      title: "Extended content",
      description: "Extended content for the route page",
      type: "blockContent"
    },
    {
      name: "routes",
      title: "Routes",
      description: "Ways to get to the destination",
      type: "array",
      of: [
        {
          name: "route",
          title: "Route",
          type: "document",
          fields: [
            {
              name: "routeName",
              title: "Route name",
              description: "The name of the route",
              type: "string",
            },
            {
              name: 'timetable',
              title: 'Timetable',
              type: 'table', // Specify 'table' type
            },
            {
              name: "routeContent",
              title: "Content",
              type: 'blockContent'
            }
          ]
        }
      ]
    }
  ]
}