<script>
  import JsonTree from './jsonTree.svelte';
  import { copy } from './copy';
  import { formatJson, minifyJson, validateJson, parseJsonSafe } from './jsonFormat';

  let input = $state('');
  let output = $state('');
  let copied = $state(false);

  let validation = $derived(input.trim() ? validateJson(input) : null);
  let isValid = $derived(Boolean(validation && validation.valid));
  let parsedForTree = $derived(input.trim() ? parseJsonSafe(input) : undefined);

  function handleFormat() {
    if (!isValid) return;
    output = formatJson(input);
  }

  function handleMinify() {
    if (!isValid) return;
    output = minifyJson(input);
  }

  async function handleCopy() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 1500);
  }

  function handleDownload() {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="json-tool">
  <label class="input-label">
    Input
    <textarea bind:value={input} placeholder={copy.empty} spellcheck="false"></textarea>
  </label>

  {#if validation}
    <p class="validation" class:invalid={!validation.valid}>
      {validation.valid ? copy.valid : copy.invalid(validation.message)}
    </p>
  {/if}

  <div class="actions">
    <button onclick={handleFormat} disabled={!isValid}>{copy.formatButton}</button>
    <button onclick={handleMinify} disabled={!isValid}>{copy.minifyButton}</button>
    <button onclick={handleCopy} disabled={!output || !isValid}
      >{copied ? copy.copied : copy.copyButton}</button
    >
    <button onclick={handleDownload} disabled={!output || !isValid}>{copy.downloadButton}</button>
  </div>

  {#if output && isValid}
    <pre class="output">{output}</pre>
  {/if}

  {#if isValid && parsedForTree !== undefined}
    <div class="tree">
      <JsonTree value={parsedForTree} />
    </div>
  {/if}
</div>

<style>
  .json-tool {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .input-label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: var(--size-sm);
    color: var(--color-muted);
  }

  textarea {
    font-family: monospace;
    font-size: var(--size-sm);
    padding: 0.75rem;
    min-height: 160px;
    resize: vertical;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: var(--color-paper);
    color: var(--color-ink);
  }

  .validation {
    font-size: var(--size-sm);
    color: var(--color-muted);
    margin: 0;
  }

  .validation.invalid {
    color: var(--color-oxblood);
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .output {
    font-family: monospace;
    font-size: var(--size-sm);
    padding: 0.75rem;
    max-height: 300px;
    overflow: auto;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: rgba(115, 106, 92, 0.05);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .tree {
    padding: 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    overflow-x: auto;
  }
</style>
