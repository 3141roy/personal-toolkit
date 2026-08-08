<script>
  import { loadIsland } from '../tools/islands';

  let { toolId } = $props();
  let Component = $state(null);

  loadIsland(toolId).then((mod) => {
    Component = mod.default;
  });
</script>

{#if Component}
  <Component />
{:else}
  <p class="loading">Loading…</p>
{/if}

<style>
  .loading {
    color: var(--color-muted);
    font-size: var(--size-sm);
  }
</style>
