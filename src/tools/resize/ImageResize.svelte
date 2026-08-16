<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import States from '../../shell/States.svelte';
  import { runWorkerJob } from '../../lib/workers/runWorkerJob';
  import { copy } from './copy';

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let workerLoadFailed = $state(false);
  let width = $state(800);
  let height = $state(600);
  let inputFile = $state(null);
  let inputSize = $state(0);
  let inputWidth = $state(0);
  let inputHeight = $state(0);
  let resultUrl = $state(null);
  let resultSize = $state(0);
  let customPercent = $state(50);

  let errorCopy = $derived(
    workerLoadFailed
      ? copy.errorWorkerLoad
      : error && /getimagedata|fingerprint/i.test(error)
        ? copy.errorCanvasBlocked
        : copy.error,
  );

  async function handleFiles(event) {
    const file = event.detail[0];
    if (!file) return;
    inputFile = file;
    inputSize = file.size;
    resultUrl = null;
    state = 'empty';

    const bitmap = await createImageBitmap(file);
    inputWidth = bitmap.width;
    inputHeight = bitmap.height;
    width = bitmap.width;
    height = bitmap.height;
    bitmap.close();
  }

  function applyScale(percent) {
    if (!inputWidth || !inputHeight) return;
    width = Math.max(1, Math.round((inputWidth * percent) / 100));
    height = Math.max(1, Math.round((inputHeight * percent) / 100));
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function startResize() {
    if (!inputFile) return;
    state = 'working';
    progress = 0;
    error = null;
    workerLoadFailed = false;

    const worker = new Worker(new URL('./resize.worker.ts', import.meta.url), {
      type: 'module',
    });

    runWorkerJob(
      worker,
      { input: inputFile, opts: { width, height } },
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

<Dropzone on:files={handleFiles} />

{#if inputFile}
  <p class="current-size">Current: {inputWidth} × {inputHeight}px, {formatBytes(inputSize)}</p>

  <div class="scale-row">
    <button type="button" class="scale-btn" onclick={() => applyScale(100)}>100%</button>
    <button type="button" class="scale-btn" onclick={() => applyScale(75)}>75%</button>
    <button type="button" class="scale-btn" onclick={() => applyScale(50)}>50%</button>
    <button type="button" class="scale-btn" onclick={() => applyScale(25)}>25%</button>
    <div class="custom-scale">
      <input type="number" bind:value={customPercent} min="1" max="500" />
      <span>%</span>
      <button type="button" class="scale-btn" onclick={() => applyScale(customPercent)}
        >Apply</button
      >
    </div>
  </div>

  <div class="options">
    <label>
      Width
      <input type="number" bind:value={width} min="1" />
    </label>
    <label>
      Height
      <input type="number" bind:value={height} min="1" />
    </label>
    <button onclick={startResize} disabled={state === 'working'}>{copy.button}</button>
  </div>
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <p>{copy.done(formatBytes(inputSize), formatBytes(resultSize))}</p>
    {#if resultUrl}
      <a href={resultUrl} download={`resized-${inputFile?.name}`}>{copy.download}</a>
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

  .scale-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.75rem 0;
  }

  .scale-btn {
    padding: 0.4rem 0.8rem;
    font-size: var(--size-sm);
  }

  .custom-scale {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-left: 0.5rem;
    color: var(--color-muted);
    font-size: var(--size-sm);
  }

  .custom-scale input {
    width: 4.5rem;
  }

  .options {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    margin: 1rem 0;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: var(--size-sm);
    color: var(--color-muted);
  }

  input {
    width: 6rem;
  }
</style>
