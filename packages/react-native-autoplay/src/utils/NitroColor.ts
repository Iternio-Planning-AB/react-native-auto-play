import { processColor } from 'react-native';

export type NitroColor = { lightColor: number; darkColor: number };
export type ThemedColor = { lightColor: string; darkColor: string };

function convert(color: string): number;
function convert(color?: string): number | undefined;
function convert(color?: string): number | undefined {
  // since we accept only string it can return a number only
  return processColor(color) as number | undefined;
}

function convertThemed(color: ThemedColor): NitroColor;
function convertThemed(color?: ThemedColor): NitroColor | undefined;
function convertThemed(color?: ThemedColor): NitroColor | undefined {
  if (color == null) {
    return undefined;
  }

  const darkColor = convert(color.darkColor);
  const lightColor = convert(color.lightColor);

  return {
    darkColor,
    lightColor,
  };
}

export const NitroColorUtil = { convert, convertThemed };
