<script>
  let { src, resultUrl = null, checker = false, transform = '', name = '', onreset } = $props();
  let position = $state(50);
</script>

<div class="stage">
  <div class="bar">
    <span class="name">{name}</span>
    <button type="button" class="change" onclick={onreset}>Change image</button>
  </div>

  <div class="frame">
    <img class="base" {src} alt="" style:transform={resultUrl ? '' : transform} />
    {#if resultUrl}
      <div class="reveal" style="clip-path: inset(0 {100 - position}% 0 0)">
        <div class="layer" class:checker>
          <img src={resultUrl} alt="" />
        </div>
      </div>
      <div class="handle" style="left: {position}%"></div>
      <span class="tag left">After</span>
      <span class="tag right">Before</span>
      <input
        type="range"
        min="0"
        max="100"
        bind:value={position}
        aria-label="Before and after comparison"
      />
    {/if}
  </div>
</div>

<style>
  .stage {
    max-width: 480px;
    margin: 1rem auto;
    padding: 0.75rem;
    border: 1px solid var(--color-line);
    border-radius: 6px;
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.6rem;
  }

  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: var(--size-sm);
    color: var(--color-muted);
  }

  .change {
    flex-shrink: 0;
    padding: 0.3rem 0.7rem;
    font-size: var(--size-sm);
  }

  .frame {
    position: relative;
    width: fit-content;
    max-width: 100%;
    margin: 0 auto;
    overflow: hidden;
    border-radius: 4px;
    background: rgba(115, 106, 92, 0.05);
  }

  .base {
    display: block;
    max-width: 100%;
    max-height: 320px;
    transition: transform 0.2s;
  }

  .reveal,
  .layer {
    position: absolute;
    inset: 0;
  }

  .reveal {
    overflow: hidden;
  }

  .layer img {
    display: block;
    width: 100%;
    height: 100%;
  }

  .layer.checker {
    background-color: var(--color-paper);
    background-image: conic-gradient(
      var(--color-line) 90deg,
      transparent 90deg 180deg,
      var(--color-line) 180deg 270deg,
      transparent 270deg
    );
    background-size: 16px 16px;
  }

  .handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--color-oxblood);
    pointer-events: none;
    transform: translateX(-1px);
  }

  .tag {
    position: absolute;
    bottom: 0.4rem;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    font-size: 0.7rem;
    pointer-events: none;
  }

  .tag.left {
    left: 0.4rem;
  }

  .tag.right {
    right: 0.4rem;
  }

  input[type='range'] {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    opacity: 0;
    cursor: ew-resize;
  }
</style>
