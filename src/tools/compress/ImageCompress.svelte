<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import States from '../../shell/States.svelte';
  import { copy } from './copy';

  const formats = [
    { mimeType: 'image/jpeg', label: 'JPEG' },
    { mimeType: 'image/webp', label: 'WebP' },
    { mimeType: 'image/png', label: 'PNG (lossless, quality ignored)' },
  ];

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let workerLoadFailed = $state(false);
  let quality = $state(75);
  let targetFormat = $state('image/jpeg');
  let inputFile = $state(null);
  let inputSize = $state(0);
  let resultUrl = $state(null);
  let resultSize = $state(0);

  let errorCopy = $derived(
    workerLoadFailed
      ? copy.errorWorkerLoad
      : error && /getimagedata|fingerprint|convertToBlob/i.test(error)
        ? copy.errorCanvasBlocked
        : copy.error,
  );

  function handleFiles(event) {
    const file = event.detail[0];
    if (!file) return;
    inputFile = file;
    inputSize = file.size;
    resultUrl = null;
    state = 'empty';
    targetFormat = file.type === 'image/png' ? 'image/webp' : file.type;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function extensionFor(mimeType) {
    return mimeType.split('/')[1];
  }

  function startCompress() {
    if (!inputFile) return;
    state = 'working';
    progress = 0;
    error = null;
    workerLoadFailed = false;

    const worker = new Worker(new URL('./compress.worker.ts', import.meta.url), { type: 'module' });

    worker.onerror = () => {
      workerLoadFailed = true;
      state = 'error';
      worker.terminate();
    };

    worker.onmessage = (event) => {
      const message = event.data;
      if (message.type === 'progress') {
        progress = message.percent;
      } else if (message.type === 'done') {
        resultUrl = URL.createObjectURL(message.result);
        resultSize = message.result.size;
        state = 'done';
        worker.terminate();
      } else if (message.type === 'error') {
        error = message.message;
        state = 'error';
        worker.terminate();
      }
    };

    worker.postMessage({ input: inputFile, opts: { quality: quality / 100, mimeType: targetFormat } });
  }
</script>

<Dropzone on:files={handleFiles} />

{#if inputFile}
  <p class="current-size">Current: {formatBytes(inputSize)}</p>

  {#if inputFile.type === 'image/png'}
    <p class="hint">PNG is lossless, so it won't shrink. Switched output to WebP for real compression.</p>
  {/if}

  <div class="options">
    <label>
      Output format
      <select bind:value={targetFormat}>
        {#each formats as format (format.mimeType)}
          <option value={format.mimeType}>{format.label}</option>
        {/each}
      </select>
    </label>
    <label class="quality-label">
      Quality: {quality}%
      <input type="range" bind:value={quality} min="1" max="100" disabled={targetFormat === 'image/png'} />
    </label>
    <button onclick={startCompress} disabled={state === 'working'}>{copy.button}</button>
  </div>

  {#if targetFormat === 'image/png'}
    <p class="hint">PNG output won't shrink regardless of quality. Pick JPEG or WebP for an actual size reduction.</p>
  {/if}
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <p>{copy.done(formatBytes(inputSize), formatBytes(resultSize))}</p>
    {#if resultUrl}
      <a href={resultUrl} download={`compressed-${inputFile?.name?.replace(/\.[^.]+$/, '')}.${extensionFor(targetFormat)}`}>{copy.download}</a>
      <a href={resultUrl} target="_blank" rel="noopener">{copy.preview}</a>
    {/if}
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
    color: var(--color-oxblood);
    margin: 0.5rem 0 0;
  }

  .options {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin: 1rem 0;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: var(--size-sm);
    color: var(--color-muted);
  }

  .quality-label {
    min-width: 200px;
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

  input[type='range'] {
    width: 100%;
  }

  input[type='range']:disabled {
    opacity: 0.4;
  }
</style>
