/**
 * Universal, cross-browser print utility that works reliably inside all browsers,
 * iframe sandboxes, and modern operating systems.
 * Uses a dedicated in-page hidden iframe and @media print CSS rules to isolate
 * the print content seamlessly without popup blockers.
 */

export function printElement(
  element: HTMLElement | null,
  documentTitle = 'Impression'
): Promise<void> {
  return new Promise(async (resolve) => {
    if (!element) {
      console.warn('[PrintUtils] Element to print is null');
      resolve();
      return;
    }

    try {
      const originalTitle = document.title;
      document.title = documentTitle;

      // Check if thermal label printing
      const isThermal =
        documentTitle.toLowerCase().includes('etiquette') ||
        element.id === 'thermal-labels-print-container' ||
        element.querySelector('#thermal-labels-print-container') !== null;

      // 1. Gather all document styles to match current theme and typography
      let stylesHtml = '';
      const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
      stylesheets.forEach((sheet) => {
        stylesHtml += sheet.outerHTML;
      });

      // 2. Extract content HTML
      const contentHtml = element.outerHTML || element.innerHTML;

      // 3. Build Print Stylesheet
      const printStyles = `
        html, body {
          background: #ffffff !important;
          color: #0f172a !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }
        body {
          padding: ${isThermal ? '0' : '16px'} !important;
        }
        #thermal-labels-print-container {
          padding: 0 !important;
          margin: 0 !important;
        }
        @media print {
          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: ${isThermal ? '0' : '10mm'} !important;
          }
          .no-print, button, .cursor-pointer {
            display: none !important;
          }
        }
        ${
          isThermal
            ? `
          @page {
            size: 50mm 30mm !important;
            margin: 0 !important;
          }
          html, body {
            width: 50mm !important;
            height: 30mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }
          `
            : `
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          `
        }
      `;

      // 4. Try Primary Method: In-page hidden iframe (Most reliable, never blocked by popup blockers)
      let iframePrinted = false;
      try {
        const existingIframe = document.getElementById('app-print-hidden-frame');
        if (existingIframe) existingIframe.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'app-print-hidden-frame';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(`
            <!DOCTYPE html>
            <html lang="fr">
              <head>
                <meta charset="UTF-8">
                <title>${documentTitle}</title>
                ${stylesHtml}
                <style>${printStyles}</style>
              </head>
              <body>
                <div id="print-content-root">
                  ${contentHtml}
                </div>
              </body>
            </html>
          `);
          iframeDoc.close();

          // Wait a tick for fonts/styles to load in the iframe
          await new Promise((r) => setTimeout(r, 250));

          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            try {
              iframe.contentWindow.print();
              iframePrinted = true;
            } catch (iframeErr) {
              console.warn('[PrintUtils] Iframe print was blocked or failed:', iframeErr);
            }
          }
        }
      } catch (err) {
        console.warn('[PrintUtils] Failed to print via iframe:', err);
      }

      // If iframe printing succeeded, we clean up and exit
      if (iframePrinted) {
        setTimeout(() => {
          document.title = originalTitle;
          const f = document.getElementById('app-print-hidden-frame');
          if (f) f.remove();
          resolve();
        }, 1000);
        return;
      }

      // 5. Fallback Method: In-page isolated Print Root & Modal Preview
      // Create or update #app-print-isolated-root
      let printRoot = document.getElementById('app-print-isolated-root');
      if (!printRoot) {
        printRoot = document.createElement('div');
        printRoot.id = 'app-print-isolated-root';
        document.body.appendChild(printRoot);
      }
      printRoot.innerHTML = contentHtml;

      // Add print media styles to hide everything else during print
      let styleTag = document.getElementById('app-print-style-isolated') as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'app-print-style-isolated';
        document.head.appendChild(styleTag);
      }
      styleTag.innerHTML = `
        @media print {
          body > *:not(#app-print-isolated-root) {
            display: none !important;
          }
          #app-print-isolated-root {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #ffffff !important;
            color: #000000 !important;
            z-index: 999999 !important;
          }
        }
        @media screen {
          #app-print-isolated-root {
            display: none !important;
          }
        }
      `;

      // Try native window.print()
      let nativePrintSuccess = false;
      try {
        window.print();
        nativePrintSuccess = true;
      } catch (nativeErr) {
        console.warn('[PrintUtils] window.print() failed:', nativeErr);
      }

      // If both iframe and native print could not complete, show the interactive in-page print preview modal
      if (!nativePrintSuccess) {
        showInteractivePrintModal(contentHtml, documentTitle, isThermal);
      }

      setTimeout(() => {
        document.title = originalTitle;
        resolve();
      }, 500);

    } catch (e) {
      console.error('[PrintUtils] Exception in printElement:', e);
      resolve();
    }
  });
}

