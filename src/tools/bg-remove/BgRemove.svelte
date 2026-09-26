<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import States from '../../shell/States.svelte';
  import ModelConsent from '../../shell/ModelConsent.svelte';
  import { runWorkerJob } from '../../lib/workers/runWorkerJob';
  import { isCached } from '../../lib/model/modelLoader';
  import { copy } from './copy';

  const MODEL_URL = '/models/u2netp.onnx';
  const MODEL_SIZE_MB = 4.3;

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let workerLoadFailed = $state(false);
  let inputFile = $state(null);
  let resultUrl = $state(null);
  let showConsent = $state(false);

  async function handleFiles(event) {
    const file = event.detail[0];
    if (!file) return;
    inputFile = file;
    resultUrl = null;
    state = 'empty';

    if (await isCached(MODEL_URL)) {
      start();
    } else {
      showConsent = true;
    }
  }

  function onConsent() {
    showConsent = false;
    start();
  }

  function start() {
    if (!inputFile) return;
    state = 'working';
    progress = 0;
    error = null;
    workerLoadFailed = false;

    const worker = new Worker(new URL('./bgRemove.worker.ts', import.meta.url), {
      type: 'module',
    });

    runWorkerJob(
      worker,
      { input: inputFile },
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

<Dropzone accept="image/png,image/jpeg,image/webp" on:files={handleFiles} />

{#if showConsent}
  <ModelConsent sizeMb={MODEL_SIZE_MB} on:confirm={onConsent} on:cancel={() => (showConsent = false)} />
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working">{copy.working}</span>
  <div slot="done">
    {#if resultUrl}
      <a href={resultUrl} download={`no-bg-${inputFile?.name ?? 'image'}.png`}>{copy.download}</a>
      <a href={resultUrl} target="_blank" rel="noopener">{copy.preview}</a>
    {/if}
  </div>
  <span slot="error">{workerLoadFailed ? copy.errorWorkerLoad : copy.error}</span>
</States>
