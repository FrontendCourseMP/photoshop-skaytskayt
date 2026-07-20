export interface ImageDoc {
  source: SourceFormat;
  width: number;
  height: number;
  pixels: ImageData;
  colorDepth: string;
  hasMask?: boolean;
  /** Состав каналов: из метаданных файла, иначе — по пикселям (см. decode-функции) */
  isGray: boolean;
  hasAlphaChannel: boolean;
  fileName?: string;
}

export type SourceFormat = 'png' | 'jpg' | 'gb7';

export type SaveFormat = 'png' | 'jpg' | 'gb7' | 'gb7-mask';
