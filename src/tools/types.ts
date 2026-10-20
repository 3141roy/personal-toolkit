export type Category = 'pdf' | 'image' | 'dev' | 'text' | 'generate';

export interface ToolManifest {
  id: string;
  name: string;
  category: Category;
  icon: string;
  summary: string;
  cardSummary?: string;
  accepts: string[];
  produces: string[];
  faq?: { q: string; a: string }[];
  sharedFaq?: boolean;
  guide?: { heading: string; body: string }[];
  related?: { id: string; anchor: string }[];
  variants?: {
    slug: string;
    from: string;
    to: string;
    h1: string;
    title: string;
    description: string;
    note: string;
  }[];
  seo?: {
    title?: string;
    description?: string;
  };
}
