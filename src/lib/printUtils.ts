/**
 * Universal, cross-browser print utility that works reliably inside all browsers
 * (Firefox, Chrome, Edge, Safari), iframe sandboxes, and popups.
 */

function getAllStylesHtml(): string {
  let stylesHtml = '';
  try {
    const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
    styleElements.forEach((el) => {
      stylesHtml += el.outerHTML + '\n';
    });
  } catch (e) {
    console.warn('[PrintUtils] Failed to extract styles:', e);
  }
  return stylesHtml;
}

/**
 * Opens a clean, dedicated pop-up window for printing that is NEVER restricted
 * by iframe sandbox policies and includes full CSS styling.
 */
export function openPrintWindow(contentHtml: string, title = 'Impression', isThermal = false): boolean {
  try {
    const printWin = window.open('', '_blank', 'width=900,height=1000,scrollbars=yes,resizable=yes');
    if (!printWin) {
      console.warn('[PrintUtils] Window open was blocked by popup blocker');
      return false;
    }

    const stylesHtml = getAllStylesHtml();

    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          ${stylesHtml}
          <style>
            html, body {
              background: #ffffff !important;
              color: #0f172a !important;
              margin: 0 !important;
              padding: 0 !important;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body * {
              visibility: visible !important;
              opacity: 1 !important;
            }
            .no-print, button, .cursor-pointer, .no-print-action, #app-print-preview-modal {
              display: none !important;
            }
            @media print {
              html, body {
                padding: ${isThermal ? '0' : '5mm'} !important;
                margin: 0 !important;
                background: #ffffff !important;
              }
              .no-print, button, .cursor-pointer, .no-print-action {
                display: none !important;
              }
              ${
                isThermal
                  ? `@page { size: 50mm 30mm; margin: 0; }`
                  : `@page { size: A4 portrait; margin: 5mm; }`
              }
            }
          </style>
        </head>
        <body class="bg-white text-slate-900 p-4">
          <div id="app-print-isolated-root" class="printable-area" style="max-width: 820px; margin: 0 auto; background: #ffffff; color: #000000; padding: 12px;">
            ${contentHtml}
          </div>
          <script>
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.focus();
                try {
                  window.print();
                } catch(e) {
                  console.warn('Print error in popup window:', e);
                }
              }, 350);
            });
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
    return true;
  } catch (err) {
    console.warn('[PrintUtils] Failed to execute openPrintWindow:', err);
    return false;
  }
}

