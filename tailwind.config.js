/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        graphit: {
          blue: "#0066F9",
          navy: "#003892",
          orange: "#FF6F43",
          purple: "#4c00c4",
          mint: "#1fc198",
        },
      },
    },
  },
  plugins: [],
};
