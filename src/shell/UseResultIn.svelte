<script>
  import { tools } from '../tools/registry';
  import { stash } from '../lib/handoff';

  let { blob, name, from } = $props();
  let failed = $state(false);

  let options = $derived(
    typeof indexedDB === 'undefined'
      ? []
      : tools.filter((t) => t.id !== from && t.accepts.includes(blob.type)),
  );

  async function go(event) {
    const tool = tools.find((t) => t.id === event.target.value);
    if (!tool) return;
    try {
      await stash(new File([blob], name, { type: blob.type }));
      location.href = `/${tool.category}/${tool.id}`;
    } catch {
      failed = true;
      event.target.value = '';
    }
  }
</script>

{#if options.length > 0}
  <label class="use-in">
    Use result in
    <select onchange={go}>
      <option value="">Pick a tool</option>
      {#each options as tool (tool.id)}
        <option value={tool.id}>{tool.name}</option>
      {/each}
    </select>
  </label>
  {#if failed}
    <p class="hint">Couldn't pass it on. Download it and drop it in instead.</p>
  {/if}
{/if}

<style>
  .use-in {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    font-size: var(--size-sm);
    color: var(--color-muted);
  }

  select {
    font-family: var(--font-body);
    font-size: var(--size-sm);
    padding: 0.35rem;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: var(--color-paper);
    color: var(--color-ink);
  }

  .hint {
    margin: 0.4rem 0 0;
    font-size: var(--size-sm);
  }
</style>
