/**
 * Universal, cross-browser print utility that works reliably inside all browsers and iframe sandboxes.
 * Uses a root-level print container and @media print CSS rules to isolate the print content seamlessly.
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

      // Detect if we are in an iframe sandbox (e.g., AI Studio preview)
      const isInIframe = window.self !== window.top;

      if (isInIframe) {
        // --- SANDBOX BYPASS: Open print layout in a new tab where window.print() is allowed ---
        console.log('[PrintUtils] Sandbox detected. Opening printable layout in a new tab...');
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          // Popup blocked! Show the friendly fallback alert
          showPrintBlockedFallback();
          resolve();
          return;
        }

        // 1. Gather all document styles to match current theme and layout
        let stylesHtml = '';
        
        // Copy stylesheet links and active inline styles
        const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
        stylesheets.forEach((sheet) => {
          stylesHtml += sheet.outerHTML;
        });

        // 2. Extract content HTML
        const contentHtml = element.outerHTML || element.innerHTML;

        // 3. Write self-contained printable document to the new window
        printWindow.document.open();
        printWindow.document.write(`
          <!DOCTYPE html>
          <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <title>${documentTitle}</title>
              ${stylesHtml}
              <style>
                /* Ensure pristine page styling for printing */
                html, body {
                  background: #ffffff !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  width: 100% !important;
                  height: auto !important;
                  overflow: visible !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  color-adjust: exact !important;
                }
                body {
                  padding: ${isThermal ? '0' : '20px'} !important;
                  font-family: system-ui, -apple-system, sans-serif;
                }
                #thermal-labels-print-container {
                  padding: 0 !important;
                  margin: 0 !important;
                }
                @media print {
                  html, body {
                    width: 100% !important;
                    height: auto !important;
                  }
                  .no-print {
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
              </style>
            </head>
            <body>
              <div id="print-content-root">
                ${contentHtml}
              </div>
              <script>
                // Execute print when all elements and images are fully loaded
                window.onload = function() {
                  const images = Array.from(document.querySelectorAll('img'));
                  if (images.length > 0) {
                    Promise.all(images.map(img => {
                      if (img.complete) return Promise.resolve();
                      return new Promise(r => { img.onload = r; img.onerror = r; });
                    })).then(() => {
                      setTimeout(() => {
                        window.print();
                        window.close();
                      }, 300);
                    });
                  } else {
                    setTimeout(() => {
                      window.print();
                      window.close();
                    }, 300);
                  }
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        resolve();
        return;
      }

      // --- STANDARD PRINTING FOR PRODUCTION / NON-IFRAME ENVIRONMENT ---
      // 1. Target or create a root-level print container
      const printContainerId = 'app-global-print-target';
      let printContainer = document.getElementById(printContainerId);
      if (!printContainer) {
        printContainer = document.createElement('div');
        printContainer.id = printContainerId;
        document.body.appendChild(printContainer);
      }

      // Clear previous print content (this acts as our cleanup from the PREVIOUS print job)
      printContainer.innerHTML = '';

      // Clone the requested element into our root print container
      const clone = element.cloneNode(true) as HTMLElement;
      printContainer.appendChild(clone);

      // 2. Inject or update active print CSS rules in head
      const styleId = 'app-global-print-rules';
      let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
      }

      styleTag.innerHTML = `
        @media screen {
          #${printContainerId} {
            display: none !important;
          }
        }
        @media print {
          /* Hide all application elements except the print container */
          body > *:not(#${printContainerId}) {
            display: none !important;
          }

          #${printContainerId} {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: ${isThermal ? '0' : '15mm'} !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-sizing: border-box !important;
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

          /* Hide UI action buttons and controls during print */
          .no-print {
            display: none !important;
          }
        }
      `;

      // 3. Ensure all images inside cloned element are loaded before triggering print
      const images = Array.from(clone.querySelectorAll('img'));
      if (images.length > 0) {
        await Promise.race([
          Promise.all(
            images.map((img) => {
              if (img.complete && img.naturalWidth > 0) return Promise.resolve();
              return new Promise<void>((r) => {
                img.onload = () => r();
                img.onerror = () => r();
              });
            })
          ),
          new Promise((r) => setTimeout(r, 400)),
        ]);
      }

      // Small delay for DOM layout render
      await new Promise((r) => setTimeout(r, 150));

      // 4. Trigger print dialog and detect if it was blocked by the iframe sandbox
      let printDialogOpened = false;
      const onBeforePrint = () => { printDialogOpened = true; };
      window.addEventListener('beforeprint', onBeforePrint, { once: true });

      try {
        window.print();
      } catch (err) {
        console.warn('[PrintUtils] window.print() threw an error:', err);
      }

      // 5. Check if blocked & Restore Title
      setTimeout(() => {
        window.removeEventListener('beforeprint', onBeforePrint);
        document.title = originalTitle;
        
        // If the print dialog was blocked (e.g., by AI Studio sandbox iframe without allow-modals), 
        // show a gentle fallback message explaining how to print.
        if (!printDialogOpened) {
          showPrintBlockedFallback();
        }
        
        resolve();
      }, 1500);

    } catch (e) {
      console.error('[PrintUtils] Exception in printElement:', e);
      resolve();
    }
  });
}

function showPrintBlockedFallback() {
  const existing = document.getElementById('app-print-fallback-alert');
  if (existing) existing.remove();

  const alertDiv = document.createElement('div');
  alertDiv.id = 'app-print-fallback-alert';
  alertDiv.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.85); z-index: 999999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); padding: 20px; font-family: system-ui, -apple-system, sans-serif;">
      <div style="background: white; border-radius: 16px; padding: 32px; max-width: 480px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); text-align: center; animation: print-alert-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
        <div style="width: 56px; height: 56px; background: #FEF2F2; color: #DC2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
        </div>
        <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #0F172A;">Impression bloquée par l'aperçu</h2>
        <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: #475569;">
          La plateforme bloque l'ouverture de la fenêtre d'impression par sécurité (iframe sandbox).<br><br>
          Pour imprimer vos documents, veuillez <strong>ouvrir l'application dans un nouvel onglet</strong> en utilisant l'icône dédiée ou l'URL fournie.
        </p>
        <button onclick="document.getElementById('app-print-fallback-alert').remove()" style="background: #0F172A; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; cursor: pointer; transition: background 0.2s; width: 100%;">
          J'ai compris
        </button>
      </div>
    </div>
    <style>
      @keyframes print-alert-pop {
        0% { opacity: 0; transform: scale(0.95) translateY(10px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
    </style>
  `;
  document.body.appendChild(alertDiv);
}

