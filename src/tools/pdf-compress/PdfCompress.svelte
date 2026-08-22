<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import States from '../../shell/States.svelte';
  import { runWorkerJob } from '../../lib/workers/runWorkerJob';
  import { copy } from './copy';

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let workerLoadFailed = $state(false);
  let quality = $state(75);
  let inputFile = $state(null);
  let inputSize = $state(0);
  let resultUrl = $state(null);
  let resultSize = $state(0);

  let errorCopy = $derived(workerLoadFailed ? copy.errorWorkerLoad : copy.error);

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
    workerLoadFailed = false;

    const worker = new Worker(new URL('./pdfCompress.worker.ts', import.meta.url), {
      type: 'module',
    });

    runWorkerJob(
      worker,
      { input: inputFile, opts: { quality: quality / 100 } },
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

{#if inputFile}
  <p class="current-size">Current: {formatBytes(inputSize)}</p>

  <div class="options">
    <label class="quality-label">
      Quality: {quality}%
      <input type="range" bind:value={quality} min="1" max="100" />
    </label>
    <button onclick={startCompress} disabled={state === 'working'}>{copy.button}</button>
  </div>

  <p class="hint">{copy.scopeHint}</p>
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <p>
      {resultSize >= inputSize
        ? copy.unchanged
        : copy.done(formatBytes(inputSize), formatBytes(resultSize))}
    </p>
    {#if resultUrl}
      <a href={resultUrl} download={`compressed-${inputFile?.name?.replace(/\.[^.]+$/, '')}.pdf`}
        >{copy.download}</a
      >
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
    color: var(--color-muted);
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

  input[type='range'] {
    width: 100%;
  }
</style>
