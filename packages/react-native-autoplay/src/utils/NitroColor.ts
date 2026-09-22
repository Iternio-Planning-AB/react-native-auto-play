import { processColor } from 'react-native';

export type NitroColor = { lightColor: number; darkColor: number; isDefault?: boolean };
export type ThemedColor = { lightColor: string; darkColor: string };

const DefaultNitroColor = {
  darkColor: convertColor('white'),
  lightColor: convertColor('black'),
  isDefault: true,
};

function convertColor(color: string): number;
function convertColor(color?: string): number | undefined;
function convertColor(color?: string): number | undefined {
  // since we accept only string it can return a number only
  return processColor(color) as number | undefined;
}

function convert(color: ThemedColor | string): NitroColor;
function convert(color?: ThemedColor | string): NitroColor | undefined;
function convert(color?: ThemedColor | string): NitroColor | undefined {
  if (color == null) {
    return undefined;
  }

  if (typeof color === 'string') {
    if (color === 'default') {
      return DefaultNitroColor;
    }
    const convertedColor = convertColor(color);
    return { darkColor: convertedColor, lightColor: convertedColor };
  }

  const darkColor = convertColor(color.darkColor);
  const lightColor = convertColor(color.lightColor);

  return {
    darkColor,
    lightColor,
  };
}

export const NitroColorUtil = { convert };
