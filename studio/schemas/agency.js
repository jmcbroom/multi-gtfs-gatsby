export default {
  title: "Agency",
  name: "agency",
  type: "document",
  groups: [
    {
      name: 'gtfsIds',
      title: 'GTFS identifiers',
    }
  ],
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
      name: "agencyId",
      title: "Agency ID",
      description: "The ID of the transit agency -- this is usually 1",
      type: "string",
      default: "1"
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
    },
    {
      name: "agencyType",
      title: "Agency type",
      description: "The type of transit agency",
      type: "string",
      options: {
        list: [
          { title: "Local bus", value: "local-bus" },
          { title: "Rail", value: "rail" },
          { title: "Express bus", value: "express-bus" }
        ]
      }
    },
    {
      name: "realTimeEnabled",
      title: "Real-time enabled",
      description: "Is real-time data available for this agency?",
      type: "boolean",
      validation: Rule => Rule.required()
    },
    {
      name: "stopIdentifierField",
      title: "Stop identifier field",
      description: `The field used to publicly identify stops for this agency.
  
        For example, SMART uses stop IDs, while DDOT uses stop codes.`,
      type: "string",
      validation: Rule => Rule.required(),
      options: {
        list: [
          { title: "Stop ID", value: "stopId" },
          { title: "Stop code", value: "stopCode" },
        ],
      },
      group: 'gtfsIds'
    },
    {
      name: "serviceIds",
      title: "Service IDs",
      description: "The IDs of the services offered by this agency",
      type: "array",
      of: [{ type: "string" }],
      group: 'gtfsIds'
    },
    {
      name: "currentFeedIndex",
      title: "Feed index",
      description: "The currently valid GTFS feed index #",
      type: "number",
      group: 'gtfsIds'
    },
  ]
}