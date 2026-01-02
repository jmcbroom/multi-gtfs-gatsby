export default {
  name: "transitCenterStop",
  title: "Transit Center Stop",
  type: "object",
  fields: [
    {
      name: "agency",
      title: "Agency",
      type: "reference",
      to: [{ type: "agency" }],
      validation: Rule => Rule.required()
    },
    {
      name: "stopId",
      title: "Stop ID/Code",
      description: "The stop ID or code (depending on agency's stopIdentifierField)",
      type: "string",
      validation: Rule => Rule.required()
    },
    {
      name: "label",
      title: "Display Label",
      description: "Optional custom label for this stop (e.g., 'Bay A', 'Northbound')",
      type: "string"
    }
  ],
  preview: {
    select: {
      stopId: 'stopId',
      label: 'label',
      agencyName: 'agency.name'
    },
    prepare({ stopId, label, agencyName }) {
      return {
        title: label || `Stop ${stopId}`,
        subtitle: `${agencyName} #${stopId}`
      }
    }
  }
}
