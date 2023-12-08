import React from "react";
import { graphql } from "gatsby";

const Bikeshare = ({ data, pageContext, location }) => {

  let bikeshare = data.allSanityBikeshare.edges[0].node;

  return (
    <div>
      <h1>{bikeshare.fullName}</h1>
      <p>{bikeshare.description}</p>
    </div>
  );
}

export const query = graphql`
  query($slug: String!) {
    allSanityBikeshare(filter: { slug: { current: { eq: $slug } } }) {
      edges {
        node {
          name
          fullName
          description: _rawDescription
          slug {
            current
          }
        }
      }
    }
  }
`;

export default Bikeshare;