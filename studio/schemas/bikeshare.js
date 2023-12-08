export default {
  title: "Bikeshare",
  name: "bikeshare",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Bikeshare name",
      description: "The name of the bikeshare agency",
      type: "string"
    },
    {
      name: "fullName",
      title: "Bikeshare full name",
      description: "The full name of the bikeshare agency",
      type: "string"
    },
    {
      name: "slug",
      title: "Bikeshare slug",
      description: "A URL slug for the bikeshare agency",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
    },
    {
      name: "feedUrl",
      title: "Feed URL",
      description: "The URL of the GBFS feed for this bikeshare",
      type: "url"
    },
    // {
    //   name: "agencyId",
    //   title: "Agency ID",
    //   description: "The ID of the transit agency -- this is usually 1",
    //   type: "string",
    //   default: "1"
    // },
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
      description: "A short description of the bikeshare",
      type: "blockContent"
    },
    {
      name: "content",
      title: "Block content",
      description: "Extended information about this bikeshare",
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
      description: "Extended information about this bikeshare's fare rules",
      type: "blockContent"
    },
    {
      name: "fareCurrency",
      title: "Fare currency",
      description: "The currency used for fares",
      type: "string",
      options: {
        list: [
          { title: "US dollar", value: "USD" },
          { title: "Canadian dollar", value: "CAD" },
        ]
      }
    }
  ]
}