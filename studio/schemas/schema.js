import blockContent from "./blockContent";

// GTFS models
import agency from "./agency";
import route from "./route";
// non-GTFS models
import destination from './destination'
import destinationRoute from "./destinationRoute";
import indexPage from "./indexPage";
import extRouteDirection from "./extRouteDirection";
import fareAttribute from "./fareAttribute";
import journeyPart from "./journeyPart";
import journey from "./journey";
import journeyPartDestTime from "./journeyPartDestTime";

import bikeshare from "./bikeshare";
import comment from "./comment";

export default [
  blockContent,

  // user feedback
  comment,

  // content pages
  indexPage,

  // we add our GTFS models to this array
  agency,
  route,

  // additional non-GTFS models
  destination,
  journey,
  journeyPart,
  journeyPartDestTime,
  extRouteDirection,
  fareAttribute,

  // GBFS
  bikeshare,
];
