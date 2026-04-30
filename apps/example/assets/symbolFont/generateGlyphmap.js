// generateGlyphmap.js — generates a typed glyph map from the Material Symbols codepoints file.
const fs = require('fs');

const FontName = 'MaterialSymbolsOutlined-Regular';
const input = fs.readFileSync(`${__dirname}/${FontName}.codepoints`, 'utf8');
const lines = input.split(/\r?\n/);

const entries = [];
for (const line of lines) {
  if (!line.trim()) continue;
  const [name, hex] = line.split(/\s+/);
  const codepoint = Number.parseInt(hex, 16);
  entries.push([name, codepoint]);
}

const linesOut = [
  `// Auto-generated from ${FontName}.codepoints — do not edit!`,
  'export const glyphMap = {',
  ...entries.map(([name, cp]) => `  "${name}": 0x${cp.toString(16)},`),
  '} as const;',
  '',
  'export type GlyphName = keyof typeof glyphMap;',
  '',
];

fs.writeFileSync(`${__dirname}/Glyphmap.ts`, linesOut.join('\n'));
console.log('Glyphmap.ts written!');
