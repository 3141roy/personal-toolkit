<script>
  import VerifyNote from '../../shell/VerifyNote.svelte';
  import { copy } from './copy';
  import { convert } from './jsonToTypes';

  const targets = ['typescript', 'zod', 'json-schema', 'openapi'];

  let input = $state('');
  let target = $state('typescript');
  let copied = $state(false);

  let result = $derived.by(() => {
    if (input.trim() === '') return { output: '', error: null };
    try {
      return { output: convert(input, target), error: null };
    } catch (err) {
      return {
        output: '',
        error: copy.invalidJson(err instanceof Error ? err.message : 'Invalid JSON'),
      };
    }
  });

  async function handleCopy() {
    if (!result.output) return;
    await navigator.clipboard.writeText(result.output);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 1500);
  }
</script>

<div class="json-to-types-tool">
  <label class="input-label">
    Input
    <textarea bind:value={input} placeholder={copy.empty} spellcheck="false"></textarea>
  </label>

  <div class="targets" role="group" aria-label="Output format">
    {#each targets as name}
      <button class="target" aria-pressed={target === name} onclick={() => (target = name)}
        >{copy.targets[name]}</button
      >
    {/each}
  </div>

  {#if result.error}
    <p class="validation invalid">{result.error}</p>
  {/if}

  {#if result.output}
    <div class="output-head">
      <button onclick={handleCopy}>{copied ? copy.copied : copy.copyButton}</button>
    </div>
    <pre class="output">{result.output}</pre>
    <p class="note">{copy.note}</p>
    <VerifyNote />
  {/if}
</div>

<style>
  .json-to-types-tool {
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

  .targets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .target[aria-pressed='true'] {
    background: var(--color-ink);
    color: var(--color-paper);
    border-color: var(--color-ink);
  }

  .validation {
    font-size: var(--size-sm);
    margin: 0;
  }

  .validation.invalid {
    color: var(--color-oxblood);
  }

  .output-head {
    display: flex;
    justify-content: flex-end;
  }

  .output {
    font-family: monospace;
    font-size: var(--size-sm);
    padding: 0.75rem;
    max-height: 320px;
    overflow: auto;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: rgba(115, 106, 92, 0.05);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .note {
    font-family: var(--font-hand);
    font-size: var(--size-sm);
    color: var(--color-muted);
    margin: 0;
  }
</style>
