export type Category = 'pdf' | 'image' | 'dev' | 'text' | 'generate';

export interface ToolManifest {
  id: string;
  name: string;
  h1?: string;
  category: Category;
  icon: string;
  summary: string;
  cardSummary?: string;
  accepts: string[];
  produces: string[];
  faq?: { q: string; a: string }[];
  sharedFaq?: boolean;
  guide?: { heading: string; body: string; link?: { text: string; href: string } }[];
  related?: { id: string; anchor: string }[];
  linkVariants?: boolean;
  variants?: {
    slug: string;
    h1: string;
    title: string;
    description: string;
    note?: string;
    guide?: { heading: string; body: string; link?: { text: string; href: string } }[];
    faq?: { q: string; a: string }[];
    props?: Record<string, unknown>;
  }[];
  seo?: {
    title?: string;
    description?: string;
  };
}
