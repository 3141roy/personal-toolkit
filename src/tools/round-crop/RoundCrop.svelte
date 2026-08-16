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
  let previewUrl = $state(null);
  let inputWidth = $state(0);
  let inputHeight = $state(0);
  let displayWidth = $state(0);
  let displayHeight = $state(0);
  let shape = $state('circle');
  let x = $state(0);
  let y = $state(0);
  let size = $state(0);
  let resultUrl = $state(null);

  let containerEl;
  let dragMode = null;
  let dragStartPointer = { x: 0, y: 0 };
  let dragStartRect = { x: 0, y: 0, size: 0 };

  let scale = $derived(displayWidth ? inputWidth / displayWidth : 1);
  let dispX = $derived(x / scale);
  let dispY = $derived(y / scale);
  let dispSize = $derived(size / scale);

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

    size = Math.min(inputWidth, inputHeight) * 0.7;
    x = (inputWidth - size) / 2;
    y = (inputHeight - size) / 2;
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
    x = clamp(p.x * scale, 0, inputWidth);
    y = clamp(p.y * scale, 0, inputHeight);
    size = 0;
    containerEl.setPointerCapture(e.pointerId);
  }

  function onSelectionPointerDown(e) {
    e.stopPropagation();
    dragMode = 'move';
    dragStartPointer = relativePoint(e);
    dragStartRect = { x, y, size };
    containerEl.setPointerCapture(e.pointerId);
  }

  function onHandlePointerDown(handle, e) {
    e.stopPropagation();
    dragMode = `resize-${handle}`;
    dragStartPointer = relativePoint(e);
    dragStartRect = { x, y, size };
    containerEl.setPointerCapture(e.pointerId);
  }

  function onStagePointerMove(e) {
    if (!dragMode) return;
    const p = relativePoint(e);

    if (dragMode === 'create') {
      const startX = dragStartPointer.x * scale;
      const startY = dragStartPointer.y * scale;
      const curX = clamp(p.x * scale, 0, inputWidth);
      const curY = clamp(p.y * scale, 0, inputHeight);
      const delta = Math.max(Math.abs(curX - startX), Math.abs(curY - startY));
      let newX = curX >= startX ? startX : startX - delta;
      let newY = curY >= startY ? startY : startY - delta;
      let newSize = Math.min(delta, inputWidth - newX, inputHeight - newY);
      newX = clamp(newX, 0, inputWidth - newSize);
      newY = clamp(newY, 0, inputHeight - newSize);
      x = newX;
      y = newY;
      size = Math.max(newSize, 0);
    } else if (dragMode === 'move') {
      const dx = (p.x - dragStartPointer.x) * scale;
      const dy = (p.y - dragStartPointer.y) * scale;
      x = clamp(dragStartRect.x + dx, 0, inputWidth - dragStartRect.size);
      y = clamp(dragStartRect.y + dy, 0, inputHeight - dragStartRect.size);
    } else if (dragMode.startsWith('resize-')) {
      const handle = dragMode.slice(7);
      const dx = (p.x - dragStartPointer.x) * scale;
      const dy = (p.y - dragStartPointer.y) * scale;
      const { x: sx0, y: sy0, size: s0 } = dragStartRect;

      let delta = 0;
      if (handle === 'br') delta = Math.max(dx, dy);
      else if (handle === 'tl') delta = Math.max(-dx, -dy);
      else if (handle === 'tr') delta = Math.max(dx, -dy);
      else if (handle === 'bl') delta = Math.max(-dx, dy);

      const newSize = clamp(s0 + delta, 20, Math.min(inputWidth, inputHeight));
      let newX = sx0;
      let newY = sy0;
      if (handle === 'tl') {
        newX = sx0 + (s0 - newSize);
        newY = sy0 + (s0 - newSize);
      } else if (handle === 'tr') {
        newY = sy0 + (s0 - newSize);
      } else if (handle === 'bl') {
        newX = sx0 + (s0 - newSize);
      }

      x = clamp(newX, 0, inputWidth - newSize);
      y = clamp(newY, 0, inputHeight - newSize);
      size = newSize;
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

    const worker = new Worker(new URL('./roundCrop.worker.ts', import.meta.url), {
      type: 'module',
    });

    runWorkerJob(
      worker,
      {
        input: inputFile,
        opts: {
          shape,
          x: Math.round(x),
          y: Math.round(y),
          size: Math.round(size),
        },
      },
      {
        onProgress: (percent) => {
          progress = percent;
        },
        onDone: (result) => {
          resultUrl = URL.createObjectURL(result);
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
  <div class="shape-picker">
    <button type="button" class:active={shape === 'circle'} onclick={() => (shape = 'circle')}>
      Circle
    </button>
    <button type="button" class:active={shape === 'square'} onclick={() => (shape = 'square')}>
      Square
    </button>
  </div>

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
    {#if size > 0}
      <div
        class="selection"
        class:circle={shape === 'circle'}
        data-selection
        style="left: {dispX}px; top: {dispY}px; width: {dispSize}px; height: {dispSize}px"
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
    <button onclick={startCrop} disabled={state === 'working'}>{copy.button}</button>
  </div>
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <p>{copy.done}</p>
    {#if resultUrl}
      <a href={resultUrl} download={`rounded-${inputFile?.name}`}>Grab it</a>
      <a href={resultUrl} target="_blank" rel="noopener">{copy.preview}</a>
    {/if}
  </div>
  <span slot="error">{errorCopy}</span>
</States>

<style>
  .shape-picker {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .shape-picker button {
    background: var(--color-paper);
    border: 1px solid var(--color-line);
  }

  .shape-picker button.active {
    border-color: var(--color-oxblood);
    color: var(--color-oxblood);
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

  .selection.circle {
    border-radius: 50%;
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
    margin: 1rem 0;
  }
</style>
