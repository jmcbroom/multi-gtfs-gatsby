import { useStaticQuery, graphql } from "gatsby";

export const useSanityRoutes = () => {
  const data = useStaticQuery(
    graphql`
      query {
        sanityRoutes: allSanityRoute{
          edges {
            node {
              agency {
                currentFeedIndex
                slug {
                  current
                }
              }
              longName
              shortName
              displayShortName: shortName
              color {
                hex
              }
              textColor {
                hex
              }
              mapPriority
              directions: extRouteDirections {
                directionHeadsign
                directionDescription
                directionId
                directionTimepoints
                directionShape
              }
            }
          }
        }
      }
    `
  );
  return data;
}