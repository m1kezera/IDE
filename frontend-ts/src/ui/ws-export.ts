/**
 * Web Studio — Export Functions
 *
 * PNG and PDF export logic.
 * Extracted from WebStudioPanel.ts.
 */

export function exportWSPNG(
    artboards: any[],
    activeArtboardId: string | null,
    showToast: (m: string) => void,
    generateHTML: () => string,
): void {
  const ab = artboards.find(a => a.id === activeArtboardId) || artboards[0];
  if (!ab) return;
  showToast('📸 Preparing PNG...');

  const html = generateHTML();
  const frame = document.createElement('iframe');
  frame.style.cssText = `position:fixed;left:-9999px;top:0;width:${ab.width}px;height:${ab.height}px;border:none;opacity:0;pointer-events:none;`;
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) { frame.remove(); return; }
  doc.open();
  doc.write(html);
  doc.close();

  // Wait for content to render, then capture
  setTimeout(() => {
    try {
      const canvas = document.createElement('canvas');
      const scale = 2; // Retina
      canvas.width = ab.width * scale;
      canvas.height = Math.max(doc.body.scrollHeight, ab.height) * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);

      // Use SVG foreignObject to render HTML to canvas
      const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${ab.width}" height="${Math.max(doc.body.scrollHeight, ab.height)}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">${doc.documentElement.outerHTML}</div>
        </foreignObject>
      </svg>`;
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob(blob => {
          if (!blob) { showToast('❌ PNG capture failed'); frame.remove(); return; }
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `${ab.name || 'design'}.png`;
          a.click();
          frame.remove();
          showToast('✅ PNG exported');
        }, 'image/png');
      };
      img.onerror = () => {
        // Fallback: open HTML in new window for manual screenshot
        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
        frame.remove();
        showToast('📸 Opened in new tab — use Ctrl+P to save');
      };
      img.src = url;
    } catch {
      // Fallback
      const win = window.open('', '_blank');
      if (win) { win.document.write(html); win.document.close(); }
      frame.remove();
      showToast('📸 Opened in new tab — right-click → Save as Image');
    }
  }, 500);
}

export function exportWSPDF(
    artboards: any[],
    activeArtboardId: string | null,
    showToast: (m: string) => void,
    generateHTML: () => string,
): void {
  const ab = artboards.find(a => a.id === activeArtboardId) || artboards[0];
  if (!ab) return;
  showToast('📄 Preparing PDF...');

  const html = generateHTML();
  // Add print-specific styles for clean PDF
  const printHTML = html.replace('</head>', `
    <style media="print">
      @page { size: ${ab.width}px ${ab.height}px; margin: 0; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    </style>
  </head>`);

  const frame = document.createElement('iframe');
  frame.style.cssText = `position:fixed;left:-9999px;top:0;width:${ab.width}px;height:${ab.height}px;border:none;`;
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) { frame.remove(); return; }
  doc.open();
  doc.write(printHTML);
  doc.close();

  setTimeout(() => {
    try {
      frame.contentWindow?.print();
    } catch {
      // Fallback: open in new tab
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(printHTML);
        win.document.close();
        setTimeout(() => win.print(), 300);
      }
    }
    setTimeout(() => frame.remove(), 1000);
  }, 500);
}
