import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';

const zip = new JSZip();

async function addFilesFromDirectoryToZip(dirPath, zipPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    
    // Ignore build output and node_modules to keep size down
    if (file === 'node_modules' || file === 'build' || file === '.gradle' || file === 'dist' || file.endsWith('.zip')) {
      continue;
    }
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      await addFilesFromDirectoryToZip(fullPath, path.join(zipPath, file));
    } else {
      zip.file(path.join(zipPath, file).replace(/\\/g, '/'), fs.readFileSync(fullPath));
    }
  }
}

async function run() {
  console.log('Generating ZIP...');
  await addFilesFromDirectoryToZip('.', '');
  
  const content = await zip.generateAsync({ 
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });
  
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }
  
  const outputPath = 'public/vinko-app.zip';
  fs.writeFileSync(outputPath, content);
  
  console.log(`ZIP created successfully at ${outputPath} (${(content.length / 1024).toFixed(2)} KB)`);
}

run().catch(console.error);
