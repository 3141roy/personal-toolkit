<script>
  let { originalUrl, resultUrl } = $props();
  let position = $state(50);
</script>

<div class="slider">
  <img src={originalUrl} alt="" />
  <div class="reveal" style="clip-path: inset(0 {100 - position}% 0 0)">
    <div class="checkerboard">
      <img src={resultUrl} alt="" />
    </div>
  </div>
  <div class="handle" style="left: {position}%"></div>
  <input
    type="range"
    min="0"
    max="100"
    bind:value={position}
    aria-label="Before and after comparison"
  />
</div>

<style>
  .slider {
    position: relative;
    width: 100%;
    max-width: 420px;
    margin: 0 auto;
    overflow: hidden;
    border-radius: 4px;
    border: 1px solid var(--color-line);
  }

  .slider img {
    display: block;
    width: 100%;
    height: auto;
  }

  .reveal {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .checkerboard {
    position: absolute;
    inset: 0;
    background-color: var(--color-paper);
    background-image: conic-gradient(
      var(--color-line) 90deg,
      transparent 90deg 180deg,
      var(--color-line) 180deg 270deg,
      transparent 270deg
    );
    background-size: 16px 16px;
  }

  .checkerboard img {
    display: block;
    width: 100%;
    height: 100%;
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
