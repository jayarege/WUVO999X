const theme = {
  movie: {
    light: {
      primary: '#6C2BD9',          // Deep Purple for header
      primaryGradient: ['#612EF0','#6C2BD9', '#321680'], // Light purple to deep purple
      background: '#FFFFFF',
      card: '#F5F5F5',
      text: '#333333',
      subText: '#666666',
      accent: '#FFD700',          // Gold for highlights
      secondary: '#FFA000',       // Orange for ratings
      
      // Border settings
      border: {
        width: 2,                 // 2px border width
        color: '#6C2BD9',        // Primary color borders
        radius: 12,              // Border radius
        style: 'solid'           // Border style
      },
      
      font: {
        header: 'CooperBlack',
        body: 'BookmanOldStyle',
      },
    },
    dark: {
      primary: '#6C2BD9',         // BlueViolet
      primaryGradient: ['#612EF0','#6C2BD9', '#321680'], // Lighter purple to blue violet
      background: '#1C2526',
      card: '#2A3132',
      text: '#F5F5F5',
      subText: '#D3D3D3',
      accent: '#FFD700',
      secondary: '#FFA000',
      
      // Border settings
      border: {
        width: 2,                 // 2px border width
        color: '#8A2BE2',        // Brighter purple for dark mode
        radius: 12,              // Border radius
        style: 'solid'           // Border style
      },
      
      font: {
        header: 'CooperBlack',
        body: 'BookmanOldStyle',
      },
    },
  },
  
  tv: {
    light: {
      primary: '#59ADE8',         // UCLA Blue
      primaryGradient: ['#95C4EF', '#59ADE8'], // Light blue to UCLA blue
      background: '#FFFFFF',
      card: '#F5F5F5',
      text: '#333333',
      subText: '#666666',
      accent: '#FFD700',
      secondary: '#FFA000',
      
      // Border settings
      border: {
        width: 2,                 // 2px border width
        color: '#59ADE8',        // Primary blue borders
        radius: 12,              // Border radius
        style: 'solid'           // Border style
      },
      
      font: {
        header: 'CooperBlack',
        body: 'BookmanOldStyle',
      },
    },
    dark: {
      primary: '#59ADE8',         // Sapphire Blue
      primaryGradient: ['#95C4EF', '#59ADE8'], // Brighter blue to sapphire blue
      background: '#121212',
      card: '#1C1C1C',
      text: '#EEEEEE',
      subText: '#AAAAAA',
      accent: '#FFD700',
      secondary: '#FFA000',
      
      // Border settings
      border: {
        width: 2,                 // 2px border width
        color: '#7BC3F0',        // Lighter blue for dark mode
        radius: 12,              // Border radius
        style: 'solid'           // Border style
      },
      
      font: {
        header: 'CooperBlack',
        body: 'BookmanOldStyle',
      },
    },
  },
};

export default theme;