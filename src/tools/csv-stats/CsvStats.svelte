<script>
  import VerifyNote from '../../shell/VerifyNote.svelte';
  import { copy } from './copy';
  import { csvStats } from './csvStats';

  let input = $state('');
  let stats = $derived(csvStats(input));
  let hasResult = $derived(input.trim() !== '' && stats.columns > 0);
</script>

<div class="csv-stats-tool">
  <textarea bind:value={input} placeholder={copy.placeholder} spellcheck="false"></textarea>

  {#if hasResult}
    <div class="totals">
      <div class="stat">
        <span class="value">{stats.rows}</span>
        <span class="label">{copy.rows}</span>
      </div>
      <div class="stat">
        <span class="value">{stats.columns}</span>
        <span class="label">{copy.columns}</span>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{copy.headName}</th>
            <th>{copy.headType}</th>
            <th class="num">{copy.headEmpties}</th>
            <th class="num">{copy.headUnique}</th>
          </tr>
        </thead>
        <tbody>
          {#each stats.columnStats as column}
            <tr>
              <td>{column.name}</td>
              <td>{column.type}</td>
              <td class="num">{column.empties}</td>
              <td class="num">{column.unique}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <p class="note">{copy.note}</p>
    <VerifyNote />
  {/if}

  <p class="up-next">{copy.upNext}</p>
</div>

<style>
  .csv-stats-tool {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  textarea {
    width: 100%;
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

  .totals {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 0.75rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: 4px;
    background: rgba(115, 106, 92, 0.05);
  }

  .value {
    font-family: var(--font-serif);
    font-size: 1.6rem;
    color: var(--color-ink);
  }

  .label {
    font-size: var(--size-sm);
    color: var(--color-muted);
  }

  .table-wrap {
    overflow-x: auto;
    border: 1px solid var(--color-line);
    border-radius: 4px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--size-sm);
  }

  th,
  td {
    padding: 0.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--color-line);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  th {
    font-family: var(--font-serif);
    color: var(--color-muted);
    font-weight: normal;
  }

  td {
    font-family: monospace;
    color: var(--color-ink);
  }

  .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .note {
    font-family: var(--font-hand);
    font-size: var(--size-sm);
    color: var(--color-muted);
    margin: 0;
  }

  .up-next {
    font-size: var(--size-sm);
    color: var(--color-muted);
    margin: 0;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-line);
  }
</style>