export function printElement(
  element: HTMLElement | null,
  documentTitle = 'Impression'
): Promise<void> {
  return new Promise((resolve) => {
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

      // Extract content HTML
      const contentHtml = element.outerHTML || element.innerHTML;

      // 1. Prepare isolated print root in current document.body
      let printRoot = document.getElementById('app-print-isolated-root');
      if (!printRoot) {
        printRoot = document.createElement('div');
        printRoot.id = 'app-print-isolated-root';
        printRoot.className = 'printable-area';
        document.body.appendChild(printRoot);
      }
      printRoot.innerHTML = contentHtml;

      // Ensure any hidden classes inside the print root are unhidden for printing
      const hiddenElements = printRoot.querySelectorAll('.hidden');
      hiddenElements.forEach((el) => {
        el.classList.remove('hidden');
      });

      // 2. Add or update print media stylesheet for main document
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
          #app-print-isolated-root, #app-print-isolated-root * {
            visibility: visible !important;
            opacity: 1 !important;
          }
          #app-print-isolated-root {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: ${isThermal ? '0' : '10mm'} !important;
            background: #ffffff !important;
            color: #000000 !important;
            z-index: 99999999 !important;
          }
          #app-print-preview-modal {
            display: none !important;
          }
          .no-print, button, .cursor-pointer, .no-print-action {
            display: none !important;
          }
          ${
            isThermal
              ? `@page { size: 50mm 30mm; margin: 0; }`
              : `@page { size: A4 portrait; margin: 10mm; }`
          }
        }
        @media screen {
          #app-print-isolated-root {
            display: none !important;
          }
        }
      `;

      // 3. Show interactive print & preview modal
      showInteractivePrintModal(contentHtml, documentTitle, isThermal);

      // 4. Trigger window.print() after a tiny tick so the DOM is ready
      setTimeout(() => {
        try {
          window.print();
        } catch (nativeErr) {
          console.warn('[PrintUtils] Native window.print() failed:', nativeErr);
        }
        document.title = originalTitle;
        resolve();
      }, 250);

    } catch (e) {
      console.error('[PrintUtils] Exception in printElement:', e);
      resolve();
    }
  });
}

/**
 * High-fidelity in-page printable document viewer that allows direct printing,
 * text copying, and previewing without iframe sandbox limits.
 */
function showInteractivePrintModal(contentHtml: string, title: string, isThermal: boolean) {
  const existing = document.getElementById('app-print-preview-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'app-print-preview-modal';
  modal.innerHTML = `
    <div style="position: fixed; inset: 0; background: rgba(15,23,42,0.8); z-index: 999999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); padding: 16px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="background: white; border-radius: 16px; max-width: 820px; width: 100%; max-height: 92vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3); border: 1px solid #cbd5e1; overflow: hidden;">
        
        <!-- Header -->
        <div style="padding: 16px 20px; background: white; color: #0f172a; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 8px; background: #f1f5f9; color: #334155; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; border: 1px solid #cbd5e1;">
              DOC
            </div>
            <div>
              <h3 style="margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -0.01em; color: #0f172a;">Aperçu & Impression du Document</h3>
              <p style="margin: 2px 0 0; font-size: 11px; color: #64748b;">${title}</p>
            </div>
          </div>
          <button id="app-print-modal-close-btn" style="background: none; border: none; color: #64748b; font-size: 20px; cursor: pointer; padding: 4px 8px; border-radius: 6px; line-height: 1;">✕</button>
        </div>

        <!-- Document Preview Canvas -->
        <div style="padding: 24px; overflow-y: auto; background: #f1f5f9; flex: 1;">
          <div id="app-print-inner-paper" style="background: white; border: 1px solid #cbd5e1; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.06); max-width: 720px; margin: 0 auto; color: #0f172a;">
            ${contentHtml}
          </div>
        </div>

        <!-- Actions Footer -->
        <div style="padding: 14px 20px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div style="font-size: 12px; color: #64748b; font-weight: 500;">
            Document certifié conforme, prêt pour émission
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button id="app-print-modal-copy-btn" style="background: white; border: 1px solid #cbd5e1; color: #334155; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.15s;">
              Copier le texte
            </button>
            <button id="app-print-modal-print-btn" style="background: #0f172a; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
              Lancer l'Impression
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Unhide any hidden classes inside the inner paper container
  const innerPaper = document.getElementById('app-print-inner-paper');
  if (innerPaper) {
    innerPaper.querySelectorAll('.hidden').forEach((el) => el.classList.remove('hidden'));
  }

  // Bind close button
  document.getElementById('app-print-modal-close-btn')?.addEventListener('click', () => {
    modal.remove();
  });

  // Bind direct print button
  document.getElementById('app-print-modal-print-btn')?.addEventListener('click', () => {
    const success = openPrintWindow(contentHtml, title, isThermal);
    if (!success) {
      try {
        window.print();
      } catch (e) {
        console.warn('Native print call failed:', e);
      }
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

export function printDocumentById(elementId: string, title = 'Document'): Promise<void> {
  const el = document.getElementById(elementId);
  if (el) {
    return printElement(el, title);
  }
  const fallback = document.getElementById('main-content-area') || document.body;
  return printElement(fallback, title);
}

export function printContentOrPage(container?: HTMLElement | null, title = 'Document'): Promise<void> {
  if (container) {
    return printElement(container, title);
  }
  const fallback = document.getElementById('main-content-area') || document.body;
  return printElement(fallback, title);
}
