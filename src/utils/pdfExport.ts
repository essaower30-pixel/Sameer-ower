import html2canvas from 'html2canvas-pro';
import { toBlob as htmlToImageBlob, toJpeg as htmlToImageJpeg, toPng as htmlToImagePng } from 'html-to-image';
import { jsPDF } from 'jspdf';

/**
 * Preload and decode all images in the container before canvas capture
 * to guarantee signatures, stamps, and logos are rendered.
 */
async function preloadImages(container: HTMLElement): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth !== 0) {
        return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        setTimeout(resolve, 600);
      });
    })
  );
}

/**
 * Prepares an offscreen A4 document element for razor-sharp, perfectly proportioned export.
 * Normalizes responsive styles (4-column customer box, side-by-side signatures, horizontal totals)
 * so that mobile viewports don't distort or squeeze the captured document.
 */
function prepareA4CaptureElement(sourceElement: HTMLElement): { element: HTMLElement; cleanup: () => void } {
  // Deep clone the source element
  const clone = sourceElement.cloneNode(true) as HTMLElement;

  // 1. Remove all .no-print elements completely from the clone
  const noPrintEls = clone.querySelectorAll('.no-print');
  noPrintEls.forEach((el) => el.remove());

  // 2. Invisible sandbox container attached to DOM with positive coordinates
  const sandbox = document.createElement('div');
  sandbox.style.position = 'absolute';
  sandbox.style.top = '0';
  sandbox.style.left = '0';
  sandbox.style.width = '820px';
  sandbox.style.minWidth = '820px';
  sandbox.style.maxWidth = '820px';
  sandbox.style.zIndex = '-99999';
  sandbox.style.opacity = '0';
  sandbox.style.pointerEvents = 'none';
  sandbox.style.backgroundColor = '#ffffff';
  sandbox.style.overflow = 'visible';
  sandbox.style.direction = 'rtl';

  // 3. Document Styling on the clone (standard A4 paper proportions)
  clone.style.width = '820px';
  clone.style.minWidth = '820px';
  clone.style.maxWidth = '820px';
  clone.style.boxSizing = 'border-box';
  clone.style.padding = '36px 32px';
  clone.style.backgroundColor = '#ffffff';
  clone.style.borderRadius = '0';
  clone.style.border = 'none';
  clone.style.boxShadow = 'none';
  clone.style.margin = '0';

  // Copy font-family from source
  const computedFont = window.getComputedStyle(sourceElement).fontFamily;
  if (computedFont) {
    clone.style.fontFamily = computedFont;
  }

  // 4. Force Desktop/A4 Layout on responsive containers:
  // Customer Info Box: force 4 columns
  const gridBoxes = clone.querySelectorAll('.grid');
  gridBoxes.forEach((box) => {
    const el = box as HTMLElement;
    if (el.className.includes('grid-cols-2') || el.className.includes('sm:grid-cols-4')) {
      el.style.display = 'grid';
      el.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
      el.style.gap = '12px';
    }
    // Signatures: force 2 columns side-by-side
    if (el.className.includes('grid-cols-1') || el.className.includes('sm:grid-cols-2')) {
      el.style.display = 'grid';
      el.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
      el.style.gap = '24px';
    }
  });

  // Totals & Notes row: force horizontal side-by-side
  const flexContainers = clone.querySelectorAll('.flex');
  flexContainers.forEach((row) => {
    const el = row as HTMLElement;
    if (el.className.includes('flex-col') && el.className.includes('sm:flex-row')) {
      el.style.display = 'flex';
      el.style.flexDirection = 'row';
      el.style.alignItems = 'flex-start';
      el.style.justifyContent = 'space-between';
      el.style.gap = '16px';
    }
  });

  // Header: ensure horizontal layout
  const headerDiv = clone.querySelector('.border-b-2');
  if (headerDiv) {
    const el = headerDiv as HTMLElement;
    el.style.display = 'flex';
    el.style.flexDirection = 'row';
    el.style.justifyContent = 'space-between';
    el.style.alignItems = 'flex-start';
    el.style.gap = '16px';
  }

  // Ensure table is full width and not scrolling
  const tables = clone.querySelectorAll('table');
  tables.forEach((t) => {
    const el = t as HTMLElement;
    el.style.width = '100%';
    el.style.borderCollapse = 'collapse';
  });

  const overflowContainers = clone.querySelectorAll('.overflow-x-auto');
  overflowContainers.forEach((c) => {
    const el = c as HTMLElement;
    el.style.overflow = 'visible';
    el.style.width = '100%';
  });

  // Ensure all images are displayed with exact sizes
  const images = clone.querySelectorAll('img');
  images.forEach((img) => {
    img.style.display = 'block';
    img.style.visibility = 'visible';
  });

  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  return {
    element: clone,
    cleanup: () => {
      sandbox.remove();
    },
  };
}

