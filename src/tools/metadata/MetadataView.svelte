<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import UseResultIn from '../../shell/UseResultIn.svelte';
  import States from '../../shell/States.svelte';
  import { runWorkerJob } from '../../lib/workers/runWorkerJob';
  import { copy } from './copy';
  import { readJpegRows } from './jpegMetadata';

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let workerLoadFailed = $state(false);
  let inputFile = $state(null);
  let rows = $state(null);
  let summary = $state({ cleared: 0, kept: 0, edited: 0 });
  let resultUrl = $state(null);
  let resultBlob = $state(null);

  let errorCopy = $derived(
    workerLoadFailed
      ? copy.errorWorkerLoad
      : error && /getimagedata|fingerprint|convertToBlob/i.test(error)
        ? copy.errorCanvasBlocked
        : copy.error,
  );
  let editedKeys = $derived(
    (rows ?? []).filter((r) => r.editable && r.kept && r.value !== r.original).map((r) => r.key),
  );
  let orientationDropped = $derived((rows ?? []).some((r) => r.key === 'exif:0112' && !r.kept));
  let hasSelectable = $derived((rows ?? []).some((r) => r.selectable));

  async function handleFiles(event) {
    const file = event.detail[0];
    if (!file) return;
    inputFile = file;
    resultUrl = null;
    resultBlob = null;
    error = null;
    state = 'empty';
    try {
      const found = await readJpegRows(file);
      rows = found
        ? found.map((row) => ({ ...row, original: row.value, kept: row.defaultKept }))
        : null;
    } catch {
      rows = null;
    }
  }

  function onType(row) {
    row.kept = row.value.trim() !== '';
  }

  function selectAll() {
    for (const row of rows) row.kept = row.selectable && row.value.trim() !== '';
  }

  function unselectAll() {
    for (const row of rows) row.kept = false;
  }

  function startSave() {
    if (!inputFile) return;
    state = 'working';
    progress = 0;
    error = null;
    workerLoadFailed = false;

    const list = rows ?? [];
    const existing = list.filter((r) => r.original !== '' && r.selectable);
    summary = {
      cleared: list.filter((r) => r.original !== '' && !r.kept).length,
      kept: existing.filter((r) => r.kept && !editedKeys.includes(r.key)).length,
      edited: editedKeys.length,
    };
    const keep = list.filter((r) => r.kept).map((r) => r.key);
    const edits = Object.fromEntries(
      list.filter((r) => editedKeys.includes(r.key)).map((r) => [r.key, r.value]),
    );

    const worker = new Worker(new URL('./metadata.worker.ts', import.meta.url), {
      type: 'module',
    });

    runWorkerJob(
      worker,
      { input: inputFile, keep, edits },
      {
        onProgress: (percent) => {
          progress = percent;
        },
        onDone: (result) => {
          resultBlob = result;
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

{#if inputFile}
  {#if rows === null}
    <p class="found-empty">{copy.wholeFile}</p>
  {:else}
    {#if !rows.some((r) => r.original !== '')}
      <p class="found-empty">{copy.noneFound}</p>
    {/if}

    {#if hasSelectable}
      <div class="bulk">
        <span class="hint">{copy.hint}</span>
        <span class="bulk-buttons">
          <button class="link" type="button" onclick={selectAll}>{copy.selectAll}</button>
          <button class="link" type="button" onclick={unselectAll}>{copy.unselectAll}</button>
        </span>
      </div>
    {/if}

    <ul class="found-list">
      {#each rows as row (row.key)}
        <li>
          {#if row.selectable}
            <input
              type="checkbox"
              id={`keep-${row.key}`}
              bind:checked={row.kept}
              aria-label={`${copy.keepLabel} ${row.label}`}
            />
          {:else}
            <span></span>
          {/if}
          <label class="found-label" for={row.editable ? `edit-${row.key}` : `keep-${row.key}`}>
            {row.label}
          </label>
          {#if row.editable}
            <input
              class="found-input"
              id={`edit-${row.key}`}
              type="text"
              placeholder={copy.placeholder}
              bind:value={row.value}
              oninput={() => onType(row)}
            />
          {:else}
            <span class="found-value">{row.value}</span>
          {/if}
        </li>
      {/each}
    </ul>

    {#if orientationDropped}
      <p class="disclaimer">{copy.orientationNote}</p>
    {/if}
  {/if}

  <p class="disclaimer">{copy.disclaimer}</p>

  <div class="options">
    <button onclick={startSave} disabled={state === 'working'}>{copy.button}</button>
  </div>
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <p>
      {rows === null ? copy.wholeFile : copy.done(summary.cleared, summary.kept, summary.edited)}
    </p>
    {#if resultUrl}
      <a href={resultUrl} download={`cleaned-${inputFile?.name}`}>{copy.download}</a>
      <a href={resultUrl} target="_blank" rel="noopener">{copy.preview}</a>
      <div>
        <UseResultIn blob={resultBlob} name={`cleaned-${inputFile?.name}`} from="metadata" />
      </div>
    {/if}
  </div>
  <span slot="error">{errorCopy}</span>
</States>

<style>
  .bulk {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    flex-wrap: wrap;
    margin: 1rem 0 0;
  }

  .hint {
    font-size: var(--size-sm);
    color: var(--color-muted);
  }

  .bulk-buttons {
    display: flex;
    gap: 1rem;
  }

  .link {
    background: none;
    border: none;
    padding: 0;
    color: var(--color-oxblood);
    font-size: var(--size-sm);
    text-decoration: underline;
    cursor: pointer;
  }

  .found-list {
    list-style: none;
    margin: 0.5rem 0 1rem;
    padding: 0;
    border-top: 1px solid var(--color-line);
  }

  .found-list li {
    display: grid;
    grid-template-columns: 1.1rem 9rem 1fr;
    align-items: center;
    gap: 0.75rem;
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
    overflow-wrap: anywhere;
  }

  .found-input {
    width: 100%;
    min-width: 0;
    font: inherit;
    font-family: var(--font-serif);
    color: var(--color-ink);
    background: transparent;
    border: none;
    border-bottom: 1px dashed var(--color-line);
    padding: 0.15rem 0;
  }

  .found-input:focus {
    outline: none;
    border-bottom-color: var(--color-oxblood);
  }

  .disclaimer {
    font-size: var(--size-sm);
    color: var(--color-muted);
    font-style: italic;
    margin: 0.75rem 0;
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

  @media (max-width: 480px) {
    .found-list li {
      grid-template-columns: 1.1rem 1fr;
    }

    .found-input,
    .found-value {
      grid-column: 2;
    }
  }
</style>
