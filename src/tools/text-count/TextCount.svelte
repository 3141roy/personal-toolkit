<script>
  import { copy } from './copy';
  import { countText } from './textCount';

  let input = $state('');
  let counts = $derived(countText(input));
  let copied = $state(false);

  async function handleCopy() {
    if (!input) return;
    await navigator.clipboard.writeText(input);
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 1500);
  }
</script>

<div class="text-count-tool">
  <div class="input-wrap">
    <textarea bind:value={input} placeholder={copy.placeholder} spellcheck="false"></textarea>
    {#if input}
      <button type="button" class="copy-chip" onclick={handleCopy}
        >{copied ? copy.copied : copy.copyButton}</button
      >
    {/if}
  </div>

  <div class="stats">
    <div class="stat">
      <span class="value">{counts.words}</span>
      <span class="label">{copy.words}</span>
    </div>
    <div class="stat">
      <span class="value">{counts.characters}</span>
      <span class="label">{copy.characters}</span>
    </div>
    <div class="stat">
      <span class="value">{counts.charactersNoSpaces}</span>
      <span class="label">{copy.charactersNoSpaces}</span>
    </div>
    <div class="stat">
      <span class="value">{counts.lines}</span>
      <span class="label">{copy.lines}</span>
    </div>
  </div>
</div>

<style>
  .text-count-tool {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .input-wrap {
    position: relative;
  }

  textarea {
    width: 100%;
    font-family: monospace;
    font-size: var(--size-sm);
    padding: 0.75rem;
    min-height: 220px;
    resize: vertical;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: var(--color-paper);
    color: var(--color-ink);
  }

  .copy-chip {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.2rem 0.55rem;
    font-size: var(--size-sm);
    color: var(--color-muted);
    background: var(--color-paper);
    border: 1px solid var(--color-line);
    border-radius: 4px;
    opacity: 0.7;
  }

  .copy-chip:hover {
    opacity: 1;
    color: var(--color-ink);
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: rgba(115, 106, 92, 0.05);
  }

  .value {
    font-family: var(--font-serif);
    font-size: 1.6rem;
    color: var(--color-ink);
  }

  .label {
    font-size: var(--size-sm);
    color: var(--color-muted);
  }
</style>
