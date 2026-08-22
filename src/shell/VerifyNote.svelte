<script>
  import { reportEmail, siteName } from '../config/site';
  import { sharedCopy } from '../lib/copy/shared';

  const path = typeof location === 'undefined' ? '' : location.pathname;
  const subject = encodeURIComponent(`${siteName} - bug report`);
  const body = encodeURIComponent(`What happened:\n\n\nPage: ${path}\n`);
  const href = `mailto:${reportEmail}?subject=${subject}&body=${body}`;
</script>

<p class="verify">
  {sharedCopy.verify}
  <a href="/terms">{sharedCopy.verifyTerms}</a>
  <span class="dot">·</span>
  <a {href}>{sharedCopy.verifyReport}</a>
</p>

<style>
  .verify {
    margin: 0.85rem 0 0;
    padding-top: 0.6rem;
    border-top: 1px dashed var(--color-line);
    font-size: var(--size-sm);
    line-height: 1.5;
    color: var(--color-muted);
  }

  .verify a {
    color: var(--color-oxblood);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  .dot {
    opacity: 0.5;
  }
</style>
