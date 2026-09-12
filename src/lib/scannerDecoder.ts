/**
 * Utility to decode and normalize input from USB Barcode/QR scanners 
 * that are configured in QWERTY but typing into an AZERTY (French) system layout.
 */
export function isLikelyScannerMismatch(input: string): boolean {
  if (!input) return false;
  const val = input.toLowerCase().trim();
  
  // 1. Matches common scanner prefix mismatches
  if (
    val.includes('nd?)') || 
    val.includes('nd,)') || 
    val.includes('ndm)') || 
    val.includes('nd?') || 
    val.includes('nd,') ||
    val.startsWith('?') ||
    val.startsWith(')')
  ) {
    return true;
  }
  
  // 2. Matches long sequences of unshifted AZERTY number-row characters (gibberish for typed names)
  // e.g., ààééè, &"', etc.
  const scannerPattern = /[&é"'(è_çà\)\?,]{2,}/;
  if (scannerPattern.test(val)) {
    return true;
  }
  
  return false;
}

/**
 * Internal helper to decode AZERTY scanner artifacts.
 * Separated from the main export to prevent infinite recursion.
 */
function _internalDecode(input: string): string {
  if (!input) return '';
  let clean = input.trim();

  // 1. Handle Double/Repeated Scans (sometimes scanners bounce or duplicate input)
  if (clean.length > 15) {
    const half = Math.floor(clean.length / 2);
    const firstHalf = clean.substring(0, half);
    const secondHalf = clean.substring(half);
    if (firstHalf.toLowerCase() === secondHalf.toLowerCase()) {
      clean = firstHalf;
    }
  }

  // 2. Extract Prefix (e.g. NDM-, ND?, CHU-, DOS-)
  // We want to capture prefixes like NDM-, ND?, CHU-, etc. and prevent them from being 
  // translated by the digit-mapping loop where '-' maps to '6'.
  const prefixRegex = /^([a-z]{2,4}[m?,\-\)]*)(.*)$/i;
  const prefixMatch = clean.match(prefixRegex);

  let prefix = '';
  let suffix = clean;

  if (prefixMatch) {
    prefix = prefixMatch[1];
    suffix = prefixMatch[2];
  }

  // 3. Determine if this is a scanner mismatch
  const isScanner = isLikelyScannerMismatch(clean);

  // 4. Decode the prefix
  let decodedPrefix = '';
  if (prefix) {
    let rawPrefix = prefix.toUpperCase();
    rawPrefix = rawPrefix.replace(/\?/g, 'M');
    rawPrefix = rawPrefix.replace(/,/g, 'M');
    rawPrefix = rawPrefix.replace(/\)/g, '-');
    if (!rawPrefix.endsWith('-')) {
      rawPrefix += '-';
    }
    rawPrefix = rawPrefix.replace(/\-\-/g, '-');
    decodedPrefix = rawPrefix;
  }

  // 5. Decode the suffix character-by-character
  let decodedSuffix = '';
  for (let i = 0; i < suffix.length; i++) {
    const char = suffix[i];
    
    if (isScanner) {
      switch (char) {
        case '&': decodedSuffix += '1'; break;
        case 'é': decodedSuffix += '2'; break;
        case '"': decodedSuffix += '3'; break;
        case '\'': decodedSuffix += '4'; break;
        case '(': decodedSuffix += '5'; break;
        case '-': decodedSuffix += '6'; break;
        case 'è': decodedSuffix += '7'; break;
        case '_': decodedSuffix += '8'; break;
        case 'ç': decodedSuffix += '9'; break;
        case 'à': decodedSuffix += '0'; break;
        case ')': decodedSuffix += '-'; break;
        case '?': decodedSuffix += 'M'; break;
        case ',': decodedSuffix += 'M'; break;
        default: decodedSuffix += char;
      }
    } else {
      switch (char) {
        case ')': decodedSuffix += '-'; break;
        case '?': decodedSuffix += 'M'; break;
        case ',': decodedSuffix += 'M'; break;
        default: decodedSuffix += char;
      }
    }
  }

  return decodedPrefix + decodedSuffix;
}

export function decodeScannerInput(input: string): string {
  if (!input) return '';
  let clean = input.trim();

  // Handle structured QR codes without recursion
  if (clean.toLowerCase().includes('dossier:')) {
    const match = clean.match(/dossier:\s*([^|\n\r]+)/i);
    if (match) {
      const ndmPart = match[1].trim();
      const decodedNdm = _internalDecode(ndmPart);
      return clean.replace(match[1], decodedNdm);
    }
  }

  return _internalDecode(clean);
}

/**
 * Extracts only digits from a string to allow robust matching of NDM numbers
 * even if there are layout translation issues (e.g., matching '00270410' with 'ààééèà'&"')
 */
export function getNumericKey(str: string): string {
  if (!str) return '';
  
  // First attempt to decode any AZERTY scanner characters to their numeric equivalents
  const decoded = decodeScannerInput(str);
  
  // Extract all digits
  return decoded.replace(/[^0-9]/g, '');
}
