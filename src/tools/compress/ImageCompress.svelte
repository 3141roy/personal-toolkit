<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import States from '../../shell/States.svelte';
  import { copy } from './copy';

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let quality = $state(75);
  let inputFile = $state(null);
  let inputSize = $state(0);
  let resultUrl = $state(null);
  let resultSize = $state(0);

  let errorCopy = $derived(
    error && /getimagedata|fingerprint|convertToBlob/i.test(error) ? copy.errorCanvasBlocked : copy.error,
  );

  function handleFiles(event) {
    const file = event.detail[0];
    if (!file) return;
    inputFile = file;
    inputSize = file.size;
    resultUrl = null;
    state = 'empty';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function startCompress() {
    if (!inputFile) return;
    state = 'working';
    progress = 0;
    error = null;

    const worker = new Worker(new URL('./compress.worker.ts', import.meta.url), { type: 'module' });

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

    worker.postMessage({ input: inputFile, opts: { quality: quality / 100 } });
  }
</script>

<Dropzone on:files={handleFiles} />

{#if inputFile}
  <p class="current-size">Current: {formatBytes(inputSize)}</p>

  <div class="options">
    <label class="quality-label">
      Quality: {quality}%
      <input type="range" bind:value={quality} min="1" max="100" />
    </label>
    <button onclick={startCompress} disabled={state === 'working'}>{copy.button}</button>
  </div>
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <p>{copy.done(formatBytes(inputSize), formatBytes(resultSize))}</p>
    {#if resultUrl}
      <a href={resultUrl} download={`compressed-${inputFile?.name}`}>{copy.download}</a>
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

  .options {
    display: flex;
    align-items: flex-end;
    gap: 1.5rem;
    margin: 1rem 0;
  }

  .quality-label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: var(--size-sm);
    color: var(--color-muted);
    min-width: 200px;
  }

  input[type='range'] {
    width: 100%;
  }
</style>
