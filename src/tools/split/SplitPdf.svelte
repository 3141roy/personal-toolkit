<script>
  import { PDFDocument } from 'pdf-lib';
  import Dropzone from '../../shell/Dropzone.svelte';
  import States from '../../shell/States.svelte';
  import { runWorkerJob } from '../../lib/workers/runWorkerJob';
  import { parseRanges, everyPageRange } from './splitPdf';
  import { copy } from './copy';

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let workerLoadFailed = $state(false);
  let inputFile = $state(null);
  let pageCount = $state(null);
  let mode = $state('each');
  let rangesInput = $state('');
  let rangeError = $state(null);
  let results = $state([]);

  let errorCopy = $derived(workerLoadFailed ? copy.errorWorkerLoad : copy.error);

  async function handleFiles(event) {
    const file = event.detail[0];
    if (!file) return;
    inputFile = file;
    results = [];
    state = 'empty';
    error = null;
    pageCount = null;

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
      pageCount = doc.getPageCount();
    } catch {
      pageCount = null;
    }
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function startSplit() {
    if (!inputFile || !pageCount) return;
    rangeError = null;

    let ranges;
    if (mode === 'each') {
      ranges = everyPageRange(pageCount);
    } else {
      try {
        ranges = parseRanges(rangesInput, pageCount);
      } catch (err) {
        rangeError = copy.badRange(err instanceof Error ? err.message : String(err));
        return;
      }
    }

    state = 'working';
    progress = 0;
    error = null;
    workerLoadFailed = false;

    const worker = new Worker(new URL('./splitPdf.worker.ts', import.meta.url), {
      type: 'module',
    });

    runWorkerJob(
      worker,
      { input: inputFile, ranges },
      {
        onProgress: (percent) => {
          progress = percent;
        },
        onDone: (blobs) => {
          const base = inputFile.name.replace(/\.[^.]+$/, '');
          results = blobs.map((blob, index) => {
            const { start, end } = ranges[index];
            const label = start === end ? `page-${start}` : `pages-${start}-${end}`;
            return {
              id: crypto.randomUUID(),
              url: URL.createObjectURL(blob),
              size: blob.size,
              name: `${base}-${label}.pdf`,
            };
          });
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

  function downloadAll() {
    results.forEach((r, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = r.url;
        a.download = r.name;
        a.click();
      }, i * 150);
    });
  }
</script>

<Dropzone accept="application/pdf,.pdf" on:files={handleFiles} />

{#if inputFile}
  {#if pageCount}
    <p class="current-size">{pageCount} page{pageCount !== 1 ? 's' : ''}</p>

    <div class="mode-picker">
      <label>
        <input type="radio" bind:group={mode} value="each" />
        {copy.everyPageLabel}
      </label>
      <label>
        <input type="radio" bind:group={mode} value="ranges" />
        {copy.rangesLabel}
      </label>
    </div>

    {#if mode === 'ranges'}
      <div class="options">
        <label class="ranges-label">
          {copy.rangesHint}
          <input
            type="text"
            bind:value={rangesInput}
            oninput={() => (rangeError = null)}
            placeholder={copy.rangesPlaceholder}
          />
        </label>
        {#if rangeError}
          <p class="range-error">{rangeError}</p>
        {/if}
      </div>
    {/if}

    <button onclick={startSplit} disabled={state === 'working'}>{copy.button}</button>
  {:else}
    <p class="hint">{copy.error}</p>
  {/if}
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <p>
      {copy.done(results.length)}
      {#if results.length > 1}
        <button type="button" onclick={downloadAll}>{copy.downloadAll}</button>
      {/if}
    </p>
    <ul class="file-list">
      {#each results as r (r.id)}
        <li class="file-row">
          <span class="file-name">{r.name}</span>
          <span class="file-size">{formatBytes(r.size)}</span>
          <a href={r.url} download={r.name}>{copy.download}</a>
          <a href={r.url} target="_blank" rel="noopener">{copy.preview}</a>
        </li>
      {/each}
    </ul>
  </div>
  <span slot="error">{errorCopy}</span>
</States>

<style>
  .current-size {
    font-family: var(--font-hand);
    font-size: 1.05rem;
    color: var(--color-muted);
    margin: 0.75rem 0 0;
  }

  .hint {
    font-size: var(--size-sm);
    color: var(--color-muted);
    margin: 0.5rem 0 0;
  }

  .mode-picker {
    display: flex;
    gap: 1.2rem;
    margin: 1rem 0;
    font-size: var(--size-sm);
  }

  .mode-picker label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
  }

  .options {
    margin: 1rem 0;
  }

  .ranges-label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: var(--size-sm);
    color: var(--color-muted);
    max-width: 320px;
  }

  .ranges-label input[type='text'] {
    font-family: var(--font-body);
    font-size: var(--size-base);
    padding: 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: var(--color-paper);
    color: var(--color-ink);
  }

  .range-error {
    font-size: var(--size-sm);
    color: var(--color-oxblood);
    margin: 0.5rem 0 0;
  }

  .file-list {
    list-style: none;
    margin: 1rem 0 0;
    padding: 0;
  }

  .file-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0;
    border-bottom: 1px solid var(--color-line);
    font-size: var(--size-sm);
  }

  .file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-size {
    color: var(--color-muted);
    flex-shrink: 0;
  }

  button {
    margin-top: 0.5rem;
  }
</style>
