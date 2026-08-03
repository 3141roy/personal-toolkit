<script>
  import Stamp from './Stamp.svelte';

  export let title = 'Tool';
  export let icon = '⚙️';
  export let summary = '';
</script>

<div class="tool-shell">
  <header class="tool-header">
    <div class="tool-title-block">
      <span class="tool-icon">{icon}</span>
      <div>
        <h1>{title}</h1>
        {#if summary}
          <p class="tool-summary">{summary}</p>
        {/if}
      </div>
    </div>
    <div class="stamp-container">
      <Stamp />
    </div>
  </header>

  <main class="tool-content">
    <slot></slot>
  </main>

  <footer class="tool-footer">
    <p>Open your browser's network tab — it stays empty. All processing happens on your device.</p>
  </footer>
</div>

<style>
  .tool-shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .tool-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 2rem;
    border-bottom: 1px solid var(--color-line);
  }

  .tool-title-block {
    display: flex;
    gap: 1rem;
  }

  .tool-icon {
    font-size: var(--size-xl);
    line-height: 1.5;
  }

  h1 {
    font-family: var(--font-serif);
    font-size: var(--size-xl);
    color: var(--color-ink);
    margin: 0 0 0.5rem 0;
  }

  .tool-summary {
    font-family: var(--font-body);
    font-size: var(--size-sm);
    color: var(--color-muted);
    margin: 0;
  }

  .stamp-container {
    flex-shrink: 0;
  }

  .tool-content {
    flex: 1;
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
  }

  .tool-footer {
    padding: 1rem 2rem;
    background-color: rgba(212, 207, 189, 0.3);
    border-top: 1px solid var(--color-line);
    text-align: center;
  }

  .tool-footer p {
    font-family: var(--font-body);
    font-size: var(--size-sm);
    color: var(--color-muted);
    margin: 0;
  }
</style>
