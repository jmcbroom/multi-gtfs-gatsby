export default {
  name: "destinationRoute",
  title: "Destination Route",
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