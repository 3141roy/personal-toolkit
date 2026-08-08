export const copy = {
  empty: 'Drop photos here — as many as you want.',
  working: (done: number, total: number) => `working on your machine — ${done} of ${total}`,
  done: (count: number) => `${count} file${count !== 1 ? 's' : ''} done`,
  error: "One of those files was difficult, mind trying again?",
  errorCanvasBlocked:
    "Your browser's blocking canvas access — a fingerprinting-protection setting (Firefox Resist Fingerprinting, Brave Shields, etc). Try allowing it for this site, or a different browser.",
  button: 'Process all',
  downloadAll: 'Grab all',
  download: 'Grab',
  preview: 'Preview',
};
