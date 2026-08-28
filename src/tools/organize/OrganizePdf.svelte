<script>
  import { PDFDocument } from 'pdf-lib';
  import Dropzone from '../../shell/Dropzone.svelte';
  import States from '../../shell/States.svelte';
  import { runWorkerJob } from '../../lib/workers/runWorkerJob';
  import { renderThumbnails } from './pageThumbnail';
  import { copy } from './copy';

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let workerLoadFailed = $state(false);
  let files = $state([]);
  let pages = $state([]);
  let draggedIndex = $state(null);
  let resultUrl = $state(null);
  let resultSize = $state(0);
  let keptCount = $state(0);

  let errorCopy = $derived(workerLoadFailed ? copy.errorWorkerLoad : copy.error);
  let canSave = $derived(pages.length >= 1 && state !== 'working');

  function labelFor(page) {
    const file = files[page.fileIndex];
    return files.length > 1
      ? `${file.file.name} - page ${page.pageIndex + 1}`
      : `Page ${page.pageIndex + 1}`;
  }

  async function handleFiles(event) {
    const dropped = event.detail;
    const startIndex = files.length;
    files = [...files, ...dropped.map((file) => ({ id: crypto.randomUUID(), file }))];
    resultUrl = null;
    state = 'empty';

    for (let i = 0; i < dropped.length; i++) {
      const file = dropped[i];
      const fileIndex = startIndex + i;

      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const pageCount = doc.getPageCount();
        const thumbs = await renderThumbnails(file, 130).catch(() => []);

        const additions = Array.from({ length: pageCount }, (_, pageIndex) => ({
          id: crypto.randomUUID(),
          fileIndex,
          pageIndex,
          thumb: thumbs[pageIndex] ?? null,
        }));
        pages = [...pages, ...additions];
      } catch {
        error = copy.error;
        state = 'error';
      }
    }
  }

  function moveUp(index) {
    if (index === 0) return;
    const next = pages.slice();
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    pages = next;
  }

  function moveDown(index) {
    if (index === pages.length - 1) return;
    const next = pages.slice();
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    pages = next;
  }

  function removePage(index) {
    pages = pages.filter((_, i) => i !== index);
  }

  function handleDragStart(index) {
    draggedIndex = index;
  }

  function handleDragOver(event) {
    event.preventDefault();
  }

  function handleDrop(index) {
    if (draggedIndex === null || draggedIndex === index) return;
    const next = pages.slice();
    const [moved] = next.splice(draggedIndex, 1);
    next.splice(index, 0, moved);
    pages = next;
    draggedIndex = null;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function startOrganize() {
    if (pages.length === 0) return;
    state = 'working';
    progress = 0;
    error = null;
    workerLoadFailed = false;
    keptCount = pages.length;

    const worker = new Worker(new URL('./organizePdf.worker.ts', import.meta.url), {
      type: 'module',
    });

    runWorkerJob(
      worker,
      {
        inputs: files.map((f) => f.file),
        pages: pages.map((p) => ({ fileIndex: p.fileIndex, pageIndex: p.pageIndex })),
      },
      {
        onProgress: (percent) => {
          progress = percent;
        },
        onDone: (result) => {
          resultUrl = URL.createObjectURL(result);
          resultSize = result.size;
          state = 'done';
        },
        onError: (message, failedToLoad) => {
          if (failedToLoad) {
            workerLoadFailed = true;
          } else {
            error = message;
          }
          state = 'error';
        },
      },
    );
  }
</script>

<Dropzone accept="application/pdf,.pdf" on:files={handleFiles} />

{#if pages.length > 0}
  <ul class="page-grid">
    {#each pages as p, index (p.id)}
      <li
        class="page-card"
        class:dragging={draggedIndex === index}
        draggable="true"
        ondragstart={() => handleDragStart(index)}
        ondragover={handleDragOver}
        ondrop={() => handleDrop(index)}
        ondragend={() => (draggedIndex = null)}
      >
        <div class="thumb">
          {#if p.thumb}
            <img src={p.thumb} alt={labelFor(p)} draggable="false" />
          {:else}
            <span class="thumb-fallback">{labelFor(p)}</span>
          {/if}
        </div>
        <div class="page-card-footer">
          <span class="page-label">{labelFor(p)}</span>
          <div class="reorder">
            <button
              type="button"
              onclick={() => moveUp(index)}
              disabled={index === 0}
              aria-label="Move up">↑</button
            >
            <button
              type="button"
              onclick={() => moveDown(index)}
              disabled={index === pages.length - 1}
              aria-label="Move down">↓</button
            >
            <button type="button" onclick={() => removePage(index)} aria-label="Remove">✕</button>
          </div>
        </div>
      </li>
    {/each}
  </ul>

  <p class="hint">{pages.length < 1 ? copy.minHint : copy.reorderHint}</p>

  <button onclick={startOrganize} disabled={!canSave}>{copy.button}</button>
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <p>{copy.done(keptCount, formatBytes(resultSize))}</p>
    {#if resultUrl}
      <a href={resultUrl} download="organized.pdf">{copy.download}</a>
      <a href={resultUrl} target="_blank" rel="noopener">{copy.preview}</a>
    {/if}
  </div>
  <span slot="error">{errorCopy}</span>
</States>

<style>
  .hint {
    font-family: var(--font-hand);
    font-size: 1.05rem;
    color: var(--color-muted);
    margin: 0.75rem 0;
  }

  .page-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 1rem;
    list-style: none;
    margin: 1rem 0 0;
    padding: 0;
  }

  .page-card {
    border: 1px solid var(--color-line);
    border-radius: 6px;
    background: var(--color-paper);
    padding: 0.5rem;
    cursor: grab;
  }

  .page-card.dragging {
    opacity: 0.4;
  }

  .thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 3 / 4;
    background: rgba(42, 38, 32, 0.04);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  .thumb img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .thumb-fallback {
    font-size: var(--size-sm);
    color: var(--color-muted);
    text-align: center;
    padding: 0.5rem;
  }

  .page-card-footer {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .page-label {
    font-size: var(--size-sm);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .reorder {
    display: flex;
    gap: 0.35rem;
  }

  .reorder button {
    width: 1.8rem;
    height: 1.8rem;
    padding: 0;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: var(--color-paper);
    color: var(--color-ink);
    cursor: pointer;
  }

  .reorder button:disabled {
    opacity: 0.35;
    cursor: default;
  }

  button {
    margin-top: 0.5rem;
  }
</style>
