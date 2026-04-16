import { Buffer } from 'buffer';

export function toWavBase64(pcm: ArrayBuffer): string {
  const sampleRate = 16_000;
  const numChannels = 1;
  const bitDepth = 16;
  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  const blockAlign = numChannels * (bitDepth / 8);
  const dataSize = pcm.byteLength;

  const wav = new ArrayBuffer(44 + dataSize);
  const view = new DataView(wav);

  // RIFF header
  view.setUint8(0, 0x52);
  view.setUint8(1, 0x49); // "RI"
  view.setUint8(2, 0x46);
  view.setUint8(3, 0x46); // "FF"
  view.setUint32(4, 36 + dataSize, true); // file size - 8
  view.setUint8(8, 0x57);
  view.setUint8(9, 0x41); // "WA"
  view.setUint8(10, 0x56);
  view.setUint8(11, 0x45); // "VE"

  // fmt chunk
  view.setUint8(12, 0x66);
  view.setUint8(13, 0x6d); // "fm"
  view.setUint8(14, 0x74);
  view.setUint8(15, 0x20); // "t "
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data chunk
  view.setUint8(36, 0x64);
  view.setUint8(37, 0x61); // "da"
  view.setUint8(38, 0x74);
  view.setUint8(39, 0x61); // "ta"
  view.setUint32(40, dataSize, true);
  new Uint8Array(wav, 44).set(new Uint8Array(pcm));

  return Buffer.from(new Uint8Array(wav)).toString('base64');
}
