export const colorPrimitives = {
  paper: {
    canvas: '#FAF9F6',
    card: '#FFFFFF',
    sidebar: '#F4F3F0',
  },
  darkPaper: {
    canvas: '#0F0F11',
    card: '#17171A',
    sidebar: '#141416',
  },
  charcoal: {
    900: '#1A1A1A',
    800: '#262626',
    600: '#666666',
    400: '#9E9EA8',
    300: '#B2B0A9',
    100: '#E6E5E0',
    50: '#F4F4F6',
  },
  brand: {
    forest: '#0E4F2F',
    forestHover: '#0A3C23',
    purple: '#8A5CF5',
    purpleLight: '#F1EAFF',
    orange: '#F05A28',
    lime: '#E5FF60',
  },
  status: {
    success: '#0E4F2F',
    successBg: '#E2FFEF',
    warning: '#F05A28',
    warningBg: '#FFF1EA',
    danger: '#D32F2F',
    dangerBg: '#FFF0F0',
    info: '#3B82F6',
    infoBg: '#EFF6FF',
  }
} as const;

export interface ColorTokens {
  bg: {
    canvas: string;
    card: string;
    sidebar: string;
  };
  text: {
    main: string;
    muted: string;
    placeholder: string;
    inverse: string;
  };
  border: {
    default: string;
    focus: string;
  };
  brand: {
    forest: string;
    forestHover: string;
    purple: string;
    purpleLight: string;
    orange: string;
    lime: string;
  };
  status: {
    success: string;
    successBg: string;
    warning: string;
    warningBg: string;
    danger: string;
    dangerBg: string;
    info: string;
    infoBg: string;
  };
}

export const lightColors: ColorTokens = {
  bg: {
    canvas: colorPrimitives.paper.canvas,
    card: colorPrimitives.paper.card,
    sidebar: colorPrimitives.paper.sidebar,
  },
  text: {
    main: colorPrimitives.charcoal[900],
    muted: colorPrimitives.charcoal[600],
    placeholder: colorPrimitives.charcoal[300],
    inverse: '#FFFFFF',
  },
  border: {
    default: colorPrimitives.charcoal[100],
    focus: colorPrimitives.brand.purple,
  },
  brand: colorPrimitives.brand,
  status: colorPrimitives.status,
};

export const darkColors: ColorTokens = {
  bg: {
    canvas: colorPrimitives.darkPaper.canvas,
    card: colorPrimitives.darkPaper.card,
    sidebar: colorPrimitives.darkPaper.sidebar,
  },
  text: {
    main: colorPrimitives.charcoal[50],
    muted: colorPrimitives.charcoal[400],
    placeholder: '#52525B',
    inverse: colorPrimitives.charcoal[900],
  },
  border: {
    default: '#27272A',
    focus: colorPrimitives.brand.purple,
  },
  brand: colorPrimitives.brand,
  status: colorPrimitives.status,
};
