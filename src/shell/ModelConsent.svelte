<script>
  import { createEventDispatcher } from 'svelte';

  export let sizeMb;

  const dispatch = createEventDispatcher();
</script>

<div class="model-consent" role="dialog" aria-modal="true">
  <p>
    This tool downloads a {sizeMb}MB model and runs it on your device. First time only, then it's
    cached, no repeat downloads.
  </p>
  <p class="warn">
    Slower on older hardware. Nothing about your photo leaves your device either way.
  </p>
  <div class="actions">
    <button type="button" onclick={() => dispatch('confirm')}>Continue</button>
    <button type="button" class="secondary" onclick={() => dispatch('cancel')}>Cancel</button>
  </div>
</div>

<style>
  .model-consent {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 1rem;
    margin: 1rem 0;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: rgba(40, 59, 73, 0.05);
  }

  .warn {
    font-family: var(--font-hand);
    color: var(--color-muted);
    margin: 0;
  }

  .actions {
    display: flex;
    gap: 0.6rem;
  }

  .secondary {
    background: transparent;
    border: 1px solid var(--color-line);
    color: var(--color-muted);
  }
</style>
