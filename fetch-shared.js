import fs from 'fs';

async function restore() {
  try {
    const res = await fetch('https://ais-pre-2rntdga7kyia6mooz4samr-942129210362.asia-southeast1.run.app/');
    const html = await res.text();
    console.log("HTML:", html.substring(0, 500));
    
    // Extract assets
    const assetMatches = html.match(/src="\/assets\/(.*?\.js)"/g);
    if (assetMatches) {
        for (const match of assetMatches) {
            const jsPath = match.split('"')[1];
            console.log("Found JS:", jsPath);
            const jsRes = await fetch(`https://ais-pre-2rntdga7kyia6mooz4samr-942129210362.asia-southeast1.run.app${jsPath}.map`);
            if (jsRes.ok) {
                console.log("SOURCEMAP EXISTS for", jsPath);
                fs.writeFileSync(`sourcemap-${jsPath.replace(/[/\\?%*:|"<>]/g, '-')}.json`, await jsRes.text());
                console.log("Saved sourcemap.");
            } else {
                console.log("NO sourcemap for", jsPath, jsRes.status);
            }
        }
    }
  } catch(e) {
    console.error("error", e);
  }
}
restore();
