import { resize, type ResizeOptions } from '../../lib/image/resize';
import { compress, type CompressOptions } from '../../lib/image/compress';
import { convert, type ConvertOptions } from '../../lib/image/convert';

export type BulkOperation =
  | { type: 'resize'; opts: ResizeOptions }
  | { type: 'compress'; opts: CompressOptions }
  | { type: 'convert'; opts: ConvertOptions };

export type BulkProgress = (percent: number) => void;

export async function processOne(
  input: Blob,
  operation: BulkOperation,
  onProgress?: BulkProgress,
): Promise<Blob> {
  switch (operation.type) {
    case 'resize':
      return resize(input, operation.opts, onProgress);
    case 'compress':
      return compress(input, operation.opts, onProgress);
    case 'convert':
      return convert(input, operation.opts, onProgress);
  }
}
