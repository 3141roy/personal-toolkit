export type Category = 'pdf' | 'image' | 'dev' | 'text' | 'generate';
export type RunsOn = 'device' | 'server';

export interface ToolManifest {
  id: string;
  name: string;
  category: Category;
  icon: string;
  summary: string;
  tier: 'core' | 'later';
  runsOn: RunsOn;
  accepts: string[];
  produces: string[];
  related?: string[];
  keywords?: string[];
  load: () => Promise<unknown>;
}
