import type { ToolManifest, Category } from './types';

const modules = import.meta.glob('./*/manifest.ts', { eager: true });

export const tools: ToolManifest[] = Object.values(modules)
  .map((m: any) => m.default)
  .filter((t: ToolManifest) => !t.id.startsWith('_'));

export const byCategory = (c: Category) => tools.filter((t) => t.category === c);
export const byId = (id: string) => tools.find((t) => t.id === id);
