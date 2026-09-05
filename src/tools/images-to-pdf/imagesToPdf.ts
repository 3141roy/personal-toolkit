import { PDFDocument } from 'pdf-lib';

export type ImagesToPdfProgress = (percent: number) => void;

export async function imagesToPdf(inputs: Blob[], onProgress?: ImagesToPdfProgress): Promise<Blob> {
  if (inputs.length === 0) {
    throw new Error('imagesToPdf: no images to convert');
  }

  const output = await PDFDocument.create();

  for (let index = 0; index < inputs.length; index++) {
    const bytes = new Uint8Array(await inputs[index].arrayBuffer());
    const image =
      inputs[index].type === 'image/png'
        ? await output.embedPng(bytes)
        : await output.embedJpg(bytes);

    const page = output.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });

    onProgress?.(Math.round(((index + 1) / inputs.length) * 100));
  }

  const bytes = await output.save();
  return new Blob([bytes.slice().buffer], { type: 'application/pdf' });
}
