export default {
  name: "journey",
  type: "document",
  fields: [
    {
      name: "journeyName",
      title: "Name of journey",
      type: "string"
    },
    {
      name: "journeyParts",
      type: "array",
      of: [
        {type: "journeyPart"}
      ]
    },
    {
      name: "description",
      type: "blockContent"
    }
  ]
}