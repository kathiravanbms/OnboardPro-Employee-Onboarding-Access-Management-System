// Dynamic High-Fidelity Mock Document SVG Generators for OnboardPro

const getPassportSVG = (name, id) => {
  const initials = (name || "EM")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="passportBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0F172A" />
        <stop offset="100%" stop-color="#1E1B4B" />
      </linearGradient>
      <linearGradient id="cardGlow" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#6366F1" stop-opacity="0.15" />
        <stop offset="100%" stop-color="#EC4899" stop-opacity="0.05" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F59E0B" />
        <stop offset="100%" stop-color="#D97706" />
      </linearGradient>
    </defs>
    
    <rect width="600" height="400" fill="url(#passportBg)" rx="16" />
    <rect width="600" height="400" fill="url(#cardGlow)" rx="16" />
    <rect x="1.5" y="1.5" width="597" height="397" rx="14.5" fill="none" stroke="#222533" stroke-width="1.5" />
    <rect x="20" y="20" width="560" height="360" rx="12" fill="none" stroke="#6366F1" stroke-width="1" stroke-dasharray="10 5" opacity="0.4" />
    
    <text x="50" y="60" fill="url(#goldGrad)" font-family="sans-serif" font-size="14" font-weight="bold" letter-spacing="2">ONBOARDPRO TRUST NETWORK</text>
    <text x="50" y="80" fill="#94A3B8" font-family="sans-serif" font-size="11" font-weight="semibold" letter-spacing="1">SECURE BIOMETRIC IDENTITY PASSPORT</text>
    
    <rect x="500" y="45" width="45" height="32" rx="4" fill="#334155" stroke="url(#goldGrad)" stroke-width="1.5" />
    <line x1="510" y1="45" x2="510" y2="77" stroke="url(#goldGrad)" stroke-width="1" />
    <line x1="535" y1="45" x2="535" y2="77" stroke="url(#goldGrad)" stroke-width="1" />
    <line x1="500" y1="61" x2="545" y2="61" stroke="url(#goldGrad)" stroke-width="1" />
    <circle cx="522" cy="61" r="5" fill="#334155" stroke="url(#goldGrad)" stroke-width="1.5" />

    <circle cx="480" cy="220" r="45" fill="none" stroke="#6366F1" stroke-width="0.75" stroke-dasharray="4 2" />
    <circle cx="480" cy="220" r="35" fill="none" stroke="#EC4899" stroke-width="0.75" />
    <path d="M 460 220 A 20 20 0 0 1 500 220" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" opacity="0.7" />
    <text x="480" y="223" fill="#F8FAFC" font-family="sans-serif" font-size="8" font-weight="bold" text-anchor="middle" letter-spacing="1" opacity="0.8">VERIFIED</text>

    <rect x="50" y="125" width="130" height="160" rx="8" fill="#13151D" stroke="#222533" stroke-width="2" />
    <circle cx="115" cy="190" r="35" fill="#312E81" stroke="#6366F1" stroke-width="1.5" />
    <text x="115" y="200" fill="#F8FAFC" font-family="sans-serif" font-size="28" font-weight="bold" text-anchor="middle">${initials}</text>
    <rect x="70" y="245" width="90" height="20" rx="4" fill="#020617" opacity="0.6" />
    <text x="115" y="258" fill="#10B981" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle">ACTIVE SCAN</text>

    <text x="210" y="145" fill="#64748B" font-family="sans-serif" font-size="9" font-weight="bold" letter-spacing="0.5">FULL NAME</text>
    <text x="210" y="165" fill="#F8FAFC" font-family="sans-serif" font-size="14" font-weight="bold">${name}</text>

    <text x="210" y="195" fill="#64748B" font-family="sans-serif" font-size="9" font-weight="bold" letter-spacing="0.5">EMPLOYEE ID NUMBER</text>
    <text x="210" y="215" fill="#6366F1" font-family="sans-serif" font-size="13" font-weight="bold" letter-spacing="1">${id}</text>

    <text x="210" y="245" fill="#64748B" font-family="sans-serif" font-size="9" font-weight="bold" letter-spacing="0.5">DOCUMENT TYPE</text>
    <text x="210" y="262" fill="#E2E8F0" font-family="sans-serif" font-size="11" font-weight="semibold">NATIONAL ID / PASSPORT</text>

    <text x="210" y="292" fill="#64748B" font-family="sans-serif" font-size="9" font-weight="bold" letter-spacing="0.5">ISSUING AUTHORITY</text>
    <text x="210" y="309" fill="#E2E8F0" font-family="sans-serif" font-size="11" font-weight="semibold">ONBOARDPRO DIGITAL AUTH SYSTEM</text>

    <rect x="50" y="325" width="500" height="42" rx="4" fill="#0D0E12" stroke="#222533" stroke-width="1" />
    
    <line x1="70" y1="333" x2="70" y2="359" stroke="#E2E8F0" stroke-width="2" />
    <line x1="74" y1="333" x2="74" y2="359" stroke="#E2E8F0" stroke-width="1" />
    <line x1="78" y1="333" x2="78" y2="359" stroke="#E2E8F0" stroke-width="4" />
    <line x1="86" y1="333" x2="86" y2="359" stroke="#E2E8F0" stroke-width="2" />
    <line x1="92" y1="333" x2="92" y2="359" stroke="#E2E8F0" stroke-width="1" />
    <line x1="96" y1="333" x2="96" y2="359" stroke="#E2E8F0" stroke-width="3" />
    <line x1="102" y1="333" x2="102" y2="359" stroke="#E2E8F0" stroke-width="1" />
    <line x1="106" y1="333" x2="106" y2="359" stroke="#E2E8F0" stroke-width="5" />
    <line x1="114" y1="333" x2="114" y2="359" stroke="#E2E8F0" stroke-width="2" />
    
    <line x1="126" y1="333" x2="126" y2="359" stroke="#E2E8F0" stroke-width="2" />
    <line x1="130" y1="333" x2="130" y2="359" stroke="#E2E8F0" stroke-width="1" />
    <line x1="134" y1="333" x2="134" y2="359" stroke="#E2E8F0" stroke-width="4" />
    <line x1="142" y1="333" x2="142" y2="359" stroke="#E2E8F0" stroke-width="2" />
    
    <text x="160" y="350" fill="#94A3B8" font-family="monospace" font-size="10" letter-spacing="3.5">P&lt;ONB&lt;&lt;${(name || "EMPLOYEE").replace(/\s+/g, "&lt;").toUpperCase()}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;${id}</text>
  </svg>`;
};

const getDegreeSVG = (name) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <defs>
      <linearGradient id="degreeBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#080A10" />
        <stop offset="100%" stop-color="#111422" />
      </linearGradient>
      <linearGradient id="goldLight" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FCD34D" />
        <stop offset="100%" stop-color="#D97706" />
      </linearGradient>
    </defs>

    <rect width="600" height="800" fill="url(#degreeBg)" rx="16" />
    <rect x="15" y="15" width="570" height="770" rx="12" fill="none" stroke="url(#goldLight)" stroke-width="2" />
    <rect x="22" y="22" width="556" height="756" rx="10" fill="none" stroke="#222533" stroke-width="1.5" />
    
    <path d="M 22 42 L 42 22 M 22 52 L 52 22" stroke="url(#goldLight)" stroke-width="1" />
    <path d="M 578 42 L 558 22 M 578 52 L 548 22" stroke="url(#goldLight)" stroke-width="1" />
    <path d="M 22 758 L 42 778 M 22 748 L 52 778" stroke="url(#goldLight)" stroke-width="1" />
    <path d="M 578 758 L 558 778 M 578 748 L 548 778" stroke="url(#goldLight)" stroke-width="1" />

    <circle cx="300" cy="120" r="45" fill="#1E293B" stroke="url(#goldLight)" stroke-width="1.5" />
    <path d="M 285 105 L 300 90 L 315 105 L 300 120 Z" fill="url(#goldLight)" />
    <rect x="290" y="125" width="20" height="15" fill="#6366F1" rx="1" />
    <path d="M 300 120 L 300 135" stroke="url(#goldLight)" stroke-width="2" />
    <path d="M 292 140 L 308 140" stroke="url(#goldLight)" stroke-width="1.5" />
    <circle cx="300" cy="120" r="35" fill="none" stroke="url(#goldLight)" stroke-width="0.75" stroke-dasharray="2 2" />

    <text x="300" y="210" fill="#94A3B8" font-family="Georgia, serif" font-size="14" font-weight="semibold" letter-spacing="3" text-anchor="middle">BOARD OF TRUSTEES OF THE</text>
    <text x="300" y="245" fill="url(#goldLight)" font-family="Georgia, serif" font-size="28" font-weight="bold" letter-spacing="1" text-anchor="middle">UNIVERSITY OF ONBOARDING</text>
    <text x="300" y="280" fill="#64748B" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="2" text-anchor="middle">ON RECOMMENDATION OF THE COLLEGE OF ENGINEERING</text>
    
    <text x="300" y="340" fill="#94A3B8" font-family="Georgia, serif" font-style="italic" font-size="16" text-anchor="middle">has conferred upon</text>
    
    <rect x="100" y="375" width="400" height="2" fill="url(#goldLight)" opacity="0.3" />
    <text x="300" y="420" fill="#F8FAFC" font-family="Georgia, serif" font-size="32" font-weight="bold" text-anchor="middle">${name}</text>
    <rect x="100" y="445" width="400" height="2" fill="url(#goldLight)" opacity="0.3" />
    
    <text x="300" y="490" fill="#94A3B8" font-family="Georgia, serif" font-style="italic" font-size="16" text-anchor="middle">the degree of</text>
    <text x="300" y="530" fill="url(#goldLight)" font-family="Georgia, serif" font-size="24" font-weight="bold" letter-spacing="0.5" text-anchor="middle">BACHELOR OF SCIENCE</text>
    <text x="300" y="560" fill="#E2E8F0" font-family="sans-serif" font-size="13" font-weight="semibold" text-anchor="middle">IN COMPUTER SCIENCE &amp; ENGINEERING</text>
    
    <text x="300" y="605" fill="#64748B" font-family="sans-serif" font-size="11" text-anchor="middle">
      with all the honors, rights, and privileges pertaining to that degree.
    </text>

    <g transform="translate(120, 680)">
      <circle cx="0" cy="0" r="42" fill="#13151D" stroke="url(#goldLight)" stroke-width="2" />
      <circle cx="0" cy="0" r="35" fill="none" stroke="url(#goldLight)" stroke-width="0.75" stroke-dasharray="4 2" />
      <polygon points="0,-25 7,-10 24,-10 11,2 16,19 0,9 -16,19 -11,2 -24,-10 -7,-10" fill="url(#goldLight)" opacity="0.8" />
      <text x="0" y="3" fill="#0D0E12" font-family="sans-serif" font-size="8" font-weight="bold" text-anchor="middle">SECURE</text>
    </g>

    <g transform="translate(380, 680)">
      <line x1="-80" y1="-10" x2="80" y2="-10" stroke="#222533" stroke-width="1.5" />
      <path d="M -60 -35 Q -30 -50 0 -35 T 60 -45" fill="none" stroke="#6366F1" stroke-width="1.5" opacity="0.7" />
      <text x="0" y="10" fill="#94A3B8" font-family="sans-serif" font-size="10" text-anchor="middle">Dean of Engineering</text>
      
      <line x1="-80" y1="35" x2="80" y2="35" stroke="#222533" stroke-width="1.5" />
      <path d="M -50 15 Q -10 0 20 20 T 50 10" fill="none" stroke="#EC4899" stroke-width="1.5" opacity="0.7" />
      <text x="0" y="55" fill="#94A3B8" font-family="sans-serif" font-size="10" text-anchor="middle">Chancellor</text>
    </g>
  </svg>`;
};

