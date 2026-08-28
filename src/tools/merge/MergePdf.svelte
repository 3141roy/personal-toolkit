<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import States from '../../shell/States.svelte';
  import { runWorkerJob } from '../../lib/workers/runWorkerJob';
  import { copy } from './copy';

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let workerLoadFailed = $state(false);
  let files = $state([]);
  let resultUrl = $state(null);
  let resultSize = $state(0);
  let mergedCount = $state(0);

  let errorCopy = $derived(workerLoadFailed ? copy.errorWorkerLoad : copy.error);
  let canMerge = $derived(files.length >= 2 && state !== 'working');

  function handleFiles(event) {
    const additions = event.detail.map((file) => ({ id: crypto.randomUUID(), file }));
    files = [...files, ...additions];
    resultUrl = null;
    state = 'empty';
  }

  function moveUp(index) {
    if (index === 0) return;
    const next = files.slice();
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    files = next;
  }

  function moveDown(index) {
    if (index === files.length - 1) return;
    const next = files.slice();
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    files = next;
  }

  function removeFile(index) {
    files = files.filter((_, i) => i !== index);
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function startMerge() {
    if (files.length < 2) return;
    state = 'working';
    progress = 0;
    error = null;
    workerLoadFailed = false;
    mergedCount = files.length;

    const worker = new Worker(new URL('./mergePdf.worker.ts', import.meta.url), {
      type: 'module',
    });

    runWorkerJob(
      worker,
      { inputs: files.map((f) => f.file) },
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

{#if files.length > 0}
  <ul class="file-list">
    {#each files as f, index (f.id)}
      <li class="file-row">
        <span class="file-name">{f.file.name}</span>
        <span class="file-size">{formatBytes(f.file.size)}</span>
        <div class="reorder">
          <button
            type="button"
            onclick={() => moveUp(index)}
            disabled={index === 0}
            aria-label="Move up">↑</button
          >
          <button
            type="button"
            onclick={() => moveDown(index)}
            disabled={index === files.length - 1}
            aria-label="Move down">↓</button
          >
          <button type="button" onclick={() => removeFile(index)} aria-label="Remove">✕</button>
        </div>
      </li>
    {/each}
  </ul>

  <p class="hint">{files.length < 2 ? copy.minHint : copy.reorderHint}</p>

  <button onclick={startMerge} disabled={!canMerge}>{copy.button}</button>
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <p>{copy.done(mergedCount, formatBytes(resultSize))}</p>
    {#if resultUrl}
      <a href={resultUrl} download="merged.pdf">{copy.download}</a>
      <a href={resultUrl} target="_blank" rel="noopener">{copy.preview}</a>
    {/if}
  </div>
  <span slot="error">{errorCopy}</span>
</States>

<style>
  .hint {
    font-family: var(--font-hand);
    font-size: 1.05rem;
    color: var(--color-muted);
    margin: 0.75rem 0;
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

  .reorder {
    display: flex;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .reorder button {
    width: 1.8rem;
    height: 1.8rem;
    padding: 0;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: var(--color-paper);
    color: var(--color-ink);
    cursor: pointer;
  }

  .reorder button:disabled {
    opacity: 0.35;
    cursor: default;
  }

  button {
    margin-top: 0.5rem;
  }
</style>
