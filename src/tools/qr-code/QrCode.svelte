<script>
  import VerifyNote from '../../shell/VerifyNote.svelte';
  import { copy } from './copy';
  import { buildPayload, check, colourWarning, makeQr, renderSvg } from './qr';

  const kinds = ['link', 'text', 'wifi', 'contact', 'email', 'phone'];

  let kind = $state('link');
  let url = $state('');
  let text = $state('');
  let wifi = $state({ ssid: '', password: '', security: 'WPA', hidden: false });
  let showPassword = $state(false);
  let contact = $state({
    firstName: '',
    lastName: '',
    org: '',
    title: '',
    phone: '',
    email: '',
    website: '',
    address: '',
  });
  let mail = $state({ to: '', subject: '', body: '' });
  let number = $state('');

  let ecc = $state('M');
  let fg = $state('#2a2620');
  let bg = $state('#ffffff');
  let transparent = $state(false);
  let quiet = $state(true);
  let pngPx = $state(1024);

  let input = $derived.by(() => {
    if (kind === 'link') return { kind, url };
    if (kind === 'text') return { kind, text };
    if (kind === 'wifi') return { kind, ...wifi };
    if (kind === 'contact') return { kind, ...contact };
    if (kind === 'email') return { kind, ...mail };
    return { kind, number };
  });
  let missing = $derived(check(input));
  let payload = $derived(buildPayload(input));
  let qr = $derived(makeQr(payload, ecc));
  let quietModules = $derived(quiet ? 4 : 0);
  let fill = $derived(transparent ? null : bg);
  let svg = $derived(qr ? renderSvg(qr, { fg, bg: fill, quiet: quietModules }) : '');
  let warning = $derived(transparent ? null : colourWarning(fg, bg));
  let tooLong = $derived(Boolean(payload) && !qr);

  function save(blob, name) {
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  }

  function downloadSvg() {
    const out = renderSvg(qr, { fg, bg: fill, quiet: quietModules, px: 1024 });
    save(new Blob([out], { type: 'image/svg+xml' }), `qr-${kind}.svg`);
  }

  function downloadPng() {
    const dim = qr.size + quietModules * 2;
    const scale = Math.max(1, Math.floor(pngPx / dim));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = dim * scale;
    const ctx = canvas.getContext('2d');
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = fg;
    qr.data.forEach((row, y) =>
      row.forEach((on, x) => {
        if (on) ctx.fillRect((x + quietModules) * scale, (y + quietModules) * scale, scale, scale);
      }),
    );
    canvas.toBlob((blob) => blob && save(blob, `qr-${kind}.png`), 'image/png');
  }
</script>