const getUtilityBillSVG = (name, address) => {
  const cleanAddress = address || "415 Market St, San Francisco, CA 94105";
  const todayStr = new Date().toISOString().slice(0, 10);
  const accountNum = "ACCT-7392-8402";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <defs>
      <linearGradient id="billBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#08090C" />
        <stop offset="100%" stop-color="#11131C" />
      </linearGradient>
      <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0D9488" />
        <stop offset="100%" stop-color="#115E59" />
      </linearGradient>
    </defs>

    <rect width="600" height="800" fill="url(#billBg)" rx="16" />
    <rect x="1.5" y="1.5" width="597" height="797" rx="14.5" fill="none" stroke="#222533" stroke-width="1.5" />
    
    <path d="M 1.5 16 A 14.5 14.5 0 0 1 16 1.5 L 584 1.5 A 14.5 14.5 0 0 1 598.5 16 L 598.5 80 L 1.5 80 Z" fill="url(#tealGrad)" />
    <text x="30" y="47" fill="#F8FAFC" font-family="sans-serif" font-size="20" font-weight="bold" letter-spacing="1">METROPOLITAN UTILITIES INC.</text>
    <text x="30" y="65" fill="#A7F3D0" font-family="sans-serif" font-size="11" font-weight="semibold" letter-spacing="1.5">RESIDENTIAL SERVICE BILLING STATEMENT</text>

    <rect x="350" y="110" width="220" height="110" rx="8" fill="#13151D" stroke="#222533" stroke-width="1.5" />
    <text x="365" y="132" fill="#64748B" font-family="sans-serif" font-size="9" font-weight="bold">STATEMENT DATE</text>
    <text x="365" y="148" fill="#F8FAFC" font-family="sans-serif" font-size="11" font-weight="semibold">${todayStr}</text>

    <text x="365" y="177" fill="#64748B" font-family="sans-serif" font-size="9" font-weight="bold">ACCOUNT NUMBER</text>
    <text x="365" y="193" fill="#0D9488" font-family="sans-serif" font-size="11" font-weight="bold">${accountNum}</text>

    <text x="30" y="130" fill="#64748B" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1">BILL TO CUSTOMER:</text>
    <text x="30" y="152" fill="#F8FAFC" font-family="sans-serif" font-size="15" font-weight="bold">${name}</text>
    <text x="30" y="178" fill="#E2E8F0" font-family="sans-serif" font-size="12" font-weight="medium">${cleanAddress}</text>

    <rect x="30" y="250" width="540" height="35" rx="4" fill="#13151D" stroke="#222533" stroke-width="1" />
    <text x="45" y="272" fill="#94A3B8" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1">SERVICE DESCRIPTION</text>
    <text x="510" y="272" fill="#94A3B8" font-family="sans-serif" font-size="10" font-weight="bold" letter-spacing="1" text-anchor="end">AMOUNT ($)</text>

    <text x="45" y="320" fill="#F8FAFC" font-family="sans-serif" font-size="12" font-weight="semibold">Residential Fiber Broadband - 1 Gbps Sync Plan</text>
    <text x="45" y="340" fill="#64748B" font-family="sans-serif" font-size="10">Billing cycle: Current Month (Unlimited Data)</text>
    <text x="510" y="320" fill="#F8FAFC" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="end">79.99</text>
    <line x1="30" y1="360" x2="570" y2="360" stroke="#1E293B" stroke-width="1" />

    <text x="45" y="390" fill="#F8FAFC" font-family="sans-serif" font-size="12" font-weight="semibold">Secure WiFi Gateway &amp; Router Rental</text>
    <text x="45" y="410" fill="#64748B" font-family="sans-serif" font-size="10">Model: METRO-GATEWAY-X900</text>
    <text x="510" y="390" fill="#F8FAFC" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="end">10.00</text>
    <line x1="30" y1="430" x2="570" y2="430" stroke="#1E293B" stroke-width="1" />

    <text x="45" y="460" fill="#F8FAFC" font-family="sans-serif" font-size="12" font-weight="semibold">Local Telecom Infrastructure Recovery Fee</text>
    <text x="510" y="460" fill="#F8FAFC" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="end">4.50</text>
    <line x1="30" y1="500" x2="570" y2="500" stroke="#1E293B" stroke-width="1.5" />

    <text x="400" y="535" fill="#94A3B8" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="end">TOTAL DUE AMOUNT:</text>
    <text x="510" y="535" fill="#10B981" font-family="sans-serif" font-size="16" font-weight="bold" text-anchor="end">$94.49</text>

    <g transform="translate(180, 620) rotate(-12)">
      <rect x="-140" y="-35" width="280" height="70" rx="10" fill="none" stroke="#10B981" stroke-width="4.5" stroke-dasharray="1000" opacity="0.85" />
      <text x="0" y="10" fill="#10B981" font-family="sans-serif" font-size="28" font-weight="black" text-anchor="middle" letter-spacing="4" opacity="0.85">PAID &amp; VERIFIED</text>
      <text x="0" y="27" fill="#10B981" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle" letter-spacing="1.5" opacity="0.85">METROPOLITAN RESIDENCE VALIDATION</text>
    </g>

    <rect x="30" y="700" width="540" height="60" rx="6" fill="#0D0E12" stroke="#222533" stroke-width="1" />
    <text x="300" y="725" fill="#64748B" font-family="sans-serif" font-size="9" text-anchor="middle">This electronic utility statement constitutes official proof of residential occupancy.</text>
    <text x="300" y="743" fill="#64748B" font-family="monospace" font-size="8" text-anchor="middle" letter-spacing="1">TX-HASH: 9a83d73b0c98f8217e1a3b8390b1e</text>
  </svg>`;
};

const getGeneralPDFSVG = (fileName) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <rect width="100%" height="100%" fill="#13151D"/>
    <rect x="40" y="40" width="520" height="720" rx="8" fill="#191C26" stroke="#222533" stroke-width="2"/>
    <path d="M450 40 L560 150 L450 150 Z" fill="#6366F1"/>
    <rect x="80" y="120" width="200" height="30" rx="4" fill="#6366F1"/>
    <rect x="80" y="200" width="440" height="15" rx="2" fill="#222533"/>
    <rect x="80" y="240" width="440" height="15" rx="2" fill="#222533"/>
    <rect x="80" y="280" width="300" height="15" rx="2" fill="#222533"/>
    <circle cx="300" cy="480" r="60" fill="#10B981" opacity="0.1"/>
    <path d="M280 480 L295 495 L325 465" stroke="#10B981" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="300" y="580" fill="#F8FAFC" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">Official PDF Document</text>
    <text x="300" y="610" fill="#94A3B8" font-family="sans-serif" font-size="14" text-anchor="middle">${fileName}</text>
  </svg>`;
};

