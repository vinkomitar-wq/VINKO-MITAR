const fs = require('fs');
async function run() {
  let url = 'https://drive.google.com/uc?export=download&id=1zfvn5RyhRR1-Vwg4lNgXSKeFdIR52b-n';
  console.log('Fetching', url);
  let res = await fetch(url + "&confirm=t");
  console.log('Status', res.status);
  let buffer = await res.arrayBuffer();
  let text = Buffer.from(buffer).toString('utf-8');
  if (text.includes('uc-download-link') || text.includes('confirm=')) {
    console.log('Got warning page, extracting confirm link...');
    const match = text.match(/href="(\/uc\?export=download[^"]+)"/);
    if (match) {
      url = 'https://drive.google.com' + match[1].replace(/&amp;/g, '&');
      console.log('Following confirm link', url);
      res = await fetch(url);
      buffer = await res.arrayBuffer();
    } else {
        console.log('Could not find confirm link');
    }
  }
  fs.writeFileSync('./backup.zip', Buffer.from(buffer));
  console.log('Done, size:', buffer.byteLength);
}
run().catch(console.error);
