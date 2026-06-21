# Custom Coding Agent Instructions: Phuket Yacht Charters & Broker CRM

These instructions are automatically loaded by the AI Coding Agent on every turn. Feel free to modify, expand, or add new design tenets, preferred technologies, or custom behavior guidelines for this workspace.

---

## 1. Project Context & Objectives
- **Domain**: Premium Private Yacht and Catamaran Charters in Phuket, Thailand.
- **Audience**: High-Net-Worth Individuals (HNWIs), global tourists, premium agencies, and broker partners.
- **Goal**: Provide a highly immersive, multi-lingual booking/workspace dashboard that effortlessly bridges guest inquiries with expert brokers.

---

## 2. Core Functional Safeguards
- **Deep Cookie Lock**: Protect and maintain the client-to-agent cookie assignment logic. Scanning a broker's permanent referral link or custom QR code must permanently assign subsequent client proposals, message logs, and inquiries specifically to that broker.
- **Interactive Multi-Agent (Co-Agents) system**: Retain support for master brokers (Vinko) to register sub-brokers (co-agents) with distinct tracking tags.
- **Shareable VIP QR Cards**: Protect the custom vector SVG QR card designer. Maintain preset palette structures (Emerald, Navy, Charcoal, Sunset), greeting headers, and high-resolution SVG download attachments.
- **Passenger Manifests**: Preserve the boarding authentication framework and CSV exporter functionality under the Admin dashboard, allowing manifest filtering by custom dates.

---

## 3. Technology & Styling Standards
- **Component Design**: Multi-module React components using Vite and TypeScript. Keep code clean and segmented.
- **Styling**: Direct Tailwind utility classes with a clear focus on the default executive dark slate and emerald tones. Avoid flashy multi-gradient "AI slop" or simulated infrastructure data.
- **Typography**: Paired display typefaces (Inter and elegant display layouts) utilizing spacious padding, deep borders, and sophisticated styling.
- **Icons**: Always import icons directly from `lucide-react`.
