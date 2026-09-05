<script>
  import { copy } from './copy';
  import { compareText, toSideBySideRows, toUnifiedPatch } from './textDiff';

  let before = $state('');
  let after = $state('');
  let viewMode = $state('side-by-side');
  let ignoreWhitespace = $state(false);
  let ignoreCase = $state(false);
  let copied = $state(false);

  let diff = $derived(
    before || after ? compareText(before, after, { ignoreWhitespace, ignoreCase }) : [],
  );
  let rows = $derived(viewMode === 'side-by-side' ? toSideBySideRows(diff) : []);
  let hasChanges = $derived(diff.some((line) => line.type !== 'unchanged'));
  let addedCount = $derived(diff.filter((line) => line.type === 'added').length);
  let removedCount = $derived(diff.filter((line) => line.type === 'removed').length);

  function renderText(line) {
    return line?.text ?? '';
  }

  async function handleCopy() {
    if (!hasChanges) return;
    await navigator.clipboard.writeText(toUnifiedPatch(diff));
    copied = true;
    setTimeout(() => {
      copied = false;
    }, 1500);
  }

  function handleDownload() {
    if (!hasChanges) return;
    const blob = new Blob([toUnifiedPatch(diff)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diff.txt';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="text-diff-tool">
  <div class="inputs">
    <label class="input-label">
      {copy.beforeLabel}
      <textarea bind:value={before} placeholder={copy.beforePlaceholder} spellcheck="false"
      ></textarea>
    </label>
    <label class="input-label">
      {copy.afterLabel}
      <textarea bind:value={after} placeholder={copy.afterPlaceholder} spellcheck="false"
      ></textarea>
    </label>
  </div>

  {#if before || after}
    <div class="toolbar">
      <div class="view-toggle" role="tablist">
        <button
          type="button"
          class:active={viewMode === 'side-by-side'}
          onclick={() => (viewMode = 'side-by-side')}>{copy.sideBySideLabel}</button
        >
        <button
          type="button"
          class:active={viewMode === 'unified'}
          onclick={() => (viewMode = 'unified')}>{copy.unifiedLabel}</button
        >
      </div>

      <label class="checkbox">
        <input type="checkbox" bind:checked={ignoreWhitespace} />
        {copy.ignoreWhitespaceLabel}
      </label>
      <label class="checkbox">
        <input type="checkbox" bind:checked={ignoreCase} />
        {copy.ignoreCaseLabel}
      </label>

      {#if hasChanges}
        <span class="stats">{copy.stats(addedCount, removedCount)}</span>
        <button type="button" onclick={handleCopy}>{copied ? copy.copied : copy.copyButton}</button>
        <button type="button" onclick={handleDownload}>{copy.downloadButton}</button>
      {/if}
    </div>

    {#if !hasChanges}
      <p class="same">{copy.same}</p>
    {:else if viewMode === 'unified'}
      <div class="diff unified">
        {#each diff as line, i (i)}
          <div
            class="diff-line"
            class:added={line.type === 'added'}
            class:removed={line.type === 'removed'}
          >
            <span class="line-num before">{line.beforeLine ?? ''}</span>
            <span class="line-num after">{line.afterLine ?? ''}</span>
            <span class="marker"
              >{line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ''}</span
            >
            <span class="text">
              {#if line.segments}
                {#each line.segments as segment, j (j)}
                  <span class:changed={segment.changed}>{segment.value}</span>
                {/each}
              {:else}
                {line.text}
              {/if}
            </span>
          </div>
        {/each}
      </div>
    {:else}
      <div class="diff side-by-side">
        {#each rows as row, i (i)}
          <span class="line-num">{row.left?.beforeLine ?? ''}</span>
          <span class="cell" class:removed={row.left?.type === 'removed'} class:empty={!row.left}>
            {#if row.left?.segments}
              {#each row.left.segments as segment, j (j)}
                <span class:changed={segment.changed}>{segment.value}</span>
              {/each}
            {:else}
              {renderText(row.left)}
            {/if}
          </span>
          <span class="line-num">{row.right?.afterLine ?? ''}</span>
          <span class="cell" class:added={row.right?.type === 'added'} class:empty={!row.right}>
            {#if row.right?.segments}
              {#each row.right.segments as segment, j (j)}
                <span class:changed={segment.changed}>{segment.value}</span>
              {/each}
            {:else}
              {renderText(row.right)}
            {/if}
          </span>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .text-diff-tool {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  @media (max-width: 640px) {
    .inputs {
      grid-template-columns: 1fr;
    }
  }

  .input-label {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    font-size: var(--size-sm);
    color: var(--color-muted);
  }

  textarea {
    font-family: monospace;
    font-size: var(--size-sm);
    padding: 0.75rem;
    min-height: 200px;
    resize: vertical;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: var(--color-paper);
    color: var(--color-ink);
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    font-size: var(--size-sm);
  }

  .view-toggle {
    display: flex;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    overflow: hidden;
  }

  .view-toggle button {
    border: none;
    border-radius: 0;
    background: var(--color-paper);
    color: var(--color-muted);
    padding: 0.4rem 0.7rem;
  }

  .view-toggle button.active {
    background: var(--color-ink);
    color: var(--color-paper);
  }

  .checkbox {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--color-muted);
    cursor: pointer;
  }

  .stats {
    margin-left: auto;
    color: var(--color-muted);
    font-family: var(--font-hand);
    font-size: 1.05rem;
  }

  .same {
    font-family: var(--font-hand);
    font-size: 1.05rem;
    color: var(--color-muted);
    margin: 0;
  }

  .diff {
    font-family: monospace;
    font-size: var(--size-sm);
    border: 1px solid var(--color-line);
    border-radius: 4px;
    overflow-x: auto;
  }

  .diff.unified .diff-line {
    display: flex;
    gap: 0.5rem;
    padding: 0.15rem 0.6rem;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .diff.unified .diff-line.removed {
    background: rgba(138, 51, 36, 0.08);
  }

  .diff.unified .diff-line.added {
    background: rgba(40, 59, 73, 0.08);
  }

  .line-num {
    flex-shrink: 0;
    width: 2.2em;
    text-align: right;
    color: var(--color-muted);
    opacity: 0.6;
  }

  .marker {
    flex-shrink: 0;
    width: 1em;
    color: var(--color-muted);
  }

  .removed .marker {
    color: var(--color-oxblood);
  }

  .added .marker {
    color: var(--color-ink-navy);
  }

  .diff.side-by-side {
    display: grid;
    grid-template-columns: auto 1fr auto 1fr;
  }

  .diff.side-by-side .line-num {
    padding: 0.15rem 0.4rem;
    border-right: 1px solid var(--color-line);
  }

  .diff.side-by-side .cell {
    padding: 0.15rem 0.6rem;
    white-space: pre-wrap;
    word-break: break-word;
    border-right: 1px solid var(--color-line);
  }

  .diff.side-by-side .cell.removed {
    background: rgba(138, 51, 36, 0.08);
  }

  .diff.side-by-side .cell.added {
    background: rgba(40, 59, 73, 0.08);
  }

  .diff.side-by-side .cell.empty {
    background: var(--color-line);
    opacity: 0.25;
  }

  .removed .text :global(.changed),
  .cell.removed :global(.changed) {
    background: rgba(138, 51, 36, 0.25);
    border-radius: 2px;
  }

  .added .text :global(.changed),
  .cell.added :global(.changed) {
    background: rgba(40, 59, 73, 0.25);
    border-radius: 2px;
  }
</style>
