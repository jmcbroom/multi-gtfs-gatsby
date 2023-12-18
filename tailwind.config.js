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
      fontSize: {
        '2xs': '.675rem',
      },
      spacing: {
        3: '0.75rem',
        128: '32rem',
        144: '36rem',
        160: '40rem',
        176: '44rem',
        192: '48rem',
        208: '52rem',
        224: '56rem'
      },
      borderWidth: {
        3: '3px'
      },
    },
  },
  plugins: ["gatsby-plugin-postcss"],
};
