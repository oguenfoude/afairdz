const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = 'public/images/products';
const jpgFiles = ['20.jpg', '22.jpg', '23.jpg', '24.jpg', '25.jpg', 'photo_2026-10-08_20-59-48.jpg'];

async function convertAll() {
  for (const file of jpgFiles) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(inputDir, file.replace('.jpg', '.webp'));
    
    try {
      await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(outputPath);
      console.log(`Converted: ${file} -> ${file.replace('.jpg', '.webp')}`);
    } catch (err) {
      console.error(`Failed to convert ${file}:`, err.message);
    }
  }
  console.log('All conversions complete!');
}

convertAll();