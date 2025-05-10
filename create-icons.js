const fs = require('fs');
const { createCanvas } = require('canvas');
const path = require('path');

// Icon sizes based on manifest.json
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create directory if it doesn't exist
const iconDir = path.join(__dirname, 'images', 'icons');
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Generate icons for each size
sizes.forEach(size => {
  console.log(`Generating ${size}x${size} icon...`);
  
  // Create canvas with the required dimensions
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Fill background
  ctx.fillStyle = '#2196f3'; // Using the theme color from manifest
  ctx.fillRect(0, 0, size, size);
  
  // Draw upward chart
  ctx.beginPath();
  ctx.moveTo(size * 0.2, size * 0.8); // Bottom left
  ctx.lineTo(size * 0.4, size * 0.6); // First point up
  ctx.lineTo(size * 0.6, size * 0.65); // Small dip
  ctx.lineTo(size * 0.8, size * 0.3); // Final point up
  
  // Style for the chart line
  ctx.lineWidth = size * 0.06;
  ctx.strokeStyle = 'white';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  
  // Add a dot at the end of the line
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(size * 0.8, size * 0.3, size * 0.04, 0, Math.PI * 2);
  ctx.fill();
  
  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconDir, `icon-${size}x${size}.png`), buffer);
});

console.log('All icons generated successfully!');