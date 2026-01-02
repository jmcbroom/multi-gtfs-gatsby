import ShapeInput from "../components/ShapeInput";

export default {
  title: "Transit Center",
  name: "transitCenter",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Name",
      description: "The name of the transit center",
      type: "string",
      validation: Rule => Rule.required()
    },
    {
      name: "slug",
      title: "Slug",
      description: "A URL slug for the transit center",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: Rule => Rule.required()
    },
    {
      name: "description",
      title: "Description",
      description: "A short description of the transit center",
      type: "blockContent"
    },
    {
      name: "boundary",
      title: "Boundary",
      description: "Draw the transit center boundary polygon",
      type: "string",
      components: {
        input: ShapeInput
      }
    },
    {
      name: "stops",
      title: "Stops",
      description: "The bus stops at this transit center",
      type: "array",
      of: [{ type: "transitCenterStop" }]
    },
    {
      name: "bikeshareStations",
      title: "Bikeshare Stations",
      description: "Bikeshare stations at this transit center",
      type: "array",
      of: [{ type: "transitCenterBikeshare" }]
    },
    {
      name: "content",
      title: "Additional Content",
      description: "Extended information about this transit center",
      type: "blockContent"
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'slug.current'
    }
  }
}
