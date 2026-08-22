<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import VerifyNote from '../../shell/VerifyNote.svelte';
  import { markdownToHtml } from './mdToPdf';
  import { copy } from './copy';

  let markdown = $state('# Untitled\n\nStart typing, or drop a .md file above.');
  let html = $derived(markdownToHtml(markdown));

  async function handleFiles(event) {
    const file = event.detail[0];
    if (!file) return;
    markdown = await file.text();
  }

  function saveAsPdf() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${markdown.split('\n')[0].replace(/^#+\s*/, '') || 'Document'}</title>
    <style>
      @page { margin: 0; }
      body {
        margin: 0;
        padding: 2cm;
        box-sizing: border-box;
        -webkit-box-decoration-break: clone;
        box-decoration-break: clone;
        font-family: Georgia, 'Times New Roman', serif;
        line-height: 1.5;
        color: #2a2620;
      }
      h1, h2, h3 { margin: 1.2em 0 0.5em; line-height: 1.25; }
      h1:first-child, h2:first-child, h3:first-child { margin-top: 0; }
      p, ul, ol { margin: 0 0 1em; }
    </style>
  </head>
  <body>${html}</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }
</script>

<Dropzone accept=".md,text/markdown" on:files={handleFiles} />
<p class="hint">{copy.empty}</p>

<div class="editor">
  <textarea bind:value={markdown} class="source" spellcheck="false"></textarea>
  <div class="preview">{@html html}</div>
</div>

<button onclick={saveAsPdf}>{copy.button}</button>
<p class="hint">{copy.hint}</p>
<VerifyNote />

<style>
  .hint {
    font-size: var(--size-sm);
    color: var(--color-muted);
    margin: 0.5rem 0;
  }

  .editor {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin: 1rem 0;
  }

  .source {
    height: 60vh;
    max-height: 60vh;
    font-family: monospace;
    font-size: var(--size-sm);
    padding: 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: var(--color-paper);
    color: var(--color-ink);
    resize: vertical;
  }

  .preview {
    height: 60vh;
    max-height: 60vh;
    padding: 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    overflow-y: auto;
  }

  .preview :global(h1),
  .preview :global(h2),
  .preview :global(h3) {
    margin: 1.2em 0 0.5em;
  }

  .preview :global(h1:first-child),
  .preview :global(h2:first-child),
  .preview :global(h3:first-child) {
    margin-top: 0;
  }

  .preview :global(p),
  .preview :global(ul),
  .preview :global(ol) {
    margin: 0 0 1em;
  }
</style>
