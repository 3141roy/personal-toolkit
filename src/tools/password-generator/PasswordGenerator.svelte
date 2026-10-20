<script>
  import VerifyNote from '../../shell/VerifyNote.svelte';
  import { copy } from './copy';
  import {
    PRESETS,
    charRuns,
    generatePassword,
    generatePassphrase,
    passwordEntropy,
    passphraseEntropy,
    strength,
    crackTime,
  } from './password';

  const levels = ['weak', 'fair', 'good', 'strong', 'excellent'];
  const setKeys = ['lower', 'upper', 'digits', 'symbols'];

  let mode = $state('password');
  let pw = $state({ ...PRESETS.strong });
  let pp = $state({ words: 5, separator: '-', capitalise: true, number: false });
  let nonce = $state(0);
  let value = $state('');
  let copied = $state(false);
  let spin = $state(0);

  $effect(() => {
    nonce;
    value = mode === 'password' ? generatePassword(pw) : generatePassphrase(pp);
  });

  let bits = $derived(mode === 'password' ? passwordEntropy(pw) : passphraseEntropy(pp));
  let level = $derived(strength(bits));
  let filled = $derived(levels.indexOf(level) + 1);
  let crack = $derived(crackTime(bits));
  let crackText = $derived.by(() => {
    const phrase = copy.crack[crack.unit];
    return typeof phrase === 'function' ? phrase(crack.n) : phrase;
  });
  let runs = $derived(charRuns(value));
  let activeSets = $derived(setKeys.filter((k) => pw[k]).length);
  let activePreset = $derived(
    Object.keys(PRESETS).find((name) =>
      Object.keys(PRESETS[name]).every((k) => pw[k] === PRESETS[name][k]),
    ),
  );

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

