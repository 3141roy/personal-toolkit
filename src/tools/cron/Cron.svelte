<script>
  import VerifyNote from '../../shell/VerifyNote.svelte';
  import { copy } from './copy';
  import { parseCron, detectDialect } from './cron';
  import { describe as explainCron } from './cronText';
  import { nextRuns } from './cronSchedule';

  const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let mode = $state('explain');

  // ---------- explain mode ----------
  let raw = $state('*/15 9-17 * * 1-5');
  let forced = $state('auto');
  let explainDialect = $derived(forced === 'auto' ? detectDialect(raw) : forced);
  let parsedExplain = $derived(parseCron(raw, forced === 'auto' ? undefined : forced));

  // ---------- build mode ----------
  let seconds = $state(false);
  let b = $state({
    sec: { mode: 'every', every: 30, at: 0 },
    min: { mode: 'everyN', everyN: 15, at: 0 },
    hours: { mode: 'all', from: 9, to: 17, everyN: 2 },
    dom: { mode: 'all', list: [1], last: 0 },
    month: { mode: 'all', list: [] },
    dow: { mode: 'all', list: [] },
  });
  let openChip = $state(null);

  let buildQuartz = $derived(seconds || b.dom.mode === 'last');

  let buildExpr = $derived.by(() => {
    const min = b.min.mode === 'everyN' ? `*/${b.min.everyN}` : `${b.min.at}`;
    const hour =
      b.hours.mode === 'all'
        ? '*'
        : b.hours.mode === 'range'
          ? `${b.hours.from}-${b.hours.to}`
          : `*/${b.hours.everyN}`;
    let dom =
      b.dom.mode === 'all'
        ? '*'
        : b.dom.mode === 'last'
          ? b.dom.last
            ? `L-${b.dom.last}`
            : 'L'
          : b.dom.list
              .slice()
              .sort((x, y) => x - y)
              .join(',') || '*';
    const month =
      b.month.mode === 'all'
        ? '*'
        : b.month.list
            .slice()
            .sort((x, y) => x - y)
            .join(',') || '*';
    let dow =
      b.dow.mode === 'all'
        ? '*'
        : b.dow.mode === 'weekdays'
          ? '1-5'
          : b.dow.mode === 'weekends'
            ? '0,6'
            : b.dow.list
                .slice()
                .sort((x, y) => x - y)
                .join(',') || '*';

    if (buildQuartz) {
      if (dow !== '*' && dom !== '*') dom = '*';
      if (dow !== '*') dom = dom === '*' ? '?' : dom;
      dow = dow === '*' ? '?' : dow;
      if (dom === '?' && dow === '?') dow = '*';
      const sec = b.sec.mode === 'every' ? `*/${b.sec.every}` : `${b.sec.at}`;
      return `${sec} ${min} ${hour} ${dom} ${month} ${dow}`;
    }
    return `${min} ${hour} ${dom} ${month} ${dow}`;
  });

  let activeExpr = $derived(mode === 'explain' ? raw : buildExpr);
  let activeDialect = $derived(
    mode === 'explain' ? explainDialect : buildQuartz ? 'quartz' : 'standard',
  );
  let parsed = $derived(
    mode === 'explain' ? parsedExplain : parseCron(buildExpr, buildQuartz ? 'quartz' : 'standard'),
  );
  let description = $derived(parsed.ok ? explainCron(parsed.cron) : null);
  let runs = $derived(parsed.ok ? nextRuns(parsed.cron, new Date(), 5) : []);

  let copied = $state(false);
  async function copyExpr() {
    try {
      await navigator.clipboard.writeText(activeExpr);
      copied = true;
      setTimeout(() => (copied = false), 1200);
    } catch {}
  }
  function toExplain() {
    raw = buildExpr;
    forced = buildQuartz ? 'quartz' : 'standard';
    mode = 'explain';
  }

  function toggleIn(arr, v) {
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  }
  function fmt(d) {
    return d.toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: buildQuartz || activeDialect === 'quartz' ? '2-digit' : undefined,
    });
  }
  function fmtUTC(d) {
    return d.toISOString().slice(0, 19).replace('T', ' ') + 'Z';
  }
</script>

