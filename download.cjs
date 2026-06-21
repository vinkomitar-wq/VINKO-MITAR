const fs = require('fs');
const https = require('https');

async function downloadDriveFile(fileId, filename) {
  let url = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  console.log('Fetching', url);
  
  let res = await fetch(url, { redirect: 'manual' });
  console.log('Status', res.status);
  
  if (res.status === 302 || res.status === 303) {
      url = res.headers.get('location');
      if (url.startsWith('/')) {
        url = 'https://drive.google.com' + url;
      }
      console.log('Following redirect to:', url);
      res = await fetch(url);
  }
  
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(filename, Buffer.from(buffer));
  console.log('Done, size:', buffer.byteLength);
}

downloadDriveFile('1zfvn5RyhRR1-Vwg4lNgXSKeFdIR52b-n', 'backup.zip').catch(console.error);
