import { TextStyle } from 'react-native';

export const fontFamily = {
  /** 英文 / 数字 · 8-bit 像素 */
  latin: 'PressStart2P_400Regular',
  /** 中文 · 硬朗黑体 */
  cn: 'NotoSansSC_700Bold',
} as const;

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 24,
  display: 28,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const textVariants: Record<string, TextStyle> = {
  displayLatin: {
    fontFamily: fontFamily.latin,
    fontSize: fontSize.xl,
    lineHeight: fontSize.xl * lineHeight.relaxed,
  },
  titleLatin: {
    fontFamily: fontFamily.latin,
    fontSize: fontSize.lg,
    lineHeight: fontSize.lg * lineHeight.relaxed,
  },
  bodyLatin: {
    fontFamily: fontFamily.latin,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.relaxed,
  },
  captionLatin: {
    fontFamily: fontFamily.latin,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.relaxed,
  },
  titleCn: {
    fontFamily: fontFamily.cn,
    fontSize: fontSize.xxl,
    lineHeight: fontSize.xxl * lineHeight.normal,
  },
  bodyCn: {
    fontFamily: fontFamily.cn,
    fontSize: fontSize.md,
    lineHeight: fontSize.md * lineHeight.normal,
  },
  labelCn: {
    fontFamily: fontFamily.cn,
    fontSize: fontSize.sm,
    lineHeight: fontSize.sm * lineHeight.normal,
  },
  captionCn: {
    fontFamily: fontFamily.cn,
    fontSize: fontSize.xs,
    lineHeight: fontSize.xs * lineHeight.normal,
  },
};
