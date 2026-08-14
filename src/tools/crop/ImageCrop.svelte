<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import States from '../../shell/States.svelte';
  import { runWorkerJob } from '../../lib/workers/runWorkerJob';
  import { copy } from './copy';

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let workerLoadFailed = $state(false);
  let inputFile = $state(null);
  let inputSize = $state(0);
  let inputWidth = $state(0);
  let inputHeight = $state(0);
  let previewUrl = $state(null);
  let displayWidth = $state(0);
  let displayHeight = $state(0);
  let x = $state(0);
  let y = $state(0);
  let width = $state(0);
  let height = $state(0);
  let resultUrl = $state(null);
  let resultSize = $state(0);

  let containerEl;
  let dragMode = null;
  let dragStartPointer = { x: 0, y: 0 };
  let dragStartRect = { x: 0, y: 0, width: 0, height: 0 };

  let scaleX = $derived(displayWidth ? inputWidth / displayWidth : 1);
  let scaleY = $derived(displayHeight ? inputHeight / displayHeight : 1);
  let dispX = $derived(x / scaleX);
  let dispY = $derived(y / scaleY);
  let dispW = $derived(width / scaleX);
  let dispH = $derived(height / scaleY);

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
    previewUrl = URL.createObjectURL(file);
  }

  function handleImageLoad(e) {
    const img = e.target;
    inputWidth = img.naturalWidth;
    inputHeight = img.naturalHeight;
    displayWidth = img.clientWidth;
    displayHeight = img.clientHeight;

    const margin = 0.15;
    x = inputWidth * margin;
    y = inputHeight * margin;
    width = inputWidth * (1 - margin * 2);
    height = inputHeight * (1 - margin * 2);
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  function relativePoint(e) {
    const rect = containerEl.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onStagePointerDown(e) {
    if (e.target.closest('[data-selection]')) return;
    const p = relativePoint(e);
    dragMode = 'create';
    dragStartPointer = p;
    x = clamp(p.x * scaleX, 0, inputWidth);
    y = clamp(p.y * scaleY, 0, inputHeight);
    width = 0;
    height = 0;
    containerEl.setPointerCapture(e.pointerId);
  }

  function onSelectionPointerDown(e) {
    e.stopPropagation();
    dragMode = 'move';
    dragStartPointer = relativePoint(e);
    dragStartRect = { x, y, width, height };
    containerEl.setPointerCapture(e.pointerId);
  }

  function onHandlePointerDown(handle, e) {
    e.stopPropagation();
    dragMode = `resize-${handle}`;
    dragStartPointer = relativePoint(e);
    dragStartRect = { x, y, width, height };
    containerEl.setPointerCapture(e.pointerId);
  }

  function onStagePointerMove(e) {
    if (!dragMode) return;
    const p = relativePoint(e);

    if (dragMode === 'create') {
      const startX = dragStartPointer.x * scaleX;
      const startY = dragStartPointer.y * scaleY;
      const curX = clamp(p.x * scaleX, 0, inputWidth);
      const curY = clamp(p.y * scaleY, 0, inputHeight);
      x = Math.min(startX, curX);
      y = Math.min(startY, curY);
      width = Math.abs(curX - startX);
      height = Math.abs(curY - startY);
    } else if (dragMode === 'move') {
      const dx = (p.x - dragStartPointer.x) * scaleX;
      const dy = (p.y - dragStartPointer.y) * scaleY;
      x = clamp(dragStartRect.x + dx, 0, inputWidth - dragStartRect.width);
      y = clamp(dragStartRect.y + dy, 0, inputHeight - dragStartRect.height);
    } else if (dragMode.startsWith('resize-')) {
      const handle = dragMode.slice(7);
      const dx = (p.x - dragStartPointer.x) * scaleX;
      const dy = (p.y - dragStartPointer.y) * scaleY;
      const { x: sx, y: sy, width: sw, height: sh } = dragStartRect;

      if (handle.includes('l')) {
        const newX = clamp(sx + dx, 0, sx + sw - 10);
        width = sw + (sx - newX);
        x = newX;
      }
      if (handle.includes('r')) {
        width = clamp(sw + dx, 10, inputWidth - sx);
      }
      if (handle.includes('t')) {
        const newY = clamp(sy + dy, 0, sy + sh - 10);
        height = sh + (sy - newY);
        y = newY;
      }
      if (handle.includes('b')) {
        height = clamp(sh + dy, 10, inputHeight - sy);
      }
    }
  }

  function onStagePointerUp() {
    dragMode = null;
  }

  function startCrop() {
    if (!inputFile) return;
    state = 'working';
    progress = 0;
    error = null;
    workerLoadFailed = false;

    runWorkerJob(
      new URL('./crop.worker.ts', import.meta.url),
      {
        input: inputFile,
        opts: {
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
        },
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

<Dropzone on:files={handleFiles} />

{#if previewUrl}
  <p class="current-size">Current: {inputWidth} × {inputHeight}px, {formatBytes(inputSize)}</p>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="crop-stage"
    bind:this={containerEl}
    onpointerdown={onStagePointerDown}
    onpointermove={onStagePointerMove}
    onpointerup={onStagePointerUp}
    onpointercancel={onStagePointerUp}
  >
    <img src={previewUrl} alt="" draggable="false" onload={handleImageLoad} />
    {#if width > 0 && height > 0}
      <div
        class="selection"
        data-selection
        style="left: {dispX}px; top: {dispY}px; width: {dispW}px; height: {dispH}px"
        onpointerdown={onSelectionPointerDown}
      >
        <div class="handle handle-tl" onpointerdown={(e) => onHandlePointerDown('tl', e)}></div>
        <div class="handle handle-tr" onpointerdown={(e) => onHandlePointerDown('tr', e)}></div>
        <div class="handle handle-bl" onpointerdown={(e) => onHandlePointerDown('bl', e)}></div>
        <div class="handle handle-br" onpointerdown={(e) => onHandlePointerDown('br', e)}></div>
      </div>
    {/if}
  </div>

  <div class="options">
    <label>
      X
      <input type="number" bind:value={x} min="0" max={inputWidth} />
    </label>
    <label>
      Y
      <input type="number" bind:value={y} min="0" max={inputHeight} />
    </label>
    <label>
      Width
      <input type="number" bind:value={width} min="1" max={inputWidth} />
    </label>
    <label>
      Height
      <input type="number" bind:value={height} min="1" max={inputHeight} />
    </label>
    <button onclick={startCrop} disabled={state === 'working'}>{copy.button}</button>
  </div>
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <p>{copy.done(formatBytes(inputSize), formatBytes(resultSize))}</p>
    {#if resultUrl}
      <a href={resultUrl} download={`cropped-${inputFile?.name}`}>{copy.download}</a>
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

  .crop-stage {
    position: relative;
    display: inline-block;
    max-width: 100%;
    margin: 1rem 0;
    cursor: crosshair;
    touch-action: none;
  }

  .crop-stage img {
    display: block;
    max-width: 100%;
    height: auto;
    user-select: none;
    -webkit-user-drag: none;
  }

  .selection {
    position: absolute;
    box-sizing: border-box;
    border: 2px solid var(--color-oxblood);
    background: rgba(138, 51, 36, 0.12);
    cursor: move;
    touch-action: none;
  }

  .handle {
    position: absolute;
    width: 12px;
    height: 12px;
    background: var(--color-oxblood);
    border: 2px solid var(--color-paper);
    border-radius: 50%;
    touch-action: none;
  }

  .handle-tl {
    left: -7px;
    top: -7px;
    cursor: nwse-resize;
  }

  .handle-tr {
    right: -7px;
    top: -7px;
    cursor: nesw-resize;
  }

  .handle-bl {
    left: -7px;
    bottom: -7px;
    cursor: nesw-resize;
  }

  .handle-br {
    right: -7px;
    bottom: -7px;
    cursor: nwse-resize;
  }

  .options {
    display: flex;
    align-items: flex-end;
    flex-wrap: wrap;
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
    width: 5.5rem;
  }
</style>
