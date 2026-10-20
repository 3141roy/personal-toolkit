<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import ImageStage from '../../shell/ImageStage.svelte';
  import UseResultIn from '../../shell/UseResultIn.svelte';
  import States from '../../shell/States.svelte';
  import { runWorkerJob } from '../../lib/workers/runWorkerJob';
  import { copy } from './copy';

  const formats = [
    { mimeType: 'image/png', label: 'PNG' },
    { mimeType: 'image/jpeg', label: 'JPEG' },
    { mimeType: 'image/webp', label: 'WebP' },
  ];

  let { target = 'image/jpeg', from = '', redirects = {}, fallback = null } = $props();

  const heicHint = { href: '/image/heic-to-jpg/', label: 'HEIC to JPG' };
  const isHeic = (file) => /\.hei[cf]$/i.test(file.name) || /^image\/hei[cf]$/i.test(file.type);

  let wrongFile = $state(null);
  let fromLabel = $derived(formats.find((f) => f.mimeType === from)?.label);
  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let workerLoadFailed = $state(false);
  let chosenFormat = $state(null);
  let targetFormat = $derived(chosenFormat ?? target);
  let inputFile = $state(null);
  let inputUrl = $state(null);
  let inputSize = $state(0);
  let resultUrl = $state(null);
  let resultBlob = $state(null);
  let resultSize = $state(0);

  let downloadName = $derived(`converted.${extensionFor(targetFormat)}`);

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
    if (isHeic(file)) {
      wrongFile = { kind: 'a HEIC', ...heicHint };
      return;
    }
    wrongFile = null;
    if (inputUrl) URL.revokeObjectURL(inputUrl);
    inputFile = file;
    inputUrl = URL.createObjectURL(file);
    inputSize = file.size;
    resultUrl = null;
    state = 'empty';
  }

  function handleRejected(event) {
    const file = event.detail[0];
    const name = file.type.split('/')[1]?.toUpperCase();
    const hint = isHeic(file) ? heicHint : (redirects[file.type] ?? fallback);
    wrongFile = {
      kind: isHeic(file) ? 'a HEIC' : name ? `a ${name}` : 'another kind of file',
      ...hint,
    };
  }

  function reset() {
    if (inputUrl) URL.revokeObjectURL(inputUrl);
    inputUrl = null;
    inputFile = null;
    resultUrl = null;
    state = 'empty';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function extensionFor(mimeType) {
    return mimeType.split('/')[1];
  }

  function startConvert() {
    if (!inputFile) return;
    state = 'working';
    progress = 0;
    error = null;
    workerLoadFailed = false;

    const worker = new Worker(new URL('./convert.worker.ts', import.meta.url), {
      type: 'module',
    });

    runWorkerJob(
      worker,
      { input: inputFile, opts: { mimeType: targetFormat } },
      {
        onProgress: (percent) => {
          progress = percent;
        },
        onDone: (result) => {
          resultBlob = result;
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
  <ImageStage src={inputUrl} {resultUrl} name={inputFile.name} onreset={reset} />
{:else}
  <Dropzone accept={from} on:files={handleFiles} on:rejected={handleRejected} />
  {#if wrongFile}
    <p class="wrong-file" role="alert">
      That's {wrongFile.kind}, {fromLabel
        ? `this one only takes ${fromLabel}`
        : "this one can't read it"}.
      {#if wrongFile.href}<a href={wrongFile.href}>Try {wrongFile.label}</a>.{/if}
    </p>
  {/if}
{/if}

{#if inputFile}
  <p class="current-size">
    Current: {inputFile.type.split('/')[1]?.toUpperCase()}, {formatBytes(inputSize)}
  </p>

  <div class="options">
    <label>
      Convert to
      <select value={targetFormat} onchange={(e) => (chosenFormat = e.currentTarget.value)}>
        {#each formats as format (format.mimeType)}
          <option value={format.mimeType}>{format.label}</option>
        {/each}
      </select>
    </label>
    <button onclick={startConvert} disabled={state === 'working'}>{copy.button}</button>
  </div>
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <p>{copy.done(extensionFor(targetFormat).toUpperCase())}, {formatBytes(resultSize)}</p>
    {#if resultUrl}
      <a href={resultUrl} download={downloadName}>{copy.download}</a>
      <a href={resultUrl} target="_blank" rel="noopener">{copy.preview}</a>
      <div><UseResultIn blob={resultBlob} name={downloadName} from="convert" /></div>
    {/if}
  </div>
  <span slot="error">{errorCopy}</span>
</States>

<style>
  .wrong-file {
    margin: 0.75rem 0 0;
    font-size: var(--size-sm);
    color: var(--color-oxblood);
  }

  .current-size {
    font-family: var(--font-hand);
    font-size: 1.05rem;
    color: var(--color-muted);
    margin: 0.75rem 0 0;
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

  select {
    font-family: var(--font-body);
    font-size: var(--size-base);
    padding: 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: var(--color-paper);
    color: var(--color-ink);
  }
</style>
