export type Category = 'pdf' | 'image' | 'dev' | 'text' | 'generate';

export interface ToolManifest {
  id: string;
  name: string;
  category: Category;
  icon: string;
  summary: string;
  accepts: string[];
  produces: string[];
  faq?: { q: string; a: string }[];
}
