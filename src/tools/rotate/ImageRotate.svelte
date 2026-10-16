<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import ImageStage from '../../shell/ImageStage.svelte';
  import States from '../../shell/States.svelte';
  import { runWorkerJob } from '../../lib/workers/runWorkerJob';
  import { copy } from './copy';

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let workerLoadFailed = $state(false);
  let inputFile = $state(null);
  let inputSize = $state(0);
  let previewUrl = $state(null);
  let rotateDeg = $state(0);
  let flipHorizontal = $state(false);
  let flipVertical = $state(false);
  let resultUrl = $state(null);
  let resultSize = $state(0);

  let previewTransform = $derived(
    `rotate(${rotateDeg}deg) scaleX(${flipHorizontal ? -1 : 1}) scaleY(${flipVertical ? -1 : 1})`,
  );

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
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    inputFile = file;
    inputSize = file.size;
    resultUrl = null;
    state = 'empty';
    rotateDeg = 0;
    flipHorizontal = false;
    flipVertical = false;
    previewUrl = URL.createObjectURL(file);
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    inputFile = null;
    resultUrl = null;
    state = 'empty';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function rotateLeft() {
    rotateDeg = (rotateDeg + 270) % 360;
  }

  function rotateRight() {
    rotateDeg = (rotateDeg + 90) % 360;
  }

  function startRotate() {
    if (!inputFile) return;
    state = 'working';
    progress = 0;
    error = null;
    workerLoadFailed = false;

    const worker = new Worker(new URL('./rotate.worker.ts', import.meta.url), {
      type: 'module',
    });

    runWorkerJob(
      worker,
      { input: inputFile, opts: { rotate: rotateDeg, flipHorizontal, flipVertical } },
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

{#if inputFile}
  <ImageStage src={previewUrl} name={inputFile.name} transform={previewTransform} onreset={reset} />
{:else}
  <Dropzone on:files={handleFiles} />
{/if}

{#if previewUrl}
  <p class="current-size">Current: {formatBytes(inputSize)}</p>

  <div class="options">
    <button type="button" onclick={rotateLeft} title="Rotate left 90°">↺ Left</button>
    <button type="button" onclick={rotateRight} title="Rotate right 90°">↻ Right</button>
    <button
      type="button"
      class:active={flipHorizontal}
      onclick={() => (flipHorizontal = !flipHorizontal)}
    >
      ⇋ Flip H
    </button>
    <button
      type="button"
      class:active={flipVertical}
      onclick={() => (flipVertical = !flipVertical)}
    >
      ⇵ Flip V
    </button>
    <button onclick={startRotate} disabled={state === 'working'}>{copy.button}</button>
  </div>
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <p>{copy.done(formatBytes(inputSize), formatBytes(resultSize))}</p>
    {#if resultUrl}
      <a href={resultUrl} download={`rotated-${inputFile?.name}`}>{copy.download}</a>
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

  .options {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin: 1rem 0;
  }

  button.active {
    border-color: var(--color-oxblood);
    color: var(--color-oxblood);
  }
</style>
