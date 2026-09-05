<script>
  import VerifyNote from '../../shell/VerifyNote.svelte';
  import { copy } from './copy';
  import { jsonToYaml, yamlToJson } from './jsonYaml';

  let input = $state('');
  let output = $state('');
  let outputKind = $state(null);
  let error = $state(null);
  let copied = $state(false);

  function handleToYaml() {
    try {
      output = jsonToYaml(input);
      outputKind = 'yaml';
      error = null;
    } catch (err) {
      error = copy.invalidJson(err instanceof Error ? err.message : 'Invalid JSON');
      output = '';
      outputKind = null;
    }
  }

  function handleToJson() {
    try {
      output = yamlToJson(input);
      outputKind = 'json';
      error = null;
    } catch (err) {
      error = copy.invalidYaml(err instanceof Error ? err.message : 'Invalid YAML');
      output = '';
      outputKind = null;
    }
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
    if (!output || !outputKind) return;
    const mimeType = outputKind === 'yaml' ? 'text/yaml' : 'application/json';
    const filename = outputKind === 'yaml' ? 'converted.yaml' : 'converted.json';
    const blob = new Blob([output], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="json-yaml-tool">
  <label class="input-label">
    Input
    <textarea bind:value={input} placeholder={copy.empty} spellcheck="false"></textarea>
  </label>

  {#if error}
    <p class="validation invalid">{error}</p>
  {/if}

  <div class="actions">
    <button onclick={handleToYaml} disabled={!input.trim()}>{copy.toYamlButton}</button>
    <button onclick={handleToJson} disabled={!input.trim()}>{copy.toJsonButton}</button>
    {#if output}
      <button onclick={handleCopy}>{copied ? copy.copied : copy.copyButton}</button>
      <button onclick={handleDownload}
        >{outputKind === 'yaml' ? copy.downloadYaml : copy.downloadJson}</button
      >
    {/if}
  </div>

  {#if output}
    <pre class="output">{output}</pre>
    <VerifyNote />
  {/if}
</div>

<style>
  .json-yaml-tool {
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
</style>
