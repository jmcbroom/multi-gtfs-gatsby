import React from "react";
import { graphql } from "gatsby";

const About = ({ data }) => {
  return (
    <div className="my-6 p-2 leading-6">
      <h3>About this site</h3>
      <p>
        We're creating a web site which publishes information about the public
        transit systems in the Detroit-Windsor region for use by current and
        potential transit users. We utilize schedule data from each regional
        agency in a common machine-readable format, the{" "}
        <a href="https://gtfs.org">General Transit Feed Specification</a>, and
        augment with real-time API access whenever possible.
      </p>
      <h4>Data sources</h4>
      <h4>Code</h4>
    </div>
  );
};

export const query = graphql`
  {
    allSanityAgency {
      edges {
        node {
          currentFeedIndex
          agencyId
          name
          stopIdentifierField
          serviceIds
          agencyType
          slug {
            current
          }
        }
      }
    }
    allSanityBikeshare {
      edges {
        node {
          id
          fullName
          feedUrl
          name
          slug {
            current
          }
          textColor {
            hex
          }
          color {
            hex
          }
        }
      }
    }
    postgres {
      agencies: agenciesList {
        agencyName
        agencyUrl
        agencyTimezone
        agencyLang
        agencyPhone
        agencyFareUrl
        agencyEmail
        bikesPolicyUrl
        feedIndex
      }
    }
  }
`;

export default About;
