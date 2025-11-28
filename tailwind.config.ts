/** @type {import('tailwindcss').Config} */

module.exports = {
  prefix: 'sw-',
  content: [
    './assets/*.{liquid,js,mjs}',
    '!./assets/*.min.{js,mjs}',
    './config/*.json',
    './layout/*.liquid',
    './sections/*.liquid',
    './blocks/*.liquid',
    './snippets/*.liquid',
    './templates/**/*.{liquid,json}',
    './frontend/entrypoints/*.{js,ts}',
    './blocks/*.liquid',
  ],
  theme: {
    fontFamily:{
      body:['Open Sans'],
      heading:['Inter'],
    },
    extend: {
      boxShadow: {
        'tiny': '0px 0px 2px 0px rgba(0, 0, 0, 0.25)',
        'popup': '0px 0px 2px 0px rgba(0, 0, 0, 0.25)'
      },
      backgroundImage:{
        'tags': 'linear-gradient(90deg, #FFE693 0%, #FFF8E1 100%)',
        'soft-pink': 'linear-gradient(180deg, #FFF3F4 0%, #FFFAFA 100%)',
        'offer-orange': 'linear-gradient(180deg, #FFE8BF 30%, #FFF7E9 100%)',
        'offer-pink': ' linear-gradient(180deg, #FFD8DE 30%, #FFF3F4 100%)',
        'mainbg': 'linear-gradient(180deg, #FFF3F4 0%, #FFFFFF 100%)',
      },
    
      translate:{
        '-1/2': '-50%',
      }
    },
  },
  plugins: [
    function ({ addUtilities }) { 
      addUtilities({
        '.scrollbar-hide': {
          /* Hide scrollbar for Webkit browsers */
          '&::-webkit-scrollbar': {
            display: 'none', 
          },
          /* Hide scrollbar for IE, Edge and Firefox */
          '-ms-overflow-style': 'none', // IE and Edge
          'scrollbar-width': 'none',    // Firefox 
        },
      })
    }
  ],
}
