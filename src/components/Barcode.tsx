import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  format?: 'CODE128' | 'CODE39' | 'EAN13' | 'UPC';
  width?: number;
  height?: number;
  displayValue?: boolean;
  className?: string;
}

export const Barcode: React.FC<BarcodeProps> = ({
  value,
  format = 'CODE128',
  width = 1.5,
  height = 35,
  displayValue = false,
  className = '',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format,
          width,
          height,
          displayValue,
          margin: 0,
        });
      } catch (e) {
        console.error('[Barcode] Failed to render barcode:', e);
      }
    }
  }, [value, format, width, height, displayValue]);

  return <svg ref={svgRef} className={`max-w-full select-none ${className}`} />;
};

/**
 * Generates a standard Code 128 SVG string for use in offline/HTML templates
 */
export function getBarcodeSvgString(value: string, height = 35, width = 1.5): string {
  if (typeof document === 'undefined') {
    return `<div style="padding: 4px; font-weight: bold; font-family: monospace;">[${value}]</div>`;
  }
  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svg, value, {
      format: 'CODE128',
      width,
      height,
      displayValue: false,
      margin: 0,
    });
    return svg.outerHTML || '';
  } catch (err) {
    console.error('[Barcode] Failed to generate SVG string:', err);
    return `<div style="padding: 4px; font-weight: bold; font-family: monospace;">[${value}]</div>`;
  }
}