<div class="pw-tool">
  <div class="modes" role="group">
    {#each Object.keys(copy.modes) as m (m)}
      <button
        class="mode"
        class:on={mode === m}
        aria-pressed={mode === m}
        onclick={() => (mode = m)}
      >
        <span class="ml">{copy.modes[m].label}</span>
        <span class="mh">{copy.modes[m].hint}</span>
      </button>
    {/each}
  </div>

  <div class="card">
    <div class="display" class:blank={!value}>
      {#if value}
        <output class="value" aria-live="off"
          >{#each runs as run}<span class={run.kind}>{run.text}</span>{/each}</output
        >
      {:else}
        <p class="empty">{copy.empty}</p>
      {/if}
    </div>

    <div class="actions">
      <button class="primary" class:done={copied} disabled={!value} onclick={copyValue}>
        {copied ? `✓ ${copy.copied}` : copy.copy}
      </button>
      <button class="again" disabled={!value} onclick={again}>
        <span class="spin" style:--turns={spin}>↻</span>
        {copy.again}
      </button>
    </div>

    {#if value}
      <div class="meter">
        <div class="segs" role="img" aria-label={copy.strength[level]}>
          {#each levels as l, i (l)}
            <span class="seg" class:on={i < filled} class:warm={filled <= 2}></span>
          {/each}
        </div>
        <p class="line">
          <b class:warm={filled <= 2}>{copy.strength[level]}</b>
          <span class="dot">·</span>
          {copy.bits(bits)}
          <span class="dot">·</span>
          {copy.chars([...value].length)}
        </p>
        <p class="line sub">{copy.crackLead} {crackText}.</p>
      </div>
    {/if}
  </div>

  <div class="opts">
    {#if mode === 'password'}
      <div class="row">
        <span class="lab">{copy.quick}</span>
        <div class="pills">
          {#each Object.keys(PRESETS) as name (name)}
            <button
              class="pill"
              class:on={activePreset === name}
              aria-pressed={activePreset === name}
              onclick={() => (pw = { ...PRESETS[name] })}>{copy.presets[name]}</button
            >
          {/each}
        </div>
      </div>

      <label class="row range">
        <span class="lab">{copy.length}</span>
        <input type="range" min="4" max="64" bind:value={pw.length} />
        <input class="num" type="number" min="4" max="128" bind:value={pw.length} />
      </label>

      <div class="row">
        <span class="lab">{copy.include}</span>
        <div class="pills">
          {#each setKeys as set (set)}
            <button
              class="pill mono"
              class:on={pw[set]}
              aria-pressed={pw[set]}
              aria-label={copy.setNames[set]}
              title={copy.setNames[set]}
              disabled={pw[set] && activeSets === 1}
              onclick={() => (pw[set] = !pw[set])}>{copy.sets[set]}</button
            >
          {/each}
          <button
            class="pill"
            class:on={pw.ambiguous}
            aria-pressed={pw.ambiguous}
            title={copy.ambiguousHint}
            onclick={() => (pw.ambiguous = !pw.ambiguous)}>{copy.ambiguous}</button
          >
        </div>
      </div>
    {:else}
      <label class="row range">
        <span class="lab">{copy.words}</span>
        <input type="range" min="3" max="10" bind:value={pp.words} />
        <input class="num" type="number" min="3" max="10" bind:value={pp.words} />
      </label>

      <div class="row">
        <span class="lab">{copy.separator}</span>
        <div class="pills">
          {#each Object.entries(copy.separators) as [sep, label] (sep)}
            <button
              class="pill"
              class:on={pp.separator === sep}
              aria-pressed={pp.separator === sep}
              onclick={() => (pp.separator = sep)}>{label}</button
            >
          {/each}
        </div>
      </div>

      <div class="row">
        <span class="lab">{copy.include}</span>
        <div class="pills">
          <button
            class="pill"
            class:on={pp.capitalise}
            aria-pressed={pp.capitalise}
            onclick={() => (pp.capitalise = !pp.capitalise)}>{copy.capitalise}</button
          >
          <button
            class="pill"
            class:on={pp.number}
            aria-pressed={pp.number}
            onclick={() => (pp.number = !pp.number)}>{copy.number}</button
          >
        </div>
      </div>
    {/if}
  </div>

  <p class="note">{copy.note}</p>
  <p class="fine">{copy.noStore}</p>
  <VerifyNote />
</div>

<style>
  .pw-tool {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  .modes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.5rem;
  }
  .mode {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: 8px;
    background: var(--color-paper);
    color: var(--color-ink);
    text-align: left;
    cursor: pointer;
  }
  .mode:hover {
    border-color: var(--color-oxblood);
  }
  .mode.on {
    border-color: var(--color-oxblood);
    box-shadow: 2px 3px 0 rgba(138, 51, 36, 0.18);
  }
  .ml {
    font-weight: 600;
    font-size: var(--size-sm);
  }
  .mh {
    font-size: 0.72rem;
    color: var(--color-muted);
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

  .display {
    display: flex;
    align-items: center;
    min-height: 4.2rem;
    padding: 0.9rem 1rem;
    border: 1px dashed var(--color-line);
    border-radius: 8px;
    background: rgba(115, 106, 92, 0.06);
  }
  .value {
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    font-size: clamp(1.15rem, 3.2vw, 1.6rem);
    line-height: 1.45;
    letter-spacing: 0.02em;
    white-space: pre-wrap;
    word-break: break-all;
    user-select: all;
  }
  .value .letter {
    color: var(--color-ink);
  }
  .value .digit {
    color: var(--color-ink-navy);
    font-weight: 700;
  }
  .value .symbol {
    color: var(--color-oxblood);
    font-weight: 700;
  }
  .empty {
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
    padding: 0.7rem 1rem;
    border: 1px solid var(--color-line);
    border-radius: 8px;
    background: var(--color-paper);
    color: var(--color-ink);
    cursor: pointer;
  }
  .actions .primary {
    flex: 1;
    background: var(--color-oxblood);
    border-color: var(--color-oxblood);
    color: #fff;
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

  .meter {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding-top: 0.9rem;
    border-top: 1px dashed var(--color-line);
  }
  .segs {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
  }
  .seg {
    height: 6px;
    border-radius: 999px;
    background: var(--color-line);
    transition: background 0.2s ease;
  }
  .seg.on {
    background: var(--color-ink-navy);
  }
  .seg.on.warm {
    background: var(--color-oxblood);
  }
  .line {
    margin: 0;
    font-size: var(--size-sm);
  }
  .line b.warm {
    color: var(--color-oxblood);
  }
  .line.sub {
    color: var(--color-muted);
  }
  .dot {
    opacity: 0.5;
    margin: 0 0.15rem;
  }

  .opts {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }
  .row {
    display: grid;
    grid-template-columns: 5.5rem minmax(0, 1fr);
    align-items: center;
    gap: 0.75rem;
  }
  .row.range {
    grid-template-columns: 5.5rem minmax(0, 1fr) 4.5rem;
  }
  @media (max-width: 520px) {
    .row {
      grid-template-columns: minmax(0, 1fr);
      gap: 0.4rem;
    }
    .row.range {
      grid-template-columns: minmax(0, 1fr) 4.5rem;
    }
    .row.range .lab {
      grid-column: 1 / -1;
    }
  }
  .lab {
    color: var(--color-muted);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .pill {
    font: inherit;
    font-size: var(--size-sm);
    padding: 0.35rem 0.85rem;
    border: 1px solid var(--color-line);
    border-radius: 999px;
    background: transparent;
    color: var(--color-muted);
    cursor: pointer;
  }
  .pill.mono {
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    min-width: 3.4rem;
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
    opacity: 0.55;
  }

  input[type='range'] {
    width: 100%;
    accent-color: var(--color-oxblood);
  }
  .num {
    font: inherit;
    font-size: var(--size-sm);
    border: 1px solid var(--color-line);
    border-radius: 6px;
    padding: 0.4rem 0.6rem;
    background: var(--color-paper);
    color: var(--color-ink);
    min-width: 0;
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
