const fs = require('fs');
let txt = fs.readFileSync('src/components/ExcursionMap.tsx', 'utf8');

txt = txt.replace('highlights?: string[];\n}', 'highlights?: string[];\n  imageUrl?: string;\n}');

const re = /highlights:\s*\[([\s\S]*?)\]\n\s*\}/g;
txt = txt.replace(re, (match, p1, offset, string) => {
  const segment = string.substring(Math.max(0, offset - 600), offset);
  const idMatch = segment.match(/id:\s*["']([^"']+)["']/);
  if (idMatch) {
    const dId = idMatch[1];
    return `highlights: [${p1}],\n        imageUrl: DESTINATIONS.find(d => d.id === '${dId}')?.imageUrl\n      }`;
  }
  return match;
});

const panelRe = /<p className=\"text-\\[11px\\] text-slate-600 leading-relaxed mt-2.5 font-sans\">\s*\{selectedItem\.description\}\s*<\/p>\s*<\/div>/;
txt = txt.replace(panelRe, 
`<p className="text-[11px] text-slate-600 leading-relaxed mt-2.5 font-sans">
                {selectedItem.description}
              </p>
              {selectedItem.imageUrl && (
                <div className="mt-4 w-full h-32 rounded-sm overflow-hidden bg-slate-200 border border-slate-300">
                  <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-full h-full object-cover" />
                </div>
              )}
            </div>`);

fs.writeFileSync('src/components/ExcursionMap.tsx', txt);
