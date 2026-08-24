import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'metadata',
  name: 'Image Metadata',
  category: 'image',
  icon: 'file-info',
  summary: "See what's hiding in a photo's metadata, and clear it.",
  accepts: ['image/jpeg', 'image/png', 'image/webp'],
  produces: ['image/jpeg', 'image/png', 'image/webp'],
};

export default manifest;
