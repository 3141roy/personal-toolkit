export const copy = {
  empty: 'Drop a photo here.',
  working: 'converting on your machine',
  done: (format: string) => `converted to ${format}`,
  error: "That image file's being difficult, mind trying another?",
  errorCanvasBlocked:
    "Your browser's blocking canvas access — a fingerprinting-protection setting (Firefox Resist Fingerprinting, Brave Shields, etc). Try allowing it for this site, or a different browser.",
  button: 'Convert & keep it',
  download: 'Grab it',
  preview: 'Preview',
};
