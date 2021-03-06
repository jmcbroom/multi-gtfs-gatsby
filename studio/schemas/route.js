import React from "react";

export default {
  title: "Route",
  name: "route",
  type: "document",
  fields: [
    {
      name: "shortName",
      title: "Route short name",
      description:
        "Short name of a route. This will often be a short, abstract identifier like '32', '100X', or 'Green' that riders use to identify a route.",
      type: "string",
    },
    {
      name: "longName",
      title: "Route long name",
      description:
        "Full name of a route. This name is generally more descriptive than the routeShortName and often includes the route's destination or stop.",
      type: "string",
    },
    {
      name: "slug",
      title: "Route slug",
      description: "A slug for the bus route",
      type: "slug",
      options: {
        source: "shortName",
        maxLength: 128,
      },
    },
    {
      name: "routeType",
      title: "Route type",
      description: "The type of route. This will vary according to agency.",
      type: "string",
    },
    {
      name: "color",
      title: "Route color",
      description: "Route color designation that matches public facing material.",
      type: "color",
    },
    {
      name: "textColor",
      title: "Route text color",
      description: "Legible color to use for text drawn against a background of route_color.",
      type: "color",
    },
    {
      name: "agency",
      title: "Agency",
      description: "The agency that runs this route",
      type: "reference",
      to: [{ type: "agency" }],
      validation: (Rule) => Rule.required(),
    },
    {
      name: "content",
      title: "Extended content",
      description: "Extended content for the route page",
      type: "blockContent",
    },
    {
      name: "extRouteDirections",
      title: "Extended route directions",
      description: "Additional information about directions for this route",
      type: "array",
      of: [{ type: "extRouteDirection" }],
    },
  ],
  preview: {
    select: {
      shortName: "shortName",
      longName: "longName",
      color: "color",
      textColor: "textColor",
      agency: "agency.name",
    },
    prepare({ shortName, longName, agency, color, textColor }) {
      return {
        title: longName,
        subtitle: agency,
        media: (
          <div
            style={{
              width: `100%`,
              height: `100%`,
              backgroundColor: color.hex,
              color: textColor.hex,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontWeight: "700",
                fontSize: shortName.length == 3 ? "0.8em" : "1em",
              }}
            >
              {shortName}
            </span>
          </div>
        ),
      };
    },
  },
};