/**
 * High-fidelity in-page printable document viewer that allows direct printing,
 * text copying, and previewing without ever being blocked by sandbox attributes.
 */
function showInteractivePrintModal(contentHtml: string, title: string, isThermal: boolean) {
  const existing = document.getElementById('app-print-preview-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'app-print-preview-modal';
  modal.innerHTML = `
    <div style="position: fixed; inset: 0; background: rgba(15,23,42,0.75); z-index: 999999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(3px); padding: 16px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="background: white; border-radius: 16px; max-width: 780px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid #e2e8f0; overflow: hidden;">
        
        <!-- Header -->
        <div style="padding: 16px 20px; background: white; color: #0f172a; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: #f1f5f9; color: #334155; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border: 1px solid #cbd5e1;">
              DOC
            </div>
            <div>
              <h3 style="margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; color: #0f172a;">Aperçu & Impression du Document</h3>
              <p style="margin: 2px 0 0; font-size: 11px; color: #64748b;">${title}</p>
            </div>
          </div>
          <button id="app-print-modal-close-btn" style="background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; padding: 4px 8px; border-radius: 6px; line-height: 1;">✕</button>
        </div>

        <!-- Document Preview Canvas -->
        <div style="padding: 24px; overflow-y: auto; background: #f8fafc; flex: 1;">
          <div id="app-print-inner-paper" style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); max-width: 680px; margin: 0 auto; color: #0f172a;">
            ${contentHtml}
          </div>
        </div>

        <!-- Actions Footer -->
        <div style="padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-wrap: gap;">
          <div style="font-size: 12px; color: #64748b;">
            Document certifié conforme, prêt pour émission
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button id="app-print-modal-copy-btn" style="background: white; border: 1px solid #cbd5e1; color: #334155; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.15s;">
              Copier le texte
            </button>
            <button id="app-print-modal-print-btn" style="background: #0f172a; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              Lancer l'Impression
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Bind close buttons
  document.getElementById('app-print-modal-close-btn')?.addEventListener('click', () => {
    modal.remove();
  });

  // Bind direct print button
  document.getElementById('app-print-modal-print-btn')?.addEventListener('click', () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Native print call failed:', e);
    }
  });

  // Bind copy button
  document.getElementById('app-print-modal-copy-btn')?.addEventListener('click', () => {
    const text = document.getElementById('app-print-inner-paper')?.innerText || '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      const btn = document.getElementById('app-print-modal-copy-btn');
      if (btn) btn.innerText = 'Copié dans le presse-papier';
      setTimeout(() => {
        if (btn) btn.innerText = 'Copier le texte';
      }, 2000);
    }
  });
}

/**
 * Convenience helper to print any DOM element by ID or fall back to body/container.
 */
export function printDocumentById(elementId: string, title = 'Document'): Promise<void> {
  const el = document.getElementById(elementId);
  if (el) {
    return printElement(el, title);
  }
  const fallback = document.getElementById('main-content-area') || document.body;
  return printElement(fallback, title);
}

/**
 * Universal print handler that can be invoked safely anywhere.
 */
export function printContentOrPage(container?: HTMLElement | null, title = 'Document'): Promise<void> {
  if (container) {
    return printElement(container, title);
  }
  const fallback = document.getElementById('main-content-area') || document.body;
  return printElement(fallback, title);
}
