<script>
  import { tools } from '../tools/registry';
  import { stash } from '../lib/handoff';

  let { blob, name, from, targets = null } = $props();
  let failed = $state(false);

  const entry = (t, slug = t.id, label = t.name) => ({
    key: slug,
    label,
    href: `/${t.category}/${slug}`,
  });

  let options = $derived(
    typeof indexedDB === 'undefined'
      ? []
      : targets
        ? targets.flatMap(({ id, slug, label }) => {
            const tool = tools.find((t) => t.id === id);
            return tool ? [entry(tool, slug, label)] : [];
          })
        : tools.filter((t) => t.id !== from && t.accepts.includes(blob.type)).map((t) => entry(t)),
  );

  async function go(event) {
    const option = options.find((o) => o.key === event.target.value);
    if (!option) return;
    try {
      await stash(new File([blob], name, { type: blob.type }));
      location.href = option.href;
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
      {#each options as option (option.key)}
        <option value={option.key}>{option.label}</option>
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
