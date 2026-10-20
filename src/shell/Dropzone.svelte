<script>
  import { createEventDispatcher, onMount } from 'svelte';
  import { take } from '../lib/handoff';
  import { looksEncrypted } from '../lib/pdf/looksEncrypted';
  import LockedPdfNotice from './LockedPdfNotice.svelte';

  const dispatch = createEventDispatcher();

  export let accept = '';
  export let rejectLocked = false;

  let lockedCount = 0;

  let isDragging = false;
  let inputElement;

  function matchesAccept(file) {
    if (!accept) return true;
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();
    return accept
      .split(',')
      .map((p) => p.trim().toLowerCase())
      .some((pattern) => {
        if (pattern.startsWith('.')) return name.endsWith(pattern);
        if (pattern.endsWith('/*')) return type.startsWith(pattern.slice(0, -1));
        return type === pattern;
      });
  }

  async function isLockedPdf(file) {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    return isPdf && looksEncrypted(new Uint8Array(await file.arrayBuffer()));
  }

  async function handleFiles(fileList) {
    const all = Array.from(fileList);
    const accepted = all.filter(matchesAccept);
    const rejected = all.filter((f) => !matchesAccept(f));
    let files = accepted;
    lockedCount = 0;
    if (rejectLocked) {
      const flags = await Promise.all(accepted.map(isLockedPdf));
      files = accepted.filter((_, i) => !flags[i]);
      lockedCount = accepted.length - files.length;
    }
    if (files.length > 0) dispatch('files', files);
    if (rejected.length > 0) dispatch('rejected', rejected);
  }

  onMount(async () => {
    const file = await take();
    if (file) handleFiles([file]);
  });

  function handleDrop(e) {
    e.preventDefault();
    isDragging = false;
    handleFiles(e.dataTransfer.files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  function handleInputChange(e) {
    handleFiles(e.target.files);
  }

  function handlePaste(e) {
    const t = e.target;
    if (
      t instanceof HTMLElement &&
      t.closest('input:not([type="file"]), textarea, [contenteditable]')
    )
      return;
    const files = e.clipboardData?.files;
    if (!files?.length) return;
    e.preventDefault();
    handleFiles(files);
  }

  function openPicker() {
    inputElement.click();
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  }
</script>

<svelte:window on:paste={handlePaste} />

<div
  class="dropzone"
  class:dragging={isDragging}
  on:click={openPicker}
  on:keydown={handleKeydown}
  on:drop={handleDrop}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  role="button"
  tabindex="0"
>
  <p>Drop files here or click to select</p>
  <input
    bind:this={inputElement}
    type="file"
    multiple
    {accept}
    on:change={handleInputChange}
    style="display: none"
  />
</div>

{#if lockedCount > 0}
  <LockedPdfNotice count={lockedCount} />
{/if}

<style>
  .dropzone {
    border: 2px dashed var(--color-line);
    border-radius: 4px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .dropzone.dragging {
    background-color: rgba(132, 51, 36, 0.05);
    border-color: var(--color-oxblood);
  }
</style>
