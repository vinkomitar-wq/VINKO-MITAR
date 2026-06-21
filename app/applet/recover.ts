import * as fs from 'fs';

const content = fs.readFileSync('public/source-code.txt', 'utf8');
const searchStart = "================================================================================\nFile: src/components/FastBookingSystem.tsx\n================================================================================\n";
const searchEnd = "================================================================================\nFile: src/components/FreeMap.tsx\n================================================================================";

let startIndex = content.indexOf(searchStart);
let endIndex = content.indexOf(searchEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const fileContent = content.substring(startIndex + searchStart.length, endIndex);
  fs.writeFileSync('src/components/FastBookingSystem.tsx', fileContent.trim() + '\n');
  console.log("Successfully recreated FastBookingSystem.tsx");
} else {
  console.log("Could not find delimiters.");
}