export interface ExportOptions {
  autoDownload?: boolean; // Set to true ONLY when user explicitly clicks 'Download/Save file'
}

/**
 * Converts invoice into a crisp, high-resolution A4 PDF.
 * - When sharing (autoDownload = false): generates in-memory File without downloading to mobile storage.
 * - When downloading (autoDownload = true): triggers local file download to device.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  fileName: string = 'فاتورة.pdf',
  options: ExportOptions = {}
): Promise<File | null> {
  const { element: a4Element, cleanup } = prepareA4CaptureElement(element);

  try {
    await preloadImages(a4Element);

    let imgData: string | null = null;
    let canvasWidth = 820;
    let canvasHeight = 1160;

    try {
      // High-res JPEG for crisp, compact A4 PDF (~250 KB instead of 7.5 MB!)
      imgData = await htmlToImageJpeg(a4Element, {
        quality: 0.92,
        pixelRatio: 2.0,
        backgroundColor: '#ffffff',
      });

      const tmpImg = new Image();
      tmpImg.src = imgData;
      await new Promise<void>((r) => {
        tmpImg.onload = () => r();
        tmpImg.onerror = () => r();
        setTimeout(r, 600);
      });
      canvasWidth = tmpImg.width || 1640;
      canvasHeight = tmpImg.height || 2320;
    } catch (primaryErr) {
      console.warn('html-to-image fallback to html2canvas-pro for PDF:', primaryErr);
      const canvas = await html2canvas(a4Element, {
        scale: 2.0,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 820,
        imageTimeout: 15000,
      });
      imgData = canvas.toDataURL('image/jpeg', 0.92);
      canvasWidth = canvas.width;
      canvasHeight = canvas.height;
    }

    if (!imgData) throw new Error('Could not render invoice image for PDF');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const imgWidth = pdfWidth;
    const imgHeight = (canvasHeight * pdfWidth) / canvasWidth;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Multi-page support if invoice has dozens of items
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    // Trigger download ONLY if explicitly requested by user clicking 'تحميل'
    if (options.autoDownload) {
      pdf.save(fileName);
    }

    // Create File object for Web Share API (streamed in-memory, zero mobile disk clutter)
    const blob = pdf.output('blob');
    const file = new File([blob], fileName, { type: 'application/pdf' });
    return file;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    cleanup();
  }
}

/**
 * Converts invoice into a high-resolution PNG image formatted for WhatsApp.
 * - Standard A4 proportions (not squeezed or elongated).
 * - Full width preview in WhatsApp without black borders.
 * - In-memory File for sharing directly to WhatsApp without downloading to gallery/files first.
 */
export async function exportElementToImage(
  element: HTMLElement,
  fileName: string = 'فاتورة.png',
  options: ExportOptions = {}
): Promise<File | null> {
  const { element: a4Element, cleanup } = prepareA4CaptureElement(element);

  try {
    await preloadImages(a4Element);

    let blob: Blob | null = null;

    try {
      // Export as crisp PNG blob at 2.0 pixelRatio (1640px width - Retina clarity)
      blob = await htmlToImageBlob(a4Element, {
        pixelRatio: 2.0,
        backgroundColor: '#ffffff',
      });
    } catch (primaryErr) {
      console.warn('html-to-image failed, trying html2canvas-pro fallback:', primaryErr);
      const canvas = await html2canvas(a4Element, {
        scale: 2.0,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 820,
        imageTimeout: 15000,
      });

      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png', 0.98)
      );
    }

    if (!blob) throw new Error('Could not create image blob');

    // Trigger download ONLY if explicitly requested (e.g., user clicked 'حفظ كصورة')
    if (options.autoDownload) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    const file = new File([blob], fileName, { type: 'image/png' });
    return file;
  } catch (error) {
    console.error('Error generating invoice image:', error);
    throw error;
  } finally {
    cleanup();
  }
}

/**
 * Shares a PDF or image file directly using Web Share API (native WhatsApp / Files document sharing).
 */
export async function sharePdfFile(file: File, title: string = 'فاتورة'): Promise<boolean> {
  return shareFileDirectly(file, title);
}

/**
 * Shares any file (PDF or Image) natively via Web Share API
 */
export async function shareFileDirectly(
  file: File,
  title: string = 'فاتورة',
  text?: string
): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text: text || `فاتورة ${title}`,
        files: [file],
      });
      return true;
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        console.warn('Native file share failed', e);
      }
      return false;
    }
  }
  return false;
}
