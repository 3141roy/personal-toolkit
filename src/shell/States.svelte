<script>
  export let state = 'empty';
  export let progress = 0;
  export let error = null;
</script>

{#if state === 'empty'}
  <div class="state empty">
    <slot name="empty">Ready for input</slot>
  </div>
{:else if state === 'working'}
  <div class="state working">
    <p><slot name="working">Processing...</slot></p>
    <progress value={progress} max="100"></progress>
  </div>
{:else if state === 'done'}
  <div class="state done">
    <slot name="done">✓ Done</slot>
  </div>
{:else if state === 'error'}
  <div class="state error">
    <p>Error: {error || 'Something went wrong'}</p>
    <slot name="error"></slot>
  </div>
{/if}

<style>
  .state {
    padding: 1rem;
    margin: 1rem 0;
    border-radius: 4px;
  }

  .empty {
    background-color: rgba(115, 106, 92, 0.05);
    color: var(--color-muted);
  }

  .working {
    background-color: rgba(40, 59, 73, 0.05);
  }

  .done {
    background-color: rgba(138, 51, 36, 0.08);
    color: var(--color-oxblood);
  }

  .error {
    background-color: rgba(138, 51, 36, 0.12);
    color: var(--color-ink);
  }

  progress {
    width: 100%;
  }
</style>
