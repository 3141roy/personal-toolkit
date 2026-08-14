<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import States from '../../shell/States.svelte';
  import { runWorkerJob } from '../../lib/workers/runWorkerJob';
  import { copy } from './copy';
  import { readMetadata, readAllTags } from './metadata';

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let workerLoadFailed = $state(false);
  let inputFile = $state(null);
  let inputSize = $state(0);
  let entries = $state([]);
  let allEntries = $state([]);
  let showAll = $state(false);
  let resultUrl = $state(null);
  let resultSize = $state(0);

  let hasMore = $derived(entries.some((e) => e.label === 'Other technical tags'));

  let errorCopy = $derived(
    workerLoadFailed
      ? copy.errorWorkerLoad
      : error && /getimagedata|fingerprint|convertToBlob/i.test(error)
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
    showAll = false;
    entries = await readMetadata(file);
    allEntries = await readAllTags(file);
  }

  function toggleShowAll() {
    showAll = !showAll;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function startClear() {
    if (!inputFile) return;
    state = 'working';
    progress = 0;
    error = null;
    workerLoadFailed = false;

    runWorkerJob(
      new URL('./metadata.worker.ts', import.meta.url),
      { input: inputFile, opts: {} },
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
  <p class="current-size">Current: {formatBytes(inputSize)}</p>

  {#if entries.length > 0}
    <ul class="found-list">
      {#each showAll ? allEntries : entries as entry}
        <li>
          <span class="found-label">{entry.label}</span>
          <span class="found-value">{entry.value}</span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="found-empty">{copy.noneFound}</p>
  {/if}

  <p class="disclaimer">{copy.disclaimer}</p>

  {#if hasMore}
    <button class="view-all" onclick={toggleShowAll}>
      {showAll ? 'Show less' : 'View all tags'}
    </button>
  {/if}

  <div class="options">
    <button onclick={startClear} disabled={state === 'working'}>{copy.button}</button>
  </div>
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <p>{copy.done(allEntries.length)}</p>
    {#if resultUrl}
      <a href={resultUrl} download={`cleaned-${inputFile?.name}`}>Grab it</a>
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

  .found-list {
    list-style: none;
    margin: 1rem 0;
    padding: 0;
    border-top: 1px solid var(--color-line);
  }

  .found-list li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--color-line);
    font-size: var(--size-sm);
  }

  .found-label {
    color: var(--color-muted);
  }

  .found-value {
    font-family: var(--font-serif);
    color: var(--color-ink);
    text-align: right;
  }

  .disclaimer {
    font-size: var(--size-sm);
    color: var(--color-muted);
    font-style: italic;
    margin: 0.75rem 0;
  }

  .view-all {
    background: none;
    border: none;
    padding: 0;
    color: var(--color-oxblood);
    font-size: var(--size-sm);
    text-decoration: underline;
    cursor: pointer;
  }

  .found-empty {
    font-size: var(--size-sm);
    color: var(--color-muted);
    font-style: italic;
    margin: 1rem 0;
  }

  .options {
    margin: 1rem 0;
  }
</style>
