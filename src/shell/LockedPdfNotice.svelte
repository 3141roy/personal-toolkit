<script>
  import { reportEmail, siteName } from '../config/site';

  export let count = 1;

  const path = typeof location === 'undefined' ? '' : location.pathname;
  const subject = encodeURIComponent(`${siteName} - locked PDF flagged by mistake`);
  const body = encodeURIComponent(
    `A PDF was flagged as locked, but it opens without a password.\n\nWhere it came from (optional):\n\n\nPage: ${path}\n`,
  );
  const href = `mailto:${reportEmail}?subject=${subject}&body=${body}`;
</script>

<p class="locked-notice" role="alert">
  {count === 1 ? 'That PDF is locked' : `${count} of those PDFs are locked`}, so this tool can't
  read it. <a href="/pdf/unlock-pdf/">Unlock it first</a>, then bring it back.
  <span class="wrong">Not locked? <a {href}>Tell us</a>.</span>
</p>

<style>
  .locked-notice {
    margin: 0.75rem 0 0;
    font-size: var(--size-sm);
    line-height: 1.5;
    color: var(--color-oxblood);
  }

  .locked-notice a {
    color: var(--color-oxblood);
    text-underline-offset: 2px;
  }

  .wrong {
    color: var(--color-muted);
  }
</style>
