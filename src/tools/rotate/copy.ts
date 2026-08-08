export const copy = {
  empty: 'Drop a photo here.',
  working: 'turning it on your machine',
  done: (before: string, after: string) => `${before} → ${after}`,
  error: "That image file's being difficult, mind trying another?",
  errorCanvasBlocked:
    "Your browser's blocking canvas access — a fingerprinting-protection setting (Firefox Resist Fingerprinting, Brave Shields, etc). Try allowing it for this site, or a different browser.",
  button: 'Rotate & keep it',
  download: 'Grab it',
};
