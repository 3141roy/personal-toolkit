<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let accept = '';

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

  function handleFiles(fileList) {
    const files = Array.from(fileList).filter(matchesAccept);
    if (files.length > 0) dispatch('files', files);
  }

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
    accept={accept}
    on:change={handleInputChange}
    style="display: none"
  />
</div>

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
