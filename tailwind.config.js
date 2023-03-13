module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: "#eeeef1",
          dark: "#161619"
        }
      },
    },
  },
  plugins: ["gatsby-plugin-postcss"],
};
