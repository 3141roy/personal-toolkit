<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import UseResultIn from '../../shell/UseResultIn.svelte';
  import States from '../../shell/States.svelte';
  import { runWorkerJob } from '../../lib/workers/runWorkerJob';
  import { copy } from './copy';
  import { readPdfMetadata, withBlankFields, isEditable, XMP_KEY } from './pdfMetadata';

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let workerLoadFailed = $state(false);
  let inputFile = $state(null);
  let rows = $state([]);
  let found = $state(0);
  let summary = $state({ cleared: 0, kept: 0, edited: 0 });
  let resultUrl = $state(null);
  let resultBlob = $state(null);

  let errorCopy = $derived(workerLoadFailed ? copy.errorWorkerLoad : copy.error);
  let editedKeys = $derived(
    rows.filter((r) => r.editable && r.kept && r.value !== r.original).map((r) => r.key),
  );
  let xmpStale = $derived(editedKeys.length > 0 && rows.some((r) => r.key === XMP_KEY && r.kept));

  async function handleFiles(event) {
    const file = event.detail[0];
    if (!file) return;
    inputFile = file;
    resultUrl = null;
    resultBlob = null;
    error = null;
    state = 'empty';
    try {
      const entries = await readPdfMetadata(file);
      found = entries.length;
      rows = withBlankFields(entries).map((entry) => ({
        ...entry,
        original: entry.value,
        editable: isEditable(entry.key),
        kept: false,
      }));
    } catch {
      rows = [];
      inputFile = null;
      error = copy.error;
      state = 'error';
    }
  }

  function onType(row) {
    row.kept = row.value.trim() !== '';
  }

  function selectAll() {
    for (const row of rows) row.kept = row.value.trim() !== '';
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

    const existing = rows.filter((r) => r.original !== '');
    const keep = rows.filter((r) => r.kept).map((r) => r.key);
    const edits = Object.fromEntries(
      rows.filter((r) => editedKeys.includes(r.key)).map((r) => [r.key, r.value]),
    );
    summary = {
      cleared: existing.filter((r) => !r.kept).length,
      kept: existing.filter((r) => r.kept && !editedKeys.includes(r.key)).length,
      edited: editedKeys.length,
    };

    const worker = new Worker(new URL('./pdfMetadata.worker.ts', import.meta.url), {
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

<Dropzone accept="application/pdf,.pdf" rejectLocked on:files={handleFiles} />

{#if inputFile}
  {#if found === 0}
    <p class="found-empty">{copy.noneFound}</p>
  {/if}

  <div class="bulk">
    <span class="hint">{copy.hint}</span>
    <span class="bulk-buttons">
      <button class="link" type="button" onclick={selectAll}>{copy.selectAll}</button>
      <button class="link" type="button" onclick={unselectAll}>{copy.unselectAll}</button>
    </span>
  </div>

  <ul class="found-list">
    {#each rows as row (row.key)}
      <li>
        <input
          type="checkbox"
          id={`keep-${row.key}`}
          bind:checked={row.kept}
          aria-label={`${copy.keepLabel} ${row.label}`}
        />
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

  {#if xmpStale}
    <p class="disclaimer">{copy.xmpStale}</p>
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
    <p>{copy.done(summary.cleared, summary.kept, summary.edited)}</p>
    {#if resultUrl}
      <a href={resultUrl} download={`cleaned-${inputFile?.name}`}>{copy.download}</a>
      <a href={resultUrl} target="_blank" rel="noopener">{copy.preview}</a>
      <div>
        <UseResultIn blob={resultBlob} name={`cleaned-${inputFile?.name}`} from="pdf-metadata" />
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
    grid-template-columns: auto 8rem 1fr;
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
      grid-template-columns: auto 1fr;
    }

    .found-input,
    .found-value {
      grid-column: 2;
    }
  }
</style>
