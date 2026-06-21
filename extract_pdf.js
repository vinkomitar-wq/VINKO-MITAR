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

const functionCode = content.substring(startIndex, endIndex) + ';';
console.log(`Extracted function length: ${functionCode.length}`);
fs.writeFileSync('src/utils/pdfGenerator.ts', `import { jsPDF } from "jspdf";\nimport { CATAMARANS } from "../data";\n\nexport ${functionCode.replace('const generateAgentPdfQuote = async (proposal: any, returnBlob = false)', 'const generateAgentPdfQuote = async (proposal: any, currentAgent: any, returnBlob = false)')}`);
