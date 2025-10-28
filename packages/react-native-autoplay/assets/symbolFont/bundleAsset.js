// bundleAsset.js
const fs = require('fs');
const path = require('path');

const FontName = 'MaterialSymbolsOutlined-Regular';
const OutDirIos = path.resolve(__dirname, '../../ios/Assets/');
const OutDirAndroid = path.resolve(__dirname, '../../android/src/main/res/font');

const input = fs.readFileSync(`${__dirname}/${FontName}.codepoints`, 'utf8');
const lines = input.split(/\r?\n/);

const entries = [];
for (const line of lines) {
  if (!line.trim()) continue;
  const [name, hex] = line.split(/\s+/);
  const codepoint = Number.parseInt(hex, 16);
  entries.push([name, codepoint]);
}

// Write TS file
const linesOut = [
  `// Auto-generated from ${FontName}.codepoints — do not edit!`,
  'export const glyphMap = {',
  ...entries.map(([name, cp]) => `  "${name}": 0x${cp.toString(16)},`),
  '} as const;',
  '',
  'export type GlyphName = keyof typeof glyphMap;',
  '',
];

fs.writeFileSync(`${__dirname}/../../src/types/Glyphmap.ts`, linesOut.join('\n'));
console.log('glyphmap.ts written!');

fs.rmSync(OutDirIos, { recursive: true, force: true });
fs.mkdirSync(OutDirIos);
fs.copyFileSync(
  `${__dirname}/${FontName}.ttf`,
  `${OutDirIos}/${FontName}.ttf`,
  fs.constants.COPYFILE_EXCL
);

fs.rmSync(OutDirAndroid, { recursive: true, force: true });
fs.mkdirSync(OutDirAndroid);
fs.copyFileSync(
  `${__dirname}/${FontName}.ttf`,
  `${OutDirAndroid}/${FontName.toLowerCase().replaceAll('-', '_')}.ttf`,
  fs.constants.COPYFILE_EXCL
);
