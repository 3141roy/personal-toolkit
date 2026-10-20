<script>
  import Dropzone from '../../shell/Dropzone.svelte';
  import States from '../../shell/States.svelte';
  import ModelConsent from '../../shell/ModelConsent.svelte';
  import { runWorkerJob } from '../../lib/workers/runWorkerJob';
  import { looksEncrypted } from './passwordPdf';
  import { copy } from './copy';

  let { preset = null, fallback = null } = $props();

  const ENGINE_KEY = 'bundle-engine-qpdf';

  let state = $state('empty');
  let progress = $state(0);
  let error = $state(null);
  let errorCode = $state(null);
  let workerLoadFailed = $state(false);
  let inputFile = $state(null);
  let mode = $state('lock');
  let locked = $state(null);
  let blocked = $state(null);
  let password = $state('');
  let newPassword = $state('');
  let confirm = $state('');
  let reveal = $state(false);
  let showConsent = $state(false);
  let resultUrl = $state(null);
  let resultSize = $state(0);
  let resultName = $state('');
  let resultMode = $state('lock');

  let target = $derived(mode === 'lock' ? password : newPassword);
  let mismatch = $derived(mode !== 'unlock' && confirm !== '' && confirm !== target);
  let ready = $derived(
    inputFile && password !== '' && (mode === 'unlock' || (target !== '' && confirm === target)),
  );
  let errorCopy = $derived(
    workerLoadFailed
      ? copy.errorWorkerLoad
      : errorCode === 'wrong-password'
        ? copy.errorWrongPassword
        : errorCode === 'already-locked'
          ? copy.errorAlreadyLocked
          : errorCode === 'not-locked'
            ? copy.errorNotLocked
            : copy.error,
  );

  function clearFields() {
    password = '';
    newPassword = '';
    confirm = '';
  }

  function setMode(next) {
    mode = next;
    clearFields();
  }

  async function handleFiles(event) {
    const file = event.detail[0];
    if (!file) return;
    inputFile = file;
    resultUrl = null;
    state = 'empty';
    error = null;
    errorCode = null;
    clearFields();
    blocked = null;
    locked = looksEncrypted(new Uint8Array(await file.arrayBuffer()));
    if (preset === 'lock' && locked) {
      blocked = { message: copy.presetAlreadyLocked, hint: copy.presetAlreadyLockedHint };
    } else if (preset === 'unlock' && !locked) {
      blocked = { message: copy.presetNotLocked, hint: copy.presetNotLockedHint };
    }
    mode = preset ?? (locked ? 'unlock' : 'lock');
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function engineSeen() {
    try {
      return localStorage.getItem(ENGINE_KEY) === '1';
    } catch {
      return false;
    }
  }

  function rememberEngine() {
    try {
      localStorage.setItem(ENGINE_KEY, '1');
    } catch {
      return;
    }
  }

  function submit(event) {
    event.preventDefault();
    if (!ready || state === 'working') return;
    if (engineSeen()) {
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
    state = 'working';
    progress = 0;
    error = null;
    errorCode = null;
    workerLoadFailed = false;
    const runMode = mode;

    const worker = new Worker(new URL('./passwordPdf.worker.ts', import.meta.url), {
      type: 'module',
    });

    runWorkerJob(
      worker,
      {
        input: inputFile,
        opts: {
          mode: runMode,
          password,
          newPassword: runMode === 'change' ? newPassword : undefined,
        },
      },
      {
        onProgress: (percent) => {
          progress = percent;
        },
        onDone: (blob) => {
          rememberEngine();
          const base = inputFile.name.replace(/\.[^.]+$/, '');
          resultUrl = URL.createObjectURL(blob);
          resultSize = blob.size;
          resultMode = runMode;
          resultName = `${base}-${{ lock: 'locked', unlock: 'unlocked', change: 'new-password' }[runMode]}.pdf`;
          clearFields();
          state = 'done';
        },
        onError: (message, failedToLoad) => {
          if (failedToLoad) {
            workerLoadFailed = true;
          } else {
            errorCode = message;
            error = message;
          }
          state = 'error';
        },
      },
    );
  }
</script>

<Dropzone accept="application/pdf,.pdf" on:files={handleFiles} />

{#if blocked}
  <p class="field-error" role="alert">
    {blocked.message}
    {#if fallback}<a href={fallback.href}>{copy.presetTry(fallback.label)}</a>, {blocked.hint}{/if}
  </p>
{:else if inputFile && locked !== null}
  <p class="current-size">
    {inputFile.name}, {formatBytes(inputFile.size)}. {locked ? copy.statusLocked : copy.statusPlain}
  </p>

  <form onsubmit={submit}>
    {#if locked && !preset}
      <div class="mode-picker">
        <label>
          <input
            type="radio"
            name="mode"
            checked={mode === 'unlock'}
            onchange={() => setMode('unlock')}
          />
          {copy.unlockLabel}
        </label>
        <label>
          <input
            type="radio"
            name="mode"
            checked={mode === 'change'}
            onchange={() => setMode('change')}
          />
          {copy.changeLabel}
        </label>
      </div>
    {/if}

    <div class="fields">
      <label>
        {mode === 'lock'
          ? copy.passwordLabel
          : mode === 'change'
            ? copy.currentPasswordLabel
            : copy.unlockPasswordLabel}
        <input
          type={reveal ? 'text' : 'password'}
          bind:value={password}
          autocomplete="off"
          spellcheck="false"
        />
      </label>
      {#if mode === 'change'}
        <label>
          {copy.newPasswordLabel}
          <input
            type={reveal ? 'text' : 'password'}
            bind:value={newPassword}
            autocomplete="off"
            spellcheck="false"
          />
        </label>
      {/if}
      {#if mode !== 'unlock'}
        <label>
          {copy.confirmLabel}
          <input
            type={reveal ? 'text' : 'password'}
            bind:value={confirm}
            autocomplete="off"
            spellcheck="false"
          />
        </label>
      {/if}
      <button type="button" class="reveal" onclick={() => (reveal = !reveal)}>
        {reveal ? copy.hide : copy.show}
      </button>
    </div>

    {#if mismatch}
      <p class="field-error">{copy.mismatch}</p>
    {/if}
    {#if mode !== 'unlock'}
      <p class="hint">{copy.forgetWarning}</p>
    {/if}

    <button type="submit" disabled={!ready || state === 'working'}>
      {mode === 'lock'
        ? copy.buttonLock
        : mode === 'change'
          ? copy.buttonChange
          : copy.buttonUnlock}
    </button>
  </form>
{/if}

{#if showConsent}
  <ModelConsent
    sizeMb={2}
    noun={copy.engineNoun}
    on:confirm={onConsent}
    on:cancel={() => (showConsent = false)}
  />
{/if}

<States {state} {progress} {error}>
  <span slot="empty">{copy.empty}</span>
  <span slot="working"
    >{mode === 'lock'
      ? copy.workingLock
      : mode === 'change'
        ? copy.workingChange
        : copy.workingUnlock}</span
  >
  <div slot="done">
    <p>
      {resultMode === 'lock'
        ? copy.doneLock(formatBytes(resultSize))
        : resultMode === 'change'
          ? copy.doneChange(formatBytes(resultSize))
          : copy.doneUnlock(formatBytes(resultSize))}
    </p>
    {#if resultUrl}
      <a href={resultUrl} download={resultName}>{copy.download}</a>
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

  .mode-picker {
    display: flex;
    gap: 1.2rem;
    margin: 1rem 0;
    font-size: var(--size-sm);
  }

  .mode-picker label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
  }

  .fields {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 1rem;
    margin: 1rem 0 0.5rem;
  }

  .fields label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: var(--size-sm);
    color: var(--color-muted);
    min-width: 220px;
  }

  .fields input {
    font-family: var(--font-body);
    font-size: var(--size-base);
    padding: 0.5rem;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: var(--color-paper);
    color: var(--color-ink);
  }

  .reveal {
    margin-bottom: 0.1rem;
  }

  .field-error {
    font-size: var(--size-sm);
    color: var(--color-oxblood);
    margin: 0.25rem 0 0;
  }

  .hint {
    font-family: var(--font-hand);
    font-size: 1.05rem;
    color: var(--color-muted);
    margin: 0.25rem 0 0.75rem;
  }

  button[type='submit'] {
    margin-top: 0.5rem;
  }
</style>
