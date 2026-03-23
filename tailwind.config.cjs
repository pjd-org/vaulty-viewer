/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@vault/ui/tailwind')],
  content: ['./app/**/*.{js,ts,jsx,tsx}', './src/**/*.{js,ts,jsx,tsx}'],
  corePlugins: {
    preflight: false,
  },
}
