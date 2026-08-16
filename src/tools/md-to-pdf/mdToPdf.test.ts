import { describe, it, expect } from 'vitest';
import { markdownToHtml } from './mdToPdf';

describe('markdownToHtml', () => {
  it('renders headings, bold, and lists', () => {
    const html = markdownToHtml('# Title\n\n**bold** and a list:\n\n- one\n- two');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<li>one</li>');
  });
});
