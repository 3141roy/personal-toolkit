<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import { copy } from './copy';

  const formats = [
    { mimeType: 'image/jpeg', label: 'JPEG' },
    { mimeType: 'image/webp', label: 'WebP' },
    { mimeType: 'image/png', label: 'PNG' },
  ];

  let files = $state([]);
  let operation = $state('resize');
  let resizeWidth = $state(800);
  let resizeHeight = $state(600);
  let compressQuality = $state(75);
  let compressFormat = $state('image/jpeg');
  let convertFormat = $state('image/jpeg');
  let processing = $state(false);

  let doneCount = $derived(files.filter((f) => f.status === 'done').length);
  let workingCount = $derived(files.filter((f) => f.status === 'working').length);

  function handleFiles(event) {
    const dropped = event.detail;
    const additions = dropped.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0,
      resultUrl: null,
      resultSize: 0,
      message: null,
      workerLoadFailed: false,
    }));
    files = [...files, ...additions];
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function errorMessageFor(f) {
    if (f.workerLoadFailed) return copy.errorWorkerLoad;
    return f.message && /getimagedata|fingerprint|convertToBlob/i.test(f.message)
      ? copy.errorCanvasBlocked
      : copy.error;
  }

  function buildOperation() {
    if (operation === 'resize') {
      return { type: 'resize', opts: { width: resizeWidth, height: resizeHeight } };
    }
    if (operation === 'compress') {
      return {
        type: 'compress',
        opts: { quality: compressQuality / 100, mimeType: compressFormat },
      };
    }
    return { type: 'convert', opts: { mimeType: convertFormat } };
  }

  function extensionFor(mimeType) {
    return mimeType.split('/')[1];
  }

  function startAll() {
    const pending = files.filter((f) => f.status === 'pending' || f.status === 'error');
    if (pending.length === 0) return;

    processing = true;
    const op = buildOperation();
    const worker = new Worker(new URL('./bulk.worker.ts', import.meta.url), { type: 'module' });

    for (const f of pending) {
      f.status = 'working';
      f.progress = 0;
      f.message = null;
      f.workerLoadFailed = false;
    }

    worker.onerror = () => {
      for (const f of pending) {
        if (f.status === 'working') {
          f.status = 'error';
          f.workerLoadFailed = true;
        }
      }
      processing = false;
      worker.terminate();
    };

    worker.onmessage = (event) => {
      const message = event.data;
      const target = files.find((f) => f.id === message.id);

      if (message.type === 'file-progress') {
        if (target) target.progress = message.percent;
      } else if (message.type === 'file-done') {
        if (target) {
          target.status = 'done';
          target.resultUrl = URL.createObjectURL(message.result);
          target.resultSize = message.result.size;
        }
      } else if (message.type === 'file-error') {
        if (target) {
          target.status = 'error';
          target.message = message.message;
        }
      } else if (message.type === 'all-done') {
        processing = false;
        worker.terminate();
      }
    };

    worker.postMessage({
      files: pending.map((f) => ({ id: f.id, input: f.file })),
      operation: op,
    });
  }

  function downloadAll() {
    const done = files.filter((f) => f.status === 'done' && f.resultUrl);
    done.forEach((f, i) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = f.resultUrl;
        a.download = downloadName(f);
        a.click();
      }, i * 150);
    });
  }

  function downloadName(f) {
    if (operation === 'convert') {
      return `converted-${f.file.name.replace(/\.[^.]+$/, '')}.${extensionFor(convertFormat)}`;
    }
    if (operation === 'compress') {
      return `compressed-${f.file.name.replace(/\.[^.]+$/, '')}.${extensionFor(compressFormat)}`;
    }
    return `resized-${f.file.name}`;
  }
</script>

<Dropzone on:files={handleFiles} />

{#if files.length === 0}
  <p class="hint">{copy.empty}</p>
{:else}
  <div class="operation-picker">
    <label>
      <input type="radio" bind:group={operation} value="resize" />
      Resize
    </label>
    <label>
      <input type="radio" bind:group={operation} value="compress" />
      Compress
    </label>
    <label>
      <input type="radio" bind:group={operation} value="convert" />
      Convert
    </label>
  </div>

  {#if operation === 'resize'}
    <div class="options">
      <label>
        Width
        <input type="number" bind:value={resizeWidth} min="1" />
      </label>
      <label>
        Height
        <input type="number" bind:value={resizeHeight} min="1" />
      </label>
    </div>
  {:else if operation === 'compress'}
    <div class="options">
      <label>
        Output format
        <select bind:value={compressFormat}>
          {#each formats as format (format.mimeType)}
            <option value={format.mimeType}>{format.label}</option>
          {/each}
        </select>
      </label>
      <label class="quality-label">
        Quality: {compressQuality}%
        <input type="range" bind:value={compressQuality} min="1" max="100" />
      </label>
    </div>
  {:else}
    <div class="options">
      <label>
        Convert to
        <select bind:value={convertFormat}>
          {#each formats as format (format.mimeType)}
            <option value={format.mimeType}>{format.label}</option>
          {/each}
        </select>
      </label>
    </div>
  {/if}

  <div class="actions">
    <button onclick={startAll} disabled={processing}>{copy.button}</button>
    {#if doneCount > 0}
      <button type="button" onclick={downloadAll}>{copy.downloadAll}</button>
    {/if}
    {#if workingCount > 0}
      <span class="status-line">{copy.working(doneCount, files.length)}</span>
    {:else if doneCount > 0}
      <span class="status-line">{copy.done(doneCount)}</span>
    {/if}
  </div>

  <ul class="file-list">
    {#each files as f (f.id)}
      <li class="file-row">
        <span class="file-name">{f.file.name}</span>
        <span class="file-size">{formatBytes(f.file.size)}</span>
        {#if f.status === 'pending'}
          <span class="file-status muted">waiting</span>
        {:else if f.status === 'working'}
          <progress value={f.progress} max="100"></progress>
        {:else if f.status === 'done'}
          <span class="file-status done">→ {formatBytes(f.resultSize)}</span>
          <a href={f.resultUrl} download={downloadName(f)}>{copy.download}</a>
          <a href={f.resultUrl} target="_blank" rel="noopener">{copy.preview}</a>
        {:else if f.status === 'error'}
          <span class="file-status error">{errorMessageFor(f)}</span>
        {/if}
      </li>
    {/each}
  </ul>
{/if}

<style>
  .hint {
    color: var(--color-muted);
    font-size: var(--size-sm);
    margin: 1rem 0;
  }

  .operation-picker {
    display: flex;
    gap: 1.2rem;
    margin: 1rem 0;
    font-size: var(--size-sm);
  }

  .operation-picker label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
  }

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

  .options input[type='number'] {
    width: 5.5rem;
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

  .actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 1rem 0;
  }

  .status-line {
    font-family: var(--font-hand);
    font-size: 1.05rem;
    color: var(--color-muted);
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

  .file-status {
    flex-shrink: 0;
  }

  .file-status.muted {
    color: var(--color-muted);
  }

  .file-status.done {
    color: var(--color-oxblood);
  }

  .file-status.error {
    color: var(--color-oxblood);
    max-width: 300px;
  }

  progress {
    width: 100px;
  }
</style>
