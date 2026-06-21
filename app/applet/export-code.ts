import fs from 'fs';
import path from 'path';

const outputFile = 'public/source-code.txt';

function getAllTextFiles(dirPath: string, arrayOfFiles?: string[]) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git', 'android', 'public', 'assets', '.gradle', 'app'].includes(file)) {
        arrayOfFiles = getAllTextFiles(fullPath, arrayOfFiles);
      }
    } else {
      // Include typical code/text files and exclude binaries/zips/logs
      if (
        !file.endsWith('.zip') &&
        !file.endsWith('.png') &&
        !file.endsWith('.jpg') &&
        !file.endsWith('.jpeg') &&
        !file.endsWith('.svg') &&
        !file.endsWith('.ico') &&
        !file.endsWith('.lock') &&
        file !== 'package-lock.json'
      ) {
         arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

async function run() {
  const allFiles = getAllTextFiles('.');
  let allCode = '';

  for (const file of allFiles) {
    if (file.includes('export-code.ts') || file.includes('compress-vinko.js') || file.includes('compress-zip.js')) continue;
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      allCode += `\n\n================================================================================\n`;
      allCode += `File: ${file}\n`;
      allCode += `================================================================================\n\n`;
      allCode += content;
    } catch (err) {
      console.error(`Could not read ${file}`, err);
    }
  }

  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }

  fs.writeFileSync(outputFile, allCode);
  console.log(`Code exported to ${outputFile} successfully.`);
}

run().catch(console.error);
