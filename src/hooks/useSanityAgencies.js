import { useStaticQuery, graphql } from "gatsby";

export const useSanityAgencies = () => {
  const data = useStaticQuery(
    graphql`
      query {
        sanityAgencies: allSanityAgency {
          edges {
            node {
              name
              fullName
              id
              onestopId
              realTimeEnabled
              stopIdentifierField
              apiStopIdentifierField
              currentFeedIndex
              otpFeedId
              gtfsRtVehiclePositions
              color {
                hex
              }
              textColor {
                hex
              }
              slug {
                current
              }
            }
          }
        }
      }`
  );
  return data;
}