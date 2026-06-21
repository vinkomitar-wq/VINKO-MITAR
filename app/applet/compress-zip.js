import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import Jimp from 'jimp';

const zip = new JSZip();

async function processFile(fullPath, zipPath) {
  if (fullPath.endsWith('.png') || fullPath.endsWith('.jpg') || fullPath.endsWith('.jpeg')) {
    const stat = fs.statSync(fullPath);
    if (stat.size > 50000) { // Compress images larger than 50KB
      try {
        console.log(`Compressing image ${fullPath} (${stat.size} bytes)`);
        const image = await Jimp.read(fullPath);
        // Resize down to max 800px width/height and reduce quality
        if (image.bitmap.width > 800 || image.bitmap.height > 800) {
          image.scaleToFit(800, 800);
        }
        image.quality(60);
        const buffer = await image.getBufferAsync(fullPath.endsWith('.png') ? Jimp.MIME_PNG : Jimp.MIME_JPEG);
        zip.file(zipPath.replace(/\\/g, '/'), buffer);
        return;
      } catch (err) {
        console.error(`Failed to compress ${fullPath}:`, err.message);
      }
    }
  }
  zip.file(zipPath.replace(/\\/g, '/'), fs.readFileSync(fullPath));
}

async function addFilesFromDirectoryToZip(dirPath, zipPath, ignoreDirs) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (file.startsWith('.') && file !== '.env.example' && file !== '.gitignore') continue; 
    const fullPath = path.join(dirPath, file);
    
    if (ignoreDirs.some(ignore => file === ignore || fullPath.includes(`/${ignore}/`))) {
      continue;
    }
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'dist' && file !== 'android' && file !== 'ios' && file !== 'public') {
          await addFilesFromDirectoryToZip(fullPath, path.join(zipPath, file), ignoreDirs);
      }
    } else {
      if (file !== 'zip-script.js' && file !== 'github-export.zip') {
        await processFile(fullPath, path.join(zipPath, file));
      }
    }
  }
}

async function run() {
  console.log('Generating compressed ZIP...');
  await addFilesFromDirectoryToZip('.', '.', ['node_modules', 'dist', 'android', 'ios', 'package-lock.json']);
  
  const content = await zip.generateAsync({ 
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
  
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }
  fs.writeFileSync('public/github-export-compressed.zip', content);
  console.log(`ZIP created successfully at public/github-export-compressed.zip (${(content.length / 1024).toFixed(2)} KB)`);
}

run().catch(console.error);
