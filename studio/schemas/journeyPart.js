export default {
  name: "journeyPart",
  title: "Journey Part",
  type: "document",
  fields: [
    {
      name: "title",
      title: "Journey part title",
      type: "string"
    },
    {
      name: "agency",
      title: "Transit service",
      type: "reference",
      to: [{type: "agency"}]
    },
    {
      name: "identifier",
      title: "Service identifier: a train or bus number",
      type: "string"
    },
    {
      name: "journeyPartDestTime",
      type: "array",
      of: [{type: "journeyPartDestTime"}]
    }
  ]
}