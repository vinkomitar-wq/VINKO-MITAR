import fs from 'fs';

const content = fs.readFileSync('src/components/AgentPortalModal.tsx', 'utf-8');
const startIndex = content.indexOf('const generateAgentPdfQuote = async');
let brackets = 0;
let endIndex = startIndex;
let started = false;

for (let i = startIndex; i < content.length; i++) {
  if (content[i] === '{') {
    started = true;
    brackets++;
  } else if (content[i] === '}') {
    brackets--;
    if (started && brackets === 0) {
      endIndex = i + 1;
      break;
    }
  }
}

const newContent = content.substring(0, startIndex) + content.substring(endIndex + 1); // remove the semicolon too if there's one? there might not be
// Actually, `content.substring(endIndex)` is enough, but wait, `generateAgentPdfQuote` was removed, we should add an import.
const withImport = newContent.replace('import QRCodeSVG', 'import { generateAgentPdfQuote } from "../utils/pdfGenerator";\nimport QRCodeSVG');
fs.writeFileSync('src/components/AgentPortalModal.tsx', withImport);
