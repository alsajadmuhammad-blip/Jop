// Placeholder icon for PWA. Replace with your real logo for production.
import fs from 'fs';
import { createCanvas } from 'canvas';

const sizes = [192, 512];
const color = '#2563eb';

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#fff';
  ctx.font = `${size * 0.5}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('م', size / 2, size / 2 + size * 0.08);
  fs.writeFileSync(`public/icons/icon-${size}x${size}.png`, canvas.toBuffer('image/png'));
});
