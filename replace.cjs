const fs = require('fs');

let content = fs.readFileSync('src/components/AgentReferralQrGenerator.tsx', 'utf8');

content = content.replace(/AgentReferralQrGenerator/g, 'CrewBoardingQrGenerator');
content = content.replace(/AgentReferralQrGeneratorProps/g, 'CrewBoardingQrGeneratorProps');

content = content.replace(/currentAgent\s*:\s*any;/g, 'captainProfile: any;');
content = content.replace(/profileWechatId\s*:\s*string;/g, 'profileRole: string;');
content = content.replace(/currentAgent,/g, 'captainProfile,');
content = content.replace(/profileWechatId,/g, 'profileRole,');
content = content.replace(/initialCoagentId(?:.|\n)*?\{ initialCoagentId\?: string \}\)/g, '}');

// Remove current states specific to Agent
content = content.replace(/const \[selectedCoagentId, setSelectedCoagentId\] = useState<string>\(initialCoagentId\);\n/g, '');
content = content.replace(/const selectedCoagent = currentAgent\?.coagents\?\.find.*?;\n/g, '');


content = content.replace(/let basePairingUrl =.*?;.*?;.*?\}.*?\}.*?\n/gs, '');
content = content.replace(/const \[testPairingMsg, setTestPairingMsg\] = useState\(""\);\n/g, '');

content = content.replace(/const triggerLocalTestPairing =.*?\n  };\n/gs, '');


content = content.replace(/basePairingUrl/g, 'qrPayload');

// SVG download replacements
content = content.replace(/const suffix = selectedCoagentId.*?;/g, 'const suffix = "_crew";');
content = content.replace(/const modeName = qrDisplayTab === "badge" \? "_custom_qr" : "_invite_card";/g, 'const modeName = qrDisplayTab === "badge" ? "_boarding_qr" : "_id_card";');
content = content.replace(/captainProfile\?.name \|\| "agent"/g, 'captainProfile?.name || "crew"');


// VIP Poster Card Layout Dialog Trigger replacements
content = content.replace(/Phuket Yacht Charters - Premium VIP Poster Card/g, 'Phuket Yacht Charters - Premium VIP Crew Identity Card');


// Adjust text
content = content.replace(/VIP Charter Advisor/g, 'Yacht Crew Pass');
content = content.replace(/SCAN TO LOCK BROKER WORKSPACE/g, 'SCAN TO VALIDATE MANIFEST');
content = content.replace(/Scan this QR link with your iPhone or Android camera to claim secure representative access & explore direct catamaran quotation options./g, 'Scan this QR code with the Captain Workspace tool to instantly log daily manifest roster boarding passes.');
content = content.replace(/Deep Cookie Lock System Client Pairing Poster/g, 'Crew Electronic Boarding Pass and Manifest Registry');



// Render code logic
// Replace basePairingUrl definition
content = content.replace(/\/\/ Compile Dynamic Pairing URL/g, `const qrPayload = JSON.stringify({ 
  type: "crew", 
  id: captainProfile?.uid, 
  name: profileName || captainProfile?.name, 
  role: profileRole || captainProfile?.role || 'Crew' 
});`);


content = content.replace(/const handleCopyUrl = \(\) => \{.*?\};\n/gs, `const handleCopyUrl = () => {
    navigator.clipboard.writeText(qrPayload);
    setQrCopied(true);
    setTimeout(() => setQrCopied(false), 2000);
  };\n`);


// Text modifications
content = content.replace(/<p className="text-\[10px\] text-emerald-950 mt-1.5 leading-relaxed bg-white\/50 p-2 rounded-xs">.*?(?=<\/p>)/s, `Use this tool to design your crew electronic boarding passes. You can customize the QR style and export it as an SVG vector or a VIP Poster for the Captain to scan. Share your boarding pass easily with crew members or captains.`);


// Link generation logic modifications (Mail, whatsapp, line)
content = content.replace(/const mailtoLink = .*?;/g, `const mailtoLink = \`mailto:?subject=\${encodeURIComponent("Crew Boarding Pass: " + profileName)}&body=\${encodeURIComponent("Here is my crew boarding pass payload for the manifest:\\n\\n" + qrPayload)}\`;`);

content = content.replace(/const encodeMsg = encodeURIComponent.*?;/g, `const encodeMsg = encodeURIComponent("Here is my crew boarding pass payload for the manifest:\\n\\n" + qrPayload);`);

// Remove test button block
content = content.replace(/<div className="flex flex-col sm:flex-row gap-2">.*?<button.*?triggerLocalTestPairing.*?<\/button>.*?<\/div>.*?(\{testPairingMsg[^\}]*\}[^\}]*\}|)/s, '');

// Clean any testPairingMsg logic left
content = content.replace(/\{testPairingMsg && \(\s*<div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-\[10px\] p-2\.5 rounded shadow-xs mb-4 font-medium animate-pulse flex items-start gap-2">\s*<CheckCircle2 className="h-3\.5 w-3\.5 shrink-0 mt-0\.5" \/>\s*<span>\{testPairingMsg\}<\/span>\s*<\/div>\s*\)\}/g, '');

content = content.replace(/<div className="flex flex-col sm:flex-row gap-2">.*?Test Browser Pairing Cookie lock assignment.*?<\/button>.*?<\/div>/s, '');


fs.writeFileSync('src/components/CrewBoardingQrGenerator.tsx', content);
