<script>
  import VerifyNote from '../../shell/VerifyNote.svelte';
  import { copy } from './copy';
  import {
    parseInput,
    exactDelta,
    formatDelta,
    relativePhrase,
    offsetLabel,
    isValidZone,
    zoneList,
    defaultZones,
  } from './timestamp';

  const STORE = 'bundle:timestamp:zones';
  const allZones = zoneList();

  function loadZones() {
    try {
      const raw = localStorage.getItem(STORE);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        const valid = parsed.filter((z) => typeof z === 'string' && isValidZone(z));
        if (valid.length) return valid;
      }
    } catch {}
    return defaultZones();
  }

  let input = $state('');
  let zones = $state(loadZones());
  let expanded = $state(null);
  let adding = $state(false);
  let search = $state('');
  let now = $state(Date.now());
  let copiedKey = $state(null);

  $effect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(zones));
    } catch {}
  });

  $effect(() => {
    const id = setInterval(() => {
      now = Date.now();
    }, 1000);
    return () => clearInterval(id);
  });

  let parsed = $derived(parseInput(input));
  let frozen = $derived(parsed.kind === 'fixed');
  let epochMs = $derived(parsed.kind === 'fixed' ? parsed.epochMs : now);
  let unitLabel = $derived(
    parsed.kind === 'fixed' ? parsed.unit : parsed.kind === 'error' ? '?' : copy.unitLive,
  );
  let phrase = $derived(relativePhrase(epochMs, now));
  let deltaText = $derived(formatDelta(exactDelta(epochMs, now)));
  let matches = $derived.by(() => {
    const q = search.trim().toLowerCase().replace(/\s+/g, '_');
    return allZones.filter((z) => z.toLowerCase().includes(q)).slice(0, 60);
  });

  function timeIn(tz, ms) {
    try {
      return new Date(ms).toLocaleTimeString('en-GB', {
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '--';
    }
  }
  function dateIn(tz, ms) {
    try {
      return new Date(ms).toLocaleDateString('en-GB', {
        timeZone: tz,
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }
  function fullIn(tz, ms) {
    try {
      return new Date(ms).toLocaleString('en-GB', {
        timeZone: tz,
        dateStyle: 'full',
        timeStyle: 'long',
      });
    } catch {
      return '--';
    }
  }
  function isoOf(ms) {
    try {
      return new Date(ms).toISOString();
    } catch {
      return '--';
    }
  }

  function toggle(i) {
    expanded = expanded === i ? null : i;
  }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= zones.length) return;
    const next = [...zones];
    [next[i], next[j]] = [next[j], next[i]];
    zones = next;
    expanded = null;
  }
  function remove(i) {
    zones = zones.filter((_, k) => k !== i);
    if (expanded === i) expanded = null;
    else if (expanded !== null && expanded > i) expanded -= 1;
  }
  function addZone(z) {
    if (!zones.includes(z)) zones = [...zones, z];
    adding = false;
    search = '';
  }
  function setZone(i, z) {
    const next = [...zones];
    next[i] = z;
    zones = next;
  }
  async function copyText(key, text) {
    try {
      await navigator.clipboard.writeText(text);
      copiedKey = key;
      setTimeout(() => {
        if (copiedKey === key) copiedKey = null;
      }, 1200);
    } catch {}
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === 'Escape' && adding) {
      adding = false;
      search = '';
    }
  }}
/>

<div class="ts-tool">
  <div class="inbar">
    <input
      bind:value={input}
      placeholder={copy.placeholder}
      spellcheck="false"
      autocomplete="off"
    />
    <span class="unit">{unitLabel}</span>
  </div>

  {#if parsed.kind === 'error'}
    <p class="status err">{copy.invalid}</p>
  {:else if frozen}
    <p class="status fixed">{phrase} <span class="dot">·</span> <b>{deltaText}</b></p>
  {:else}
    <p class="status live">{copy.live}</p>
  {/if}

  <div class="strip">
    {#each zones as tz, i (tz)}
      <div class="clock" class:exp={expanded === i}>
        <button class="top" onclick={() => toggle(i)} aria-expanded={expanded === i}>
          <span class="zone">{tz.replace(/_/g, ' ')}</span>
          <span class="time">{timeIn(tz, epochMs)}</span>
          <span class="date">{dateIn(tz, epochMs)}</span>
          <span class="off">{offsetLabel(tz, new Date(epochMs))}</span>
        </button>
        <div class="ctl">
          <button onclick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier">‹</button
          >
          <button
            onclick={() => move(i, 1)}
            disabled={i === zones.length - 1}
            aria-label="Move later">›</button
          >
          <button onclick={() => remove(i)} aria-label="Remove zone">×</button>
        </div>

        {#if expanded === i}
          <div class="detail">
            <div class="drow">
              <span class="k">{copy.rows.zone}</span>
              <span class="v">
                <select value={tz} onchange={(e) => setZone(i, e.currentTarget.value)}>
                  {#each allZones as z}<option value={z}>{z}</option>{/each}
                </select>
              </span>
            </div>
            <div class="drow">
              <span class="k">{copy.rows.local}</span><span class="v">{fullIn(tz, epochMs)}</span>
            </div>
            <div class="drow">
              <span class="k">{copy.rows.iso}</span>
              <span class="v"
                >{isoOf(epochMs)}
                <button class="cp" onclick={() => copyText(`iso${i}`, isoOf(epochMs))}
                  >{copiedKey === `iso${i}` ? copy.copied : copy.copy}</button
                ></span
              >
            </div>
            <div class="drow">
              <span class="k">{copy.rows.unixS}</span>
              <span class="v"
                >{Math.floor(epochMs / 1000)}
                <button
                  class="cp"
                  onclick={() => copyText(`s${i}`, String(Math.floor(epochMs / 1000)))}
                  >{copiedKey === `s${i}` ? copy.copied : copy.copy}</button
                ></span
              >
            </div>
            <div class="drow">
              <span class="k">{copy.rows.unixMs}</span>
              <span class="v"
                >{epochMs}
                <button class="cp" onclick={() => copyText(`ms${i}`, String(epochMs))}
                  >{copiedKey === `ms${i}` ? copy.copied : copy.copy}</button
                ></span
              >
            </div>
            <div class="drow">
              <span class="k">{copy.rows.relative}</span><span class="v"
                >{phrase} · {deltaText}</span
              >
            </div>
          </div>
        {/if}
      </div>
    {/each}

    {#if adding}
      <div class="addpanel">
        <div class="prow">
          <input bind:value={search} placeholder={copy.searchPlaceholder} autocomplete="off" />
          <button
            class="close"
            onclick={() => {
              adding = false;
              search = '';
            }}>{copy.close}</button
          >
        </div>
        <div class="zlist">
          {#each matches as z (z)}
            <button class="zrow" disabled={zones.includes(z)} onclick={() => addZone(z)}>
              <span>{z.replace(/_/g, ' ')}</span>
              <span class="zt">{timeIn(z, epochMs)} · {offsetLabel(z, new Date(epochMs))}</span>
            </button>
          {/each}
        </div>
      </div>
    {:else}
      <button class="add" onclick={() => (adding = true)}>{copy.addZone}</button>
    {/if}
  </div>

  <p class="note">{copy.note}</p>
  <VerifyNote />
</div>

<style>
  .ts-tool {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .inbar {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    border: 1px solid var(--color-line);
    border-radius: 8px;
    background: var(--color-paper);
    padding: 0.6rem 0.8rem;
  }

  .inbar input {
    flex: 1;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--color-ink);
    font-family: monospace;
    font-size: var(--size-sm);
  }

  .unit {
    font-size: 0.7rem;
    color: var(--color-muted);
    border: 1px solid var(--color-line);
    border-radius: 999px;
    padding: 0.05rem 0.5rem;
    white-space: nowrap;
  }

  .status {
    margin: 0;
    font-size: var(--size-sm);
    min-height: 1.3em;
  }
  .status.live {
    color: var(--color-muted);
  }
  .status.fixed {
    color: var(--color-ink-navy);
  }
  .status.err {
    color: var(--color-oxblood);
  }
  .status b {
    font-family: monospace;
  }
  .status .dot {
    opacity: 0.5;
  }

  .strip {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    margin-top: 0.25rem;
  }

  .clock {
    position: relative;
    flex: 1 1 170px;
    min-width: 170px;
    border: 1px solid var(--color-line);
    border-radius: 8px;
    background: rgba(115, 106, 92, 0.05);
    box-shadow: 2px 3px 0 rgba(42, 38, 32, 0.05);
    overflow: hidden;
  }
  .clock.exp {
    flex-basis: 100%;
  }

  .top {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.05rem;
    width: 100%;
    border: 0;
    background: transparent;
    text-align: left;
    padding: 0.85rem 1rem;
    cursor: pointer;
    color: var(--color-ink);
  }

  .zone {
    font-size: 0.72rem;
    color: var(--color-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding-right: 3.5rem;
  }
  .time {
    font-family: var(--font-serif);
    font-size: 1.8rem;
    margin: 0.1rem 0 0.05rem;
  }
  .date {
    font-size: var(--size-sm);
  }
  .off {
    font-size: 0.7rem;
    color: var(--color-muted);
    font-family: monospace;
    margin-top: 0.3rem;
  }

  .ctl {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.15rem;
  }
  .ctl button {
    font-size: 0.8rem;
    line-height: 1;
    border: 1px solid var(--color-line);
    background: var(--color-paper);
    color: var(--color-muted);
    border-radius: 5px;
    padding: 0.15rem 0.4rem;
    cursor: pointer;
  }
  .ctl button:hover:not(:disabled) {
    color: var(--color-oxblood);
  }
  .ctl button:disabled {
    opacity: 0.35;
    cursor: default;
  }

  .detail {
    border-top: 1px dashed var(--color-line);
    padding: 0.6rem 1rem 0.9rem;
    background: var(--color-paper);
  }
  .drow {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.3rem 0;
    font-size: var(--size-sm);
    border-bottom: 1px solid var(--color-line);
  }
  .drow:last-child {
    border: 0;
  }
  .drow .k {
    color: var(--color-muted);
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding-top: 0.18rem;
    white-space: nowrap;
  }
  .drow .v {
    font-family: monospace;
    text-align: right;
    word-break: break-all;
  }
  .drow select {
    font: inherit;
    font-family: monospace;
    border: 1px solid var(--color-line);
    border-radius: 5px;
    background: var(--color-paper);
    color: var(--color-ink);
    padding: 0.1rem 0.3rem;
    max-width: 230px;
  }
  .cp {
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border: 1px solid var(--color-line);
    background: var(--color-paper);
    color: var(--color-oxblood);
    border-radius: 4px;
    padding: 0.05rem 0.35rem;
    margin-left: 0.4rem;
    cursor: pointer;
  }

  .add {
    flex: 1 1 170px;
    min-width: 170px;
    min-height: 120px;
    border: 1px dashed var(--color-line);
    border-radius: 8px;
    background: transparent;
    color: var(--color-muted);
    font-size: var(--size-sm);
    cursor: pointer;
  }
  .add:hover {
    color: var(--color-oxblood);
    border-color: var(--color-oxblood);
  }

  .addpanel {
    flex: 1 1 100%;
    border: 1px solid var(--color-line);
    border-radius: 8px;
    background: rgba(115, 106, 92, 0.05);
    padding: 0.8rem;
    box-shadow: 2px 3px 0 rgba(42, 38, 32, 0.05);
  }
  .prow {
    display: flex;
    gap: 0.5rem;
  }
  .prow input {
    flex: 1;
    font: inherit;
    font-size: var(--size-sm);
    border: 1px solid var(--color-line);
    border-radius: 6px;
    padding: 0.5rem 0.7rem;
    background: var(--color-paper);
    color: var(--color-ink);
    outline: 0;
  }
  .close {
    font-size: var(--size-sm);
    border: 1px solid var(--color-line);
    background: var(--color-paper);
    color: var(--color-muted);
    border-radius: 6px;
    padding: 0.5rem 0.7rem;
    cursor: pointer;
  }
  .zlist {
    max-height: 240px;
    overflow: auto;
    margin-top: 0.6rem;
    border-top: 1px solid var(--color-line);
  }
  .zrow {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    border: 0;
    border-bottom: 1px solid var(--color-line);
    background: transparent;
    color: var(--color-ink);
    text-align: left;
    padding: 0.45rem 0.35rem;
    font-size: var(--size-sm);
    cursor: pointer;
  }
  .zrow:hover:not(:disabled) {
    background: rgba(115, 106, 92, 0.08);
  }
  .zrow:disabled {
    opacity: 0.33;
    cursor: default;
  }
  .zrow .zt {
    font-family: monospace;
    color: var(--color-muted);
    white-space: nowrap;
  }

  .note {
    font-family: var(--font-hand);
    font-size: var(--size-sm);
    color: var(--color-muted);
    margin: 0.25rem 0 0;
  }
</style>
