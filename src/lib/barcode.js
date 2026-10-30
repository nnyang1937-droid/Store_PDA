import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import JsBarcode from 'jsbarcode';

export const EAN_PATTERN = /^(\d{13}|\d{8})$/;

export const isEan = (value) => EAN_PATTERN.test(value);

export function createBarcodeImage(value) {
  const canvas = document.createElement('canvas');

  JsBarcode(canvas, value, {
    format: value.length === 13 ? 'EAN13' : 'EAN8',
    width: 2.5,
    height: 80,
    margin: 20,
    displayValue: true,
    fontSize: 18,
    background: '#ffffff',
    lineColor: '#000000',
  });

  return canvas.toDataURL('image/png');
}

export function createEanHints() {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
  ]);
  return hints;
}

const imageReader = new BrowserMultiFormatReader();

export async function decodeBarcodeFromImage(file) {
  const url = URL.createObjectURL(file);

  try {
    const result = await imageReader.decodeFromImageUrl(url);
    return result.getText();
  } finally {
    URL.revokeObjectURL(url);
  }
}
