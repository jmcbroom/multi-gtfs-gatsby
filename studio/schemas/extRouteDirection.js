import ShapeInput from "../components/ShapeInput";
import React from "react";

export default {
  name: "extRouteDirection",
  title: "Route direction info",
  type: "document",
  fields: [
    {
      name: "directionId",
      title: "Direction ID",
      description: "A direction_id from the GTFS data",
      type: "number",
    },
    {
      name: "directionHeadsign",
      title: "Direction Headsign",
      description: "An alternate headsign for this direction",
      type: "string",
    },
    {
      name: "directionDescription",
      title: "Direction description",
      description: "A way to describe the general direction for the given GTFS direction",
      type: "string",
      options: {
        list: [
          "northbound",
          "southbound",
          "eastbound",
          "westbound",
          "clockwise",
          "counterclockwise",
          "inbound",
          "outbound",
          "uptown",
          "downtown",
        ],
      },
    },
    {
      name: "directionTimepoints",
      title: "Direction timepoints",
      description: "An array of stop IDs that represent timepoints in this direction",
      type: "array",
      of: [{type: "string" }],
    },
    {
      name: "directionShape",
      title: "Direction shape",
      description: "Draw this direction's route shape using the line string button",
      type: "string",
      inputComponent: ShapeInput,
    },
  ],
  preview: {
    select: {
      directionId: "directionId",
      directionDescription: "directionDescription",
    },
    prepare({ directionDescription, directionId }) {
      return {
        // hacking together and 
        title: directionDescription.charAt(0).toUpperCase() + directionDescription.slice(1),
        subtitle: `direction_id: ${directionId}`,
      };
    },
  },
};
