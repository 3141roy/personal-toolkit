import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

const browserTestFiles = [
  'src/lib/image/**/*.test.ts',
  'src/tools/bulk/**/*.test.ts',
  'src/tools/crop/**/*.test.ts',
  'src/tools/heic-to-jpg/**/*.test.ts',
  'src/tools/images-to-pdf/**/*.test.ts',
  'src/tools/md-to-pdf/**/*.test.ts',
  'src/tools/metadata/**/*.test.ts',
  'src/tools/organize/pageThumbnail.test.ts',
  'src/tools/pdf-compress/**/*.test.ts',
  'src/tools/rotate/**/*.test.ts',
  'src/tools/round-crop/**/*.test.ts',
];

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'browser',
          include: browserTestFiles,
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        test: {
          name: 'node',
          exclude: [...browserTestFiles, 'node_modules/**', 'dist/**'],
        },
      },
    ],
  },
});
