<script>
  let { value, label = null, depth = 0 } = $props();

  let expanded = $state(depth < 2);
  let isArray = $derived(Array.isArray(value));
  let isObject = $derived(value !== null && typeof value === 'object' && !isArray);
  let isExpandable = $derived(isArray || isObject);
  let entries = $derived(
    isArray ? value.map((v, i) => [i, v]) : isObject ? Object.entries(value) : [],
  );
  let valueType = $derived(value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value);
</script>

<div class="node" style="--depth: {depth}">
  <div class="row">
    {#if isExpandable}
      <button type="button" class="toggle" onclick={() => (expanded = !expanded)}>
        {expanded ? '▾' : '▸'}
      </button>
    {:else}
      <span class="toggle-spacer"></span>
    {/if}
    {#if label !== null}<span class="key">{label}:</span>{/if}
    {#if isExpandable}
      <span class="bracket">{isArray ? `[${entries.length}]` : `{${entries.length}}`}</span>
    {:else}
      <span class="value value-{valueType}">
        {typeof value === 'string' ? `"${value}"` : String(value)}
      </span>
    {/if}
  </div>
  {#if isExpandable && expanded}
    <div class="children">
      {#each entries as [k, v] (k)}
        <svelte:self value={v} label={k} depth={depth + 1} />
      {/each}
    </div>
  {/if}
</div>

<style>
  .node {
    font-family: monospace;
    font-size: var(--size-sm);
  }

  .row {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
  }

  .toggle {
    background: none;
    border: none;
    padding: 0;
    width: 1rem;
    color: var(--color-muted);
    cursor: pointer;
    font-size: inherit;
  }

  .toggle-spacer {
    display: inline-block;
    width: 1rem;
  }

  .key {
    color: var(--color-ink-navy);
  }

  .bracket {
    color: var(--color-muted);
  }

  .value {
    color: var(--color-ink);
  }

  .value-string {
    color: var(--color-oxblood);
  }

  .value-number,
  .value-boolean {
    color: var(--color-ink-navy);
  }

  .value-null {
    color: var(--color-muted);
    font-style: italic;
  }

  .children {
    padding-left: 1.2rem;
    border-left: 1px dashed var(--color-line);
    margin-left: 0.4rem;
  }
</style>