<div class="cron-tool">
  <div class="modes">
    <button class:on={mode === 'explain'} onclick={() => (mode = 'explain')}
      >{copy.modeExplain}</button
    >
    <button class:on={mode === 'build'} onclick={() => (mode = 'build')}>{copy.modeBuild}</button>
  </div>

  {#if mode === 'explain'}
    <div class="inbar">
      <input
        bind:value={raw}
        placeholder={copy.explainPlaceholder}
        spellcheck="false"
        autocomplete="off"
      />
    </div>
    <div class="dialect">
      {#each [['auto', copy.dialectAuto], ['standard', copy.dialectStandard], ['quartz', copy.dialectQuartz]] as [val, label]}
        <button class:on={forced === val} onclick={() => (forced = val)}>{label}</button>
      {/each}
      {#if forced === 'auto'}<span class="detected">detected: {explainDialect}</span>{/if}
    </div>
  {:else}
    <div class="sentence">
      {copy.sentence.lead}
      <button
        class="chip"
        class:open={openChip === 'min'}
        onclick={() => (openChip = openChip === 'min' ? null : 'min')}
      >
        {b.min.mode === 'everyN'
          ? `every ${b.min.everyN} min`
          : `at :${String(b.min.at).padStart(2, '0')}`}
      </button>
      {#if seconds}
        <button
          class="chip"
          class:open={openChip === 'sec'}
          onclick={() => (openChip = openChip === 'sec' ? null : 'sec')}
        >
          {b.sec.mode === 'every' ? `every ${b.sec.every}s` : `sec ${b.sec.at}`}
        </button>
      {/if}
      <button
        class="chip"
        class:open={openChip === 'hours'}
        onclick={() => (openChip = openChip === 'hours' ? null : 'hours')}
      >
        {b.hours.mode === 'all'
          ? 'any hour'
          : b.hours.mode === 'range'
            ? `${b.hours.from}:00–${b.hours.to}:59`
            : `every ${b.hours.everyN}h`}
      </button>
      <button
        class="chip"
        class:open={openChip === 'dom'}
        onclick={() => (openChip = openChip === 'dom' ? null : 'dom')}
      >
        {b.dom.mode === 'all'
          ? 'any day'
          : b.dom.mode === 'last'
            ? b.dom.last
              ? `${b.dom.last} before month end`
              : 'last day'
            : `day ${
                b.dom.list
                  .slice()
                  .sort((x, y) => x - y)
                  .join(', ') || '?'
              }`}
      </button>
      <button
        class="chip"
        class:open={openChip === 'dow'}
        onclick={() => (openChip = openChip === 'dow' ? null : 'dow')}
      >
        {b.dow.mode === 'all'
          ? 'any weekday'
          : b.dow.mode === 'weekdays'
            ? 'weekdays'
            : b.dow.mode === 'weekends'
              ? 'weekends'
              : b.dow.list
                  .slice()
                  .sort((x, y) => x - y)
                  .map((d) => DAYS[d])
                  .join(', ') || '?'}
      </button>
      <button
        class="chip"
        class:open={openChip === 'month'}
        onclick={() => (openChip = openChip === 'month' ? null : 'month')}
      >
        {b.month.mode === 'all'
          ? 'every month'
          : b.month.list
              .slice()
              .sort((x, y) => x - y)
              .map((m) => MONTHS[m - 1])
              .join(', ') || 'every month'}
      </button>
    </div>

    {#if openChip}
      <div class="pop">
        {#if openChip === 'min'}
          <div class="prow">
            <label><input type="radio" bind:group={b.min.mode} value="everyN" /> every</label>
            <input
              type="range"
              min="1"
              max="59"
              bind:value={b.min.everyN}
              disabled={b.min.mode !== 'everyN'}
            />
            <span class="v">{b.min.everyN} min</span>
          </div>
          <div class="prow">
            <label><input type="radio" bind:group={b.min.mode} value="at" /> at minute</label>
            <input
              type="range"
              min="0"
              max="59"
              bind:value={b.min.at}
              disabled={b.min.mode !== 'at'}
            />
            <span class="v">:{String(b.min.at).padStart(2, '0')}</span>
          </div>
        {:else if openChip === 'sec'}
          <div class="prow">
            <label><input type="radio" bind:group={b.sec.mode} value="every" /> every</label>
            <input
              type="range"
              min="1"
              max="59"
              bind:value={b.sec.every}
              disabled={b.sec.mode !== 'every'}
            />
            <span class="v">{b.sec.every} s</span>
          </div>
          <div class="prow">
            <label><input type="radio" bind:group={b.sec.mode} value="at" /> at second</label>
            <input
              type="range"
              min="0"
              max="59"
              bind:value={b.sec.at}
              disabled={b.sec.mode !== 'at'}
            />
            <span class="v">{b.sec.at}</span>
          </div>
        {:else if openChip === 'hours'}
          <div class="opts">
            <button class:on={b.hours.mode === 'all'} onclick={() => (b.hours.mode = 'all')}
              >any hour</button
            >
            <button class:on={b.hours.mode === 'range'} onclick={() => (b.hours.mode = 'range')}
              >a window</button
            >
            <button class:on={b.hours.mode === 'everyN'} onclick={() => (b.hours.mode = 'everyN')}
              >every N hours</button
            >
          </div>
          {#if b.hours.mode === 'range'}
            <div class="prow">
              <span>from</span><input
                type="range"
                min="0"
                max="23"
                bind:value={b.hours.from}
              /><span class="v">{b.hours.from}:00</span>
            </div>
            <div class="prow">
              <span>to</span><input type="range" min="0" max="23" bind:value={b.hours.to} /><span
                class="v">{b.hours.to}:59</span
              >
            </div>
          {:else if b.hours.mode === 'everyN'}
            <div class="prow">
              <input type="range" min="1" max="23" bind:value={b.hours.everyN} /><span class="v"
                >every {b.hours.everyN}h</span
              >
            </div>
          {/if}
        {:else if openChip === 'dom'}
          <div class="opts">
            <button class:on={b.dom.mode === 'all'} onclick={() => (b.dom.mode = 'all')}>any</button
            >
            <button class:on={b.dom.mode === 'list'} onclick={() => (b.dom.mode = 'list')}
              >pick days</button
            >
            <button class:on={b.dom.mode === 'last'} onclick={() => (b.dom.mode = 'last')}
              >last day (Quartz)</button
            >
          </div>
          {#if b.dom.mode === 'list'}
            <div class="grid31">
              {#each Array(31) as _, i}
                <button
                  class:on={b.dom.list.includes(i + 1)}
                  onclick={() => (b.dom.list = toggleIn(b.dom.list, i + 1))}>{i + 1}</button
                >
              {/each}
            </div>
          {:else if b.dom.mode === 'last'}
            <div class="prow">
              <span>days before month end</span><input
                type="range"
                min="0"
                max="15"
                bind:value={b.dom.last}
              /><span class="v">{b.dom.last}</span>
            </div>
          {/if}
        {:else if openChip === 'dow'}
          <div class="opts">
            <button class:on={b.dow.mode === 'all'} onclick={() => (b.dow.mode = 'all')}>any</button
            >
            <button class:on={b.dow.mode === 'weekdays'} onclick={() => (b.dow.mode = 'weekdays')}
              >weekdays</button
            >
            <button class:on={b.dow.mode === 'weekends'} onclick={() => (b.dow.mode = 'weekends')}
              >weekends</button
            >
            <button class:on={b.dow.mode === 'list'} onclick={() => (b.dow.mode = 'list')}
              >pick</button
            >
          </div>
          {#if b.dow.mode === 'list'}
            <div class="week">
              {#each DAYS as d, i}
                <button
                  class:on={b.dow.list.includes(i)}
                  onclick={() => (b.dow.list = toggleIn(b.dow.list, i))}>{d}</button
                >
              {/each}
            </div>
          {/if}
        {:else if openChip === 'month'}
          <div class="opts">
            <button class:on={b.month.mode === 'all'} onclick={() => (b.month.mode = 'all')}
              >every month</button
            >
            <button class:on={b.month.mode === 'list'} onclick={() => (b.month.mode = 'list')}
              >pick months</button
            >
          </div>
          {#if b.month.mode === 'list'}
            <div class="week">
              {#each MONTHS as m, i}
                <button
                  class:on={b.month.list.includes(i + 1)}
                  onclick={() => (b.month.list = toggleIn(b.month.list, i + 1))}>{m}</button
                >
              {/each}
            </div>
          {/if}
        {/if}
      </div>
    {/if}

    <label class="secs"
      ><input type="checkbox" bind:checked={seconds} /> add a seconds field (switches to Quartz 6-field)</label
    >
  {/if}

  <div class="result">
    <div class="exprline">
      <span class="expr">{activeExpr}</span>
      <span class="badge">{activeDialect}</span>
      <button class="cp" onclick={copyExpr}>{copied ? copy.copied : copy.copyButton}</button>
      {#if mode === 'build'}<button class="cp" onclick={toExplain}>{copy.explainThis}</button>{/if}
    </div>

    {#if parsed.ok && description}
      <p class="eng">{description.text}</p>
      {#if description.warning}<p class="warn">{description.warning}</p>{/if}
      <div class="next">
        <span class="k">{copy.nextHeading}</span>
        {#if runs.length === 0}
          <span class="none">{copy.noRuns}</span>
        {:else}
          <ul>
            {#each runs as r}
              <li><span class="loc">{fmt(r)}</span> <span class="utc">{fmtUTC(r)}</span></li>
            {/each}
          </ul>
        {/if}
      </div>
    {:else if !parsed.ok}
      <p class="err">{parsed.error}</p>
    {/if}
  </div>

  <p class="note">{copy.note}</p>
  <VerifyNote />
</div>

<style>
  .cron-tool {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .modes,
  .dialect,
  .opts {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
  .modes button,
  .dialect button,
  .opts button {
    font: inherit;
    font-size: var(--size-sm);
    border: 1px solid var(--color-line);
    background: var(--color-paper);
    color: var(--color-ink);
    border-radius: 6px;
    padding: 0.3rem 0.7rem;
    cursor: pointer;
  }
  .modes button.on,
  .dialect button.on,
  .opts button.on {
    background: var(--color-ink);
    color: var(--color-paper);
    border-color: var(--color-ink);
  }
  .detected {
    font-size: var(--size-sm);
    color: var(--color-muted);
    align-self: center;
  }

  .inbar {
    border: 1px solid var(--color-line);
    border-radius: 8px;
    background: var(--color-paper);
    padding: 0.6rem 0.8rem;
  }
  .inbar input {
    width: 100%;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--color-ink);
    font-family: monospace;
    font-size: 1rem;
  }

  .sentence {
    font-size: 1.1rem;
    line-height: 2.1;
  }
  .chip {
    font: inherit;
    font-family: monospace;
    font-size: 0.9rem;
    background: #fbf3df;
    border: 1px solid #e4d3a8;
    border-radius: 6px;
    padding: 0.1rem 0.5rem;
    margin: 0 0.12rem;
    cursor: pointer;
    box-shadow: 1px 1px 0 rgba(42, 38, 32, 0.08);
  }
  .chip:hover,
  .chip.open {
    border-color: var(--color-oxblood);
    color: var(--color-oxblood);
  }

  .pop {
    border: 1px solid var(--color-line);
    background: rgba(115, 106, 92, 0.05);
    border-radius: 8px;
    padding: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .prow {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: var(--size-sm);
    flex-wrap: wrap;
  }
  .prow input[type='range'] {
    flex: 1;
    min-width: 140px;
    accent-color: var(--color-oxblood);
  }
  .prow .v {
    font-family: monospace;
    min-width: 5ch;
  }
  .grid31 {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 3px;
  }
  .grid31 button,
  .week button {
    font: inherit;
    font-size: 0.78rem;
    border: 1px solid var(--color-line);
    background: var(--color-paper);
    color: var(--color-ink);
    border-radius: 4px;
    padding: 0.25rem 0;
    cursor: pointer;
  }
  .week {
    display: flex;
    gap: 3px;
    flex-wrap: wrap;
  }
  .week button {
    flex: 1;
    min-width: 3ch;
  }
  .grid31 button.on,
  .week button.on {
    background: var(--color-ink-navy);
    color: var(--color-paper);
    border-color: var(--color-ink-navy);
  }
  .secs {
    font-size: var(--size-sm);
    color: var(--color-muted);
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }

  .result {
    border-top: 1px dashed var(--color-line);
    padding-top: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .exprline {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }
  .expr {
    font-family: monospace;
    font-size: 1.05rem;
    background: var(--color-paper);
    border: 1px solid var(--color-line);
    border-radius: 6px;
    padding: 0.25rem 0.6rem;
  }
  .badge {
    font-size: 0.7rem;
    color: var(--color-muted);
    border: 1px solid var(--color-line);
    border-radius: 999px;
    padding: 0.05rem 0.5rem;
  }
  .cp {
    font: inherit;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border: 1px solid var(--color-line);
    background: var(--color-paper);
    color: var(--color-oxblood);
    border-radius: 4px;
    padding: 0.1rem 0.4rem;
    cursor: pointer;
  }
  .eng {
    margin: 0;
    font-size: 1rem;
    color: var(--color-ink-navy);
  }
  .warn {
    margin: 0;
    font-size: var(--size-sm);
    color: var(--color-oxblood);
    border-left: 2px solid var(--color-oxblood);
    padding-left: 0.6rem;
  }
  .err {
    margin: 0;
    color: var(--color-oxblood);
    font-size: var(--size-sm);
  }

  .next {
    font-size: var(--size-sm);
  }
  .next .k {
    color: var(--color-muted);
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .next ul {
    list-style: none;
    margin: 0.3rem 0 0;
    padding: 0;
  }
  .next li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.2rem 0;
    border-bottom: 1px solid var(--color-line);
  }
  .next li:last-child {
    border: 0;
  }
  .next .loc {
    font-weight: 500;
  }
  .next .utc {
    font-family: monospace;
    color: var(--color-muted);
    white-space: nowrap;
  }
  .next .none {
    color: var(--color-oxblood);
  }

  .note {
    font-family: var(--font-hand);
    font-size: var(--size-sm);
    color: var(--color-muted);
    margin: 0.25rem 0 0;
  }
</style>
