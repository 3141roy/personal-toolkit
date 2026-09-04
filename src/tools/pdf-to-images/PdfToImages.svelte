<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import States from '../../shell/States.svelte';
  import { copy } from './copy';

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let inputFile = $state(null);
  let format = $state('image/jpeg');
  let quality = $state(85);
  let pages = $state([]);

  let errorCopy = $derived(
    error && /getimagedata|fingerprint|convertToBlob/i.test(error)
      ? copy.errorCanvasBlocked
      : copy.error,
  );

  function handleFiles(event) {
    const file = event.detail[0];
    if (!file) return;
    inputFile = file;
    pages = [];
    state = 'empty';
  }

  function extensionFor(mimeType) {
    return mimeType.split('/')[1];
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function startExport() {
    if (!inputFile) return;
    state = 'working';
    progress = 0;
    error = null;
    pages = [];

    try {
      const { pdfToImages } = await import('./pdfToImages');
      const result = await pdfToImages(inputFile, { format, quality: quality / 100 }, (percent) => {
        progress = percent;
      });
      pages = result.map((blob, index) => ({
        id: crypto.randomUUID(),
        index,
        url: URL.createObjectURL(blob),
        size: blob.size,
      }));
      state = 'done';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Export failed';
      state = 'error';
    }
  }

  function downloadAll() {
    pages.forEach((p, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = p.url;
        a.download = `page-${p.index + 1}.${extensionFor(format)}`;
        a.click();
      }, i * 150);
    });
  }
</script>

<Dropzone accept="application/pdf,.pdf" on:files={handleFiles} />

{#if inputFile}
  <div class="options">
    <label>
      Format
      <select bind:value={format}>
        <option value="image/jpeg">JPEG</option>
        <option value="image/png">PNG</option>
      </select>
    </label>
    {#if format === 'image/jpeg'}
      <label class="quality-label">
        Quality: {quality}%
        <input type="range" bind:value={quality} min="1" max="100" />
      </label>
    {/if}
  </div>

  <button onclick={startExport} disabled={state === 'working'}>{copy.button}</button>
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <div class="actions">
      <p>{copy.done(pages.length)}</p>
      <button type="button" onclick={downloadAll}>{copy.downloadAll}</button>
    </div>
    <ul class="page-grid">
      {#each pages as p (p.id)}
        <li class="page-card">
          <div class="thumb">
            <img src={p.url} alt={`Page ${p.index + 1}`} />
          </div>
          <div class="page-card-footer">
            <span class="page-label">Page {p.index + 1} · {formatBytes(p.size)}</span>
            <div class="page-card-links">
              <a href={p.url} download={`page-${p.index + 1}.${extensionFor(format)}`}
                >{copy.download}</a
              >
              <a href={p.url} target="_blank" rel="noopener">{copy.preview}</a>
            </div>
          </div>
        </li>
      {/each}
    </ul>
  </div>
  <span slot="error">{errorCopy}</span>
</States>

<style>
  .options {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 1rem;
    margin: 1rem 0;
  }

  .options label,
  .quality-label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: var(--size-sm);
    color: var(--color-muted);
    min-width: 160px;
  }

  select {
    font-family: var(--font-body);
    font-size: var(--size-base);
    padding: 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: var(--color-paper);
    color: var(--color-ink);
  }

  button {
    margin-top: 0.5rem;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .actions p {
    margin: 0;
  }

  .actions button {
    margin-top: 0;
  }

  .page-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 1rem;
    list-style: none;
    margin: 0 0 1rem;
    padding: 0;
  }

  .page-card {
    min-width: 0;
    border: 1px solid var(--color-line);
    border-radius: 6px;
    background: var(--color-paper);
    padding: 0.5rem;
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

  .page-card-links {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-size: var(--size-sm);
  }
</style>
