<script>
  import VerifyNote from '../../shell/VerifyNote.svelte';
  import { copy } from './copy';
  import { LIMITS, clampCount, generate, stats } from './lorem';

  const units = Object.keys(LIMITS);

  let unit = $state('paragraphs');
  let count = $state(3);
  let classicStart = $state(true);
  let html = $state(false);
  let nonce = $state(0);
  let value = $state('');
  let copied = $state(false);
  let spin = $state(0);

  let htmlOn = $derived(html && unit === 'paragraphs');
  let counts = $derived(stats(value));

  $effect(() => {
    nonce;
    value = generate({ unit, count, classicStart, html: htmlOn });
  });

  function pickUnit(u) {
    unit = u;
    count = clampCount(u, count);
  }

  function again() {
    nonce++;
    spin++;
  }

  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      copied = true;
      setTimeout(() => (copied = false), 1400);
    } catch {}
  }
</script>

<div class="lorem-tool">
  <div class="ask">
    <span class="lead">{copy.lead}</span>
    <input
      class="num"
      type="number"
      min={LIMITS[unit].min}
      max={LIMITS[unit].max}
      bind:value={count}
      onblur={() => (count = clampCount(unit, count))}
      aria-label={copy.units[unit]}
    />
    <div class="pills" role="group">
      {#each units as u (u)}
        <button
          class="pill"
          class:on={unit === u}
          aria-pressed={unit === u}
          onclick={() => pickUnit(u)}
        >
          {copy.units[u]}
        </button>
      {/each}
    </div>
  </div>
  <p class="limit">{copy.limit(LIMITS[unit].max, copy.units[unit])}</p>

  <div class="card">
    <output class="value" class:html={htmlOn}>{value}</output>

    <div class="foot">
      <p class="stats">{copy.stats(counts.words, counts.chars)}</p>
      <div class="actions">
        <button class="primary" class:done={copied} disabled={!value} onclick={copyValue}>
          {copied ? `✓ ${copy.copied}` : copy.copy}
        </button>
        <button class="again" disabled={!value} onclick={again}>
          <span class="spin" style:--turns={spin}>↻</span>
          {copy.again}
        </button>
      </div>
    </div>
  </div>

  <div class="toggles">
    <button
      class="pill"
      class:on={classicStart}
      aria-pressed={classicStart}
      onclick={() => (classicStart = !classicStart)}>{copy.classic}</button
    >
    <button
      class="pill"
      class:on={htmlOn}
      aria-pressed={htmlOn}
      disabled={unit !== 'paragraphs'}
      onclick={() => (html = !html)}>{copy.html}</button
    >
  </div>

  <p class="note">{copy.note}</p>
  <p class="fine">{copy.noStore}</p>
  <VerifyNote />
</div>

<style>
  .lorem-tool {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .ask {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }
  .lead {
    font-family: var(--font-serif);
    font-size: var(--size-lg);
  }
  .num {
    width: 5.5rem;
    font: inherit;
    font-size: var(--size-lg);
    text-align: center;
    border: 1px solid var(--color-line);
    border-radius: 8px;
    padding: 0.4rem 0.5rem;
    background: var(--color-paper);
    color: var(--color-ink);
  }
  .limit {
    margin: -0.5rem 0 0;
    font-size: 0.75rem;
    color: var(--color-muted);
  }

  .pills,
  .toggles {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .pill {
    font: inherit;
    font-size: var(--size-sm);
    padding: 0.4rem 0.9rem;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    background: transparent;
    color: var(--color-muted);
    cursor: pointer;
  }
  .pill:hover:not(:disabled) {
    border-color: var(--color-oxblood);
    color: var(--color-ink);
  }
  .pill.on {
    background: var(--color-oxblood);
    border-color: var(--color-oxblood);
    color: #fff;
  }
  .pill:disabled {
    cursor: default;
    opacity: 0.45;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.1rem 1.2rem;
    border: 1px solid var(--color-line);
    border-radius: 10px;
    background: var(--color-paper);
    box-shadow: 3px 4px 0 rgba(42, 38, 32, 0.06);
  }
  .value {
    display: block;
    max-height: 26rem;
    overflow: auto;
    padding: 0.9rem 1rem;
    border: 1px dashed var(--color-line);
    border-radius: 8px;
    background: rgba(115, 106, 92, 0.06);
    font-family: var(--font-serif);
    font-size: var(--size-base);
    line-height: 1.7;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    user-select: text;
  }
  .value.html {
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    font-size: var(--size-sm);
    line-height: 1.6;
    color: var(--color-ink-navy);
  }

  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }
  .stats {
    margin: 0;
    font-size: var(--size-sm);
    color: var(--color-muted);
  }
  .actions {
    display: flex;
    gap: 0.5rem;
  }
  .actions button {
    font: inherit;
    font-size: var(--size-sm);
    font-weight: 600;
    padding: 0.65rem 1.1rem;
    border: 1px solid var(--color-line);
    border-radius: 8px;
    background: var(--color-paper);
    color: var(--color-ink);
    cursor: pointer;
  }
  .actions .primary {
    background: var(--color-oxblood);
    border-color: var(--color-oxblood);
    color: #fff;
    min-width: 7rem;
  }
  .actions .primary.done {
    background: var(--color-ink-navy);
    border-color: var(--color-ink-navy);
  }
  .actions .again {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .actions button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .actions button:hover:not(:disabled) {
    filter: brightness(1.08);
  }
  .spin {
    display: inline-block;
    font-size: 1.05rem;
    line-height: 1;
    transform: rotate(calc(var(--turns, 0) * 360deg));
    transition: transform 0.4s ease;
  }

  button:focus-visible,
  input:focus-visible {
    outline: 2px solid var(--color-ink-navy);
    outline-offset: 2px;
  }

  .note {
    margin: 0;
    font-family: var(--font-hand);
    font-size: var(--size-sm);
    color: var(--color-muted);
  }
  .fine {
    margin: 0;
    font-size: var(--size-sm);
    color: var(--color-muted);
  }
</style>
