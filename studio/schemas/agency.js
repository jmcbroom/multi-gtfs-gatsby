export default {
  title: "Agency",
  name: "agency",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Agency name",
      description: "The name of the transit agency",
      type: "string"
    },
    {
      name: "slug",
      title: "Agency slug",
      description: "A URL slug for the transit agency",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
    },
    {
      name: "currentFeedIndex",
      title: "Feed index",
      description: "The currently valid GTFS feed index #",
      type: "number"
    },
    {
      name: "content",
      title: "Block content",
      description: "Extended information about this agency",
      type: "blockContent"
    }
  ]
}