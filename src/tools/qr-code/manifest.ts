import type { ToolManifest } from '../types';

const manifest: ToolManifest = {
  id: 'qr-code',
  name: 'QR code generator',
  category: 'generate',
  icon: 'qrcode',
  summary:
    'Make a QR code for a link, Wi-Fi network, contact, email or phone number. It is a static code, so it never expires and nothing leaves your device.',
  accepts: ['text/plain'],
  produces: ['image/svg+xml', 'image/png'],
  sharedFaq: false,
  seo: {
    title: 'QR Code Generator - Wi-Fi, vCard, Link, No Expiry - Bundle',
    description:
      'Make a QR code for a link, Wi-Fi, contact, email or phone. Static, so it never expires. No sign-up, SVG or PNG download, nothing leaves your browser.',
  },
  guide: [
    {
      heading: 'How to make a QR code',
      body: 'Pick what the code should do when scanned: open a link, join Wi-Fi, save a contact, start an email or a call. Fill in the plain fields and the code updates as you type. Behind the scenes the tool writes the exact format scanners expect, such as the WIFI: string for a network or a vCard for a contact. Check it with your phone camera, then download SVG or PNG.',
    },
    {
      heading: 'Static vs dynamic QR codes',
      body: 'A static QR code stores your data inside the pattern itself. A dynamic one stores a short link owned by the generator, which then redirects to your page. Dynamic codes can be edited and tracked, but they stop working when the account lapses. Static codes need no account and no server, so they last as long as the destination does.',
    },
    {
      heading: 'Printing tips',
      body: 'Use dark dots on a light background and keep the margin around the code. Print it at least 2 cm wide, larger if people scan from a distance. Use SVG for print because it stays sharp at any size. Raise the damage tolerance if the code will be outdoors or on a curved surface.',
    },
  ],
  related: [
    { id: 'images-to-pdf', anchor: 'Put your QR code on a printable PDF' },
    { id: 'resize', anchor: 'Resize a QR code image' },
  ],
  faq: [
    {
      q: 'Will my QR code expire?',
      a: 'No. The code holds your data directly, there is no redirect through our servers, so it works as long as the thing it points to does. Many "free" generators make dynamic codes that stop working eventually.',
    },
    {
      q: 'Does it send anything anywhere?',
      a: 'No. The code is drawn in your browser. Wi-Fi passwords and contact details never leave your device, and nothing is saved, not even in your browser.',
    },
    {
      q: 'How do I make a Wi-Fi QR code?',
      a: 'Pick Wi-Fi, type the network name and password, and choose the security type (WPA covers most routers). Guests scan it with their camera and join without typing.',
    },
    {
      q: 'What does damage tolerance mean?',
      a: 'QR codes carry spare data so they still scan when partly scratched, smudged or covered. Higher tolerance survives more damage but makes a denser code. Medium suits most prints.',
    },
    {
      q: 'SVG or PNG?',
      a: 'SVG is a vector, so it stays sharp at any size and is best for print. PNG works anywhere an image does, such as slides and chats.',
    },
  ],
};

export default manifest;