const getGeneralImageSVG = (fileName) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="100%" height="100%" fill="#13151D"/>
    <rect x="20" y="20" width="560" height="360" rx="10" fill="#191C26" stroke="#222533" stroke-width="2"/>
    <circle cx="300" cy="150" r="50" fill="#6366F1" opacity="0.8"/>
    <text x="300" y="240" fill="#F8FAFC" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle">Image Preview</text>
    <text x="300" y="270" fill="#94A3B8" font-family="sans-serif" font-size="14" text-anchor="middle">${fileName}</text>
  </svg>`;
};

const toBase64Uri = (svgContent) => {
  try {
    // Unicode-safe base64 encoding in modern Javascript environments
    const base64 = typeof window !== 'undefined' && window.btoa 
      ? window.btoa(unescape(encodeURIComponent(svgContent)))
      : Buffer.from(svgContent).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  } catch (err) {
    console.error("Failed to base64 encode SVG", err);
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent)}`;
  }
};

export function getDocumentPreview(fileName, employeeName, employeeId, documentType, employeeAddress) {
  const normType = (documentType || "").toLowerCase().replace(/[\s_\-/]/g, "");
  const normFile = (fileName || "").toLowerCase();
  
  let svg = "";
  
  if (normType.includes("passport") || normType.includes("nationalid")) {
    svg = getPassportSVG(employeeName, employeeId);
  } else if (normType.includes("certificate") || normType.includes("education") || normType.includes("degree")) {
    svg = getDegreeSVG(employeeName);
  } else if (normType.includes("address") || normType.includes("proof")) {
    svg = getUtilityBillSVG(employeeName, employeeAddress);
  } else {
    // Fallback based on extension
    const ext = normFile.split(".").pop();
    if (["png", "jpg", "jpeg", "gif"].includes(ext)) {
      svg = getGeneralImageSVG(fileName || "image.png");
    } else {
      svg = getGeneralPDFSVG(fileName || "document.pdf");
    }
  }

  return toBase64Uri(svg);
}
