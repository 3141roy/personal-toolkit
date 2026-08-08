<script>
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let isDragging = false;
  let inputElement;

  function handleFiles(fileList) {
    dispatch('files', Array.from(fileList));
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
