export const copy = {
  empty: "Drop a photo here — it's not going anywhere. literally.",
  working: 'crunching pixels on your machine',
  done: (before: string, after: string) => `${before} → ${after}`,
  error: "That image file's being difficult mind trying another?",
  errorCanvasBlocked:
    "Your browser's blocking canvas image access — probably a fingerprinting-protection setting (Firefox's Resist Fingerprinting, Brave's Shields, or similar). This tool needs that access to resize locally, so there's no way around it from our end — and honestly, we wouldn't want to bypass your privacy settings even if we could. Try allowing canvas access for this site, or use a different browser for this one.",
  button: 'Resize & keep it',
  download: 'Grab it',
};
