import { borders } from './borders';
import { colors } from './colors';
import { spacing } from './spacing';
import { fontFamily, fontSize, textVariants } from './typography';

export const theme = {
  colors,
  borders,
  spacing,
  fontFamily,
  fontSize,
  textVariants,
} as const;

export type Theme = typeof theme;
