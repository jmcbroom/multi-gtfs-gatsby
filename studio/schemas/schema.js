// First, we must import the schema creator
import createSchema from "part:@sanity/base/schema-creator";

// Then import schema types from any plugins that might expose them
import schemaTypes from "all:part:@sanity/base/schema-type";
import blockContent from "./blockContent";

// GTFS models
import agency from "./agency";
import route from "./route";
// non-GTFS models
import destination from './destination'

// Then we give our schema to the builder and provide the result to Sanity
export default createSchema({
  // We name our schema
  name: "default",
  // Then proceed to concatenate our document type
  // to the ones provided by any plugins that are installed
  types: schemaTypes.concat([
    blockContent,

    // we add our GTFS models to this array
    agency,
    route,
  
    // additional non-GTFS models
    destination
  ]),
});
