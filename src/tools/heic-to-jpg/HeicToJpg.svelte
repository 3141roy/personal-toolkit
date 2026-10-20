<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import States from '../../shell/States.svelte';
  import { copy } from './copy';

  let wrongFile = $state(null);
  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let inputFile = $state(null);
  let inputSize = $state(0);
  let resultUrl = $state(null);
  let resultSize = $state(0);

  let errorCopy = $derived(
    error && /getimagedata|fingerprint|convertToBlob/i.test(error)
      ? copy.errorCanvasBlocked
      : copy.error,
  );

  function handleFiles(event) {
    const file = event.detail[0];
    if (!file) return;
    wrongFile = null;
    inputFile = file;
    inputSize = file.size;
    resultUrl = null;
    state = 'empty';
  }

  function handleRejected(event) {
    const name = event.detail[0].type.split('/')[1]?.toUpperCase();
    wrongFile = name ? `a ${name}` : 'another kind of file';
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function startConvert() {
    if (!inputFile) return;
    state = 'working';
    progress = 0;
    error = null;

    try {
      const { heicToJpg } = await import('./heicToJpg');
      const result = await heicToJpg(inputFile, {}, (percent) => {
        progress = percent;
      });
      resultUrl = URL.createObjectURL(result);
      resultSize = result.size;
      state = 'done';
    } catch (err) {
      error = err instanceof Error ? err.message : 'Conversion failed';
      state = 'error';
    }
  }
</script>

<Dropzone
  accept="image/heic,image/heif,.heic,.heif"
  on:files={handleFiles}
  on:rejected={handleRejected}
/>
{#if wrongFile}
  <p class="wrong-file" role="alert">
    That's {wrongFile}, this one only takes HEIC or HEIF.
    <a href="/image/convert/">Try Convert Image</a>.
  </p>
{/if}

{#if inputFile}
  <p class="current-size">Current: {formatBytes(inputSize)}</p>

  <div class="options">
    <button onclick={startConvert} disabled={state === 'working'}>{copy.button}</button>
  </div>
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    <p>{copy.done(formatBytes(inputSize), formatBytes(resultSize))}</p>
    {#if resultUrl}
      <a href={resultUrl} download={`${inputFile?.name?.replace(/\.[^.]+$/, '')}.jpg`}
        >{copy.download}</a
      >
      <a href={resultUrl} target="_blank" rel="noopener">{copy.preview}</a>
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
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
  }
</style>
