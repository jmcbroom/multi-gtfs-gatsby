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
      name: "fullName",
      title: "Agency full name",
      description: "The full name of the transit agency",
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
      name: "color",
      title: "Color",
      description: "A color for the agency",
      type: "color"
    },
    {
      name: "textColor",
      title: "Color",
      description: "A text color for the agency. Should contrast with the color above.",
      type: "color"
    },
    {
      name: "description",
      title: "Description",
      description: "A short description of the agency",
      type: "blockContent"
    },
    {
      name: "content",
      title: "Block content",
      description: "Extended information about this agency",
      type: "blockContent"
    },
    {
      name: "fareAttributes",
      title: "Fares",
      description: "Details about each type of fare offered",
      type: "array",
      of: [{ type: "fareAttribute" }],
    },
    {
      name: "fareContent",
      title: "Fare content",
      description: "Extended information about this agency's fare rules",
      type: "blockContent"
    }
  ]
}