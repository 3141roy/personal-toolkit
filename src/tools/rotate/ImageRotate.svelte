<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import States from '../../shell/States.svelte';
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

    const worker = new Worker(new URL('./rotate.worker.ts', import.meta.url), { type: 'module' });

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

    worker.postMessage({ input: inputFile, opts: { rotate: rotateDeg, flipHorizontal, flipVertical } });
  }
</script>

<Dropzone on:files={handleFiles} />

{#if previewUrl}
  <p class="current-size">Current: {formatBytes(inputSize)}</p>

  <div class="preview-stage">
    <img src={previewUrl} alt="" style="transform: {previewTransform}" />
  </div>

  <div class="options">
    <button type="button" onclick={rotateLeft} title="Rotate left 90°">↺ Left</button>
    <button type="button" onclick={rotateRight} title="Rotate right 90°">↻ Right</button>
    <button type="button" class:active={flipHorizontal} onclick={() => (flipHorizontal = !flipHorizontal)}>
      ⇋ Flip H
    </button>
    <button type="button" class:active={flipVertical} onclick={() => (flipVertical = !flipVertical)}>
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

  .preview-stage {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    margin: 1rem 0;
    padding: 1rem;
    background: rgba(115, 106, 92, 0.05);
    border-radius: 8px;
    overflow: hidden;
  }

  .preview-stage img {
    max-width: 220px;
    max-height: 220px;
    transition: transform 0.2s;
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