<div class="qr-tool">
  <section>
    <h2 class="step">{copy.pickType}</h2>
    <div class="kinds" role="group" aria-label={copy.pickType}>
      {#each kinds as k (k)}
        <button
          class="kind"
          class:on={kind === k}
          aria-pressed={kind === k}
          onclick={() => (kind = k)}
        >
          <span class="kl">{copy.types[k].label}</span>
          <span class="kh">{copy.types[k].hint}</span>
        </button>
      {/each}
    </div>
  </section>

  <div class="cols">
    <section class="form">
      {#if kind === 'link'}
        <label>
          <span>{copy.fields.url.label}</span>
          <input
            bind:value={url}
            placeholder={copy.fields.url.placeholder}
            inputmode="url"
            autocomplete="off"
            spellcheck="false"
          />
        </label>
      {:else if kind === 'text'}
        <label>
          <span>{copy.fields.text.label}</span>
          <textarea bind:value={text} rows="4" placeholder={copy.fields.text.placeholder}
          ></textarea>
        </label>
      {:else if kind === 'wifi'}
        <label>
          <span>{copy.fields.ssid.label}</span>
          <input
            bind:value={wifi.ssid}
            placeholder={copy.fields.ssid.placeholder}
            autocomplete="off"
            spellcheck="false"
          />
        </label>
        <label>
          <span>{copy.fields.security.label}</span>
          <select bind:value={wifi.security}>
            {#each Object.entries(copy.security) as [value, label] (value)}
              <option {value}>{label}</option>
            {/each}
          </select>
        </label>
        {#if wifi.security !== 'nopass'}
          <label>
            <span>{copy.fields.password.label}</span>
            <span class="pw">
              <input
                bind:value={wifi.password}
                type={showPassword ? 'text' : 'password'}
                placeholder={copy.fields.password.placeholder}
                autocomplete="off"
                spellcheck="false"
              />
              <button type="button" class="tiny" onclick={() => (showPassword = !showPassword)}>
                {showPassword ? copy.fields.hide : copy.fields.show}
              </button>
            </span>
          </label>
        {/if}
        <label class="check">
          <input type="checkbox" bind:checked={wifi.hidden} />
          <span>{copy.fields.hidden}</span>
        </label>
      {:else if kind === 'contact'}
        <div class="grid2">
          <label>
            <span>{copy.fields.firstName.label}</span>
            <input bind:value={contact.firstName} autocomplete="off" />
          </label>
          <label>
            <span>{copy.fields.lastName.label}</span>
            <input bind:value={contact.lastName} autocomplete="off" />
          </label>
          <label>
            <span>{copy.fields.org.label}</span>
            <input bind:value={contact.org} autocomplete="off" />
          </label>
          <label>
            <span>{copy.fields.title.label}</span>
            <input bind:value={contact.title} autocomplete="off" />
          </label>
          <label>
            <span>{copy.fields.phone.label}</span>
            <input
              bind:value={contact.phone}
              placeholder={copy.fields.phone.placeholder}
              inputmode="tel"
              autocomplete="off"
            />
          </label>
          <label>
            <span>{copy.fields.email.label}</span>
            <input
              bind:value={contact.email}
              placeholder={copy.fields.email.placeholder}
              inputmode="email"
              autocomplete="off"
            />
          </label>
        </div>
        <label>
          <span>{copy.fields.website.label}</span>
          <input
            bind:value={contact.website}
            placeholder={copy.fields.website.placeholder}
            inputmode="url"
            autocomplete="off"
          />
        </label>
        <label>
          <span>{copy.fields.address.label}</span>
          <input bind:value={contact.address} autocomplete="off" />
        </label>
      {:else if kind === 'email'}
        <label>
          <span>{copy.fields.to.label}</span>
          <input
            bind:value={mail.to}
            placeholder={copy.fields.to.placeholder}
            inputmode="email"
            autocomplete="off"
          />
        </label>
        <label>
          <span>{copy.fields.subject.label}</span>
          <input bind:value={mail.subject} autocomplete="off" />
        </label>
        <label>
          <span>{copy.fields.body.label}</span>
          <textarea bind:value={mail.body} rows="3"></textarea>
        </label>
      {:else}
        <label>
          <span>{copy.fields.number.label}</span>
          <input
            bind:value={number}
            placeholder={copy.fields.number.placeholder}
            inputmode="tel"
            autocomplete="off"
          />
        </label>
      {/if}

      <details class="style">
        <summary>{copy.style}</summary>
        <div class="grid2">
          <label>
            <span>{copy.ecc.label}</span>
            <select bind:value={ecc}>
              {#each ['L', 'M', 'Q', 'H'] as level (level)}
                <option value={level}>{copy.ecc[level]}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>{copy.size}</span>
            <select bind:value={pngPx}>
              {#each Object.entries(copy.sizes) as [value, label] (value)}
                <option value={Number(value)}>{label}</option>
              {/each}
            </select>
          </label>
          <label>
            <span>{copy.fg}</span>
            <input type="color" bind:value={fg} />
          </label>
          <label>
            <span>{copy.bg}</span>
            <input type="color" bind:value={bg} disabled={transparent} />
          </label>
        </div>
        <label class="check">
          <input type="checkbox" bind:checked={transparent} />
          <span>{copy.transparent}</span>
        </label>
        <label class="check">
          <input type="checkbox" bind:checked={quiet} />
          <span>{copy.margin}</span>
        </label>
      </details>
    </section>

    <section class="out">
      <div class="preview" class:blank={!svg}>
        {#if svg}
          {@html svg}
        {:else if tooLong}
          <p class="msg err">{copy.tooLong}</p>
        {:else if missing}
          <p class="msg">{copy.missing[missing]}</p>
        {:else}
          <p class="msg">{copy.empty}</p>
        {/if}
      </div>

      {#if warning}
        <p class="warn">{copy.warn[warning]}</p>
      {/if}

      <div class="actions">
        <button class="primary" disabled={!qr} onclick={downloadSvg}>{copy.svg}</button>
        <button disabled={!qr} onclick={downloadPng}>{copy.png}</button>
      </div>

      {#if qr}
        <details class="inside">
          <summary>{copy.inside}</summary>
          <pre>{payload}</pre>
        </details>
      {/if}

      <p class="note">{copy.note}</p>
    </section>
  </div>

  <p class="fine">{copy.noExpiry}</p>
  <VerifyNote />
</div>

<style>
  .qr-tool {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  .step {
    margin: 0 0 0.5rem;
    font-family: var(--font-serif);
    font-size: var(--size-base);
    font-weight: 600;
  }

  .kinds {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 0.5rem;
  }
  .kind {
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
  .kind:hover {
    border-color: var(--color-oxblood);
  }
  .kind.on {
    border-color: var(--color-oxblood);
    box-shadow: 2px 3px 0 rgba(138, 51, 36, 0.18);
  }
  .kl {
    font-weight: 600;
    font-size: var(--size-sm);
  }
  .kh {
    font-size: 0.72rem;
    color: var(--color-muted);
  }

  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 340px);
    gap: 1.5rem;
    align-items: start;
  }
  @media (max-width: 760px) {
    .cols {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: var(--size-sm);
  }
  label > span:first-child {
    color: var(--color-muted);
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  input:not([type='checkbox']):not([type='color']),
  textarea,
  select {
    font: inherit;
    font-size: var(--size-sm);
    border: 1px solid var(--color-line);
    border-radius: 6px;
    padding: 0.5rem 0.7rem;
    background: var(--color-paper);
    color: var(--color-ink);
    min-width: 0;
  }
  input:focus-visible,
  textarea:focus-visible,
  select:focus-visible {
    outline: 2px solid var(--color-ink-navy);
    outline-offset: 1px;
  }
  textarea {
    resize: vertical;
  }
  input[type='color'] {
    width: 100%;
    height: 2.3rem;
    padding: 0.15rem;
    border: 1px solid var(--color-line);
    border-radius: 6px;
    background: var(--color-paper);
    cursor: pointer;
  }
  input[type='color']:disabled {
    opacity: 0.4;
    cursor: default;
  }

  .grid2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;
  }
  @media (max-width: 480px) {
    .grid2 {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .check {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    color: var(--color-ink);
  }
  .check span {
    text-transform: none;
    letter-spacing: 0;
    font-size: var(--size-sm);
    color: var(--color-ink);
  }

  .pw {
    display: flex;
    gap: 0.4rem;
  }
  .pw input {
    flex: 1;
  }
  .tiny {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border: 1px solid var(--color-line);
    background: var(--color-paper);
    color: var(--color-oxblood);
    border-radius: 6px;
    padding: 0 0.6rem;
    cursor: pointer;
  }

  .style {
    border-top: 1px dashed var(--color-line);
    padding-top: 0.7rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
  .style[open] {
    gap: 0.8rem;
  }
  summary {
    cursor: pointer;
    font-size: var(--size-sm);
    color: var(--color-muted);
  }
  summary:hover {
    color: var(--color-oxblood);
  }
  .style > :global(*:not(summary)) {
    margin-top: 0.8rem;
  }

  .out {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }
  .preview {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    border: 1px solid var(--color-line);
    border-radius: 8px;
    background: var(--color-paper);
    box-shadow: 2px 3px 0 rgba(42, 38, 32, 0.05);
    padding: 0.75rem;
    overflow: hidden;
  }
  .preview.blank {
    border-style: dashed;
    background: rgba(115, 106, 92, 0.05);
  }
  .preview :global(svg) {
    width: 100%;
    height: 100%;
  }
  .msg {
    margin: 0;
    text-align: center;
    color: var(--color-muted);
    font-size: var(--size-sm);
    padding: 0 1rem;
  }
  .msg.err,
  .warn {
    color: var(--color-oxblood);
  }
  .warn {
    margin: 0;
    font-size: var(--size-sm);
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .actions button {
    flex: 1 1 140px;
    font: inherit;
    font-size: var(--size-sm);
    padding: 0.6rem 0.9rem;
    border: 1px solid var(--color-line);
    border-radius: 6px;
    background: var(--color-paper);
    color: var(--color-ink);
    cursor: pointer;
  }
  .actions .primary {
    background: var(--color-oxblood);
    border-color: var(--color-oxblood);
    color: #fff;
  }
  .actions button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  .actions button:hover:not(:disabled) {
    filter: brightness(1.08);
  }

  .inside pre {
    margin: 0.5rem 0 0;
    padding: 0.6rem 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: 6px;
    background: rgba(115, 106, 92, 0.05);
    font-size: 0.75rem;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 160px;
    overflow: auto;
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
