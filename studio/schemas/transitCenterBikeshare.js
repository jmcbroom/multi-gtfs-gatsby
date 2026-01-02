export default {
  name: "transitCenterBikeshare",
  title: "Transit Center Bikeshare Station",
  type: "object",
  fields: [
    {
      name: "bikeshare",
      title: "Bikeshare System",
      type: "reference",
      to: [{ type: "bikeshare" }],
      validation: Rule => Rule.required()
    },
    {
      name: "stationId",
      title: "Station ID",
      description: "The GBFS station_id for this bikeshare station",
      type: "string",
      validation: Rule => Rule.required()
    },
    {
      name: "label",
      title: "Display Label",
      description: "Optional custom label for this station (e.g., 'East Entrance')",
      type: "string"
    }
  ],
  preview: {
    select: {
      stationId: 'stationId',
      label: 'label',
      bikeshareName: 'bikeshare.name'
    },
    prepare({ stationId, label, bikeshareName }) {
      return {
        title: label || `Station ${stationId}`,
        subtitle: `${bikeshareName || 'Bikeshare'} #${stationId}`
      }
    }
  }
}
