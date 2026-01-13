/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#3b82f6', // Example, will refine based on image
                secondary: '#1e293b',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // User request mentions Google Fonts like Inter
            }
        },
    },
    plugins: [],
}
