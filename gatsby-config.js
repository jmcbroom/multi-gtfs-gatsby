require("dotenv").config({
  path: `.env.${process.env.NODE_ENV}`,
})

module.exports = {
  siteMetadata: {
    siteUrl: "https://transit.det.city",
    title: "transit.det.city",
    description: "Real-time transit information for Detroit and Southeast Michigan",
    author: "transit.det.city",
  },
  plugins: [
    "gatsby-plugin-netlify",
    "gatsby-plugin-postcss",
    "gatsby-plugin-image",
    // {
    //   resolve: "gatsby-plugin-google-analytics",
    //   options: {
    //     trackingId: "",
    //   },
    // },
    "gatsby-plugin-sitemap",
    {
      resolve: "gatsby-plugin-manifest",
      options: {
        name: "transit.det.city",
        short_name: "transit.det.city",
        description: "Transit information for Detroit/Windsor/Southeast Michigan",
        start_url: "/",
        background_color: "#ffffff",
        theme_color: "#1f2937", // Dark gray theme color
        display: "standalone",
        orientation: "portrait",
        icon: "src/images/icon.png",
        icons: [
          {
            src: "src/images/icon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "src/images/icon.png", 
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        categories: ["travel", "navigation", "utilities"],
        scope: "/",
        lang: "en",
        cache_busting_mode: "none",
        crossOrigin: "use-credentials"
      },
    },
    "gatsby-plugin-offline", // Must be listed after gatsby-plugin-manifest
    {
      resolve: `gatsby-plugin-layout`,
      options: {
        component: require.resolve(`./src/components/layout.js`)
      }
    },
    "gatsby-plugin-mdx",
    "gatsby-plugin-sharp",
    "gatsby-transformer-sharp",
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "images",
        path: "./src/images/",
      },
      __key: "images",
    },
    {
      resolve: "gatsby-source-filesystem",
      options: {
        name: "pages",
        path: "./src/pages/",
      },
      __key: "pages",
    },
    {
      resolve: "gatsby-source-pg",
      options: {
        connectionString: process.env.PG_CONN,
        schema: "gtfs",
        refetchInterval: 60, // Refetch data every 60 seconds
        appendPlugins: [require("@graphile-contrib/pg-simplify-inflector"), require("postgraphile-plugin-connection-filter")],
      },
    },
    {
      resolve: "gatsby-source-sanity",
      options: {
        projectId: process.env.SANITY_PROJECT_ID,
        dataset: process.env.SANITY_DATASET,
        token: process.env.SANITY_TOKEN,
        watchMode: true,
      }
    }
  ]
};
