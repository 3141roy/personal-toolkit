export const copy = {
  empty: "Drop a photo here — it's not going anywhere. literally.",
  working: 'crunching pixels on your machine',
  done: (before: string, after: string) => `${before} → ${after}`,
  error: "That image file's being difficult mind trying another?",
  errorCanvasBlocked:
    "Your browser's blocking canvas access — a fingerprinting-protection setting (Firefox Resist Fingerprinting, Brave Shields, etc). Try allowing it for this site, or a different browser.",
  button: 'Resize & keep it',
  download: 'Grab it',
  preview: 'Preview',
};
