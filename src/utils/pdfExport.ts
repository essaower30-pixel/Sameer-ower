import html2canvas from 'html2canvas-pro';
import { toBlob as htmlToImageBlob, toPng as htmlToImagePng } from 'html-to-image';
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
        setTimeout(resolve, 800);
      });
    })
  );
}

/**
 * Converts a printable HTML DOM element into a crisp, high-resolution A4 PDF.
 * Temporarily hides '.no-print' UI action buttons during capture so the PDF looks official.
 * Downloads the PDF file directly and returns a File object for native sharing.
 */
export async function exportElementToPdf(
  element: HTMLElement,
  fileName: string = 'فاتورة.pdf'
): Promise<File | null> {
  // Hide UI buttons marked with .no-print during PDF capture
  const noPrintEls = element.querySelectorAll<HTMLElement>('.no-print');
  const originalDisplays = Array.from(noPrintEls).map((el) => el.style.display);
  noPrintEls.forEach((el) => {
    el.style.display = 'none';
  });

  try {
    await preloadImages(element);

    let imgData: string | null = null;
    let canvasWidth = 1024;
    let canvasHeight = 1448;

    try {
      // Primary: html-to-image supports modern CSS variables, oklch colors, and SVG/canvas signatures natively
      imgData = await htmlToImagePng(element, {
        pixelRatio: 2.2,
        backgroundColor: '#ffffff',
        filter: (node) => !(node as HTMLElement)?.classList?.contains('no-print'),
      });

      const tmpImg = new Image();
      tmpImg.src = imgData;
      await new Promise<void>((r) => {
        tmpImg.onload = () => r();
        tmpImg.onerror = () => r();
        setTimeout(r, 600);
      });
      canvasWidth = tmpImg.width || 1024;
      canvasHeight = tmpImg.height || 1448;
    } catch (primaryErr) {
      console.warn('html-to-image fallback to html2canvas-pro for PDF:', primaryErr);
      try {
        const canvas = await html2canvas(element, {
          scale: 2.0,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1024,
          imageTimeout: 15000,
        });
        imgData = canvas.toDataURL('image/jpeg', 0.98);
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
      } catch (fallbackErr) {
        console.error('All PDF image capture methods failed:', fallbackErr);
        throw fallbackErr;
      }
    }

    if (!imgData) throw new Error('Could not render invoice image for PDF');

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvasHeight * pdfWidth) / canvasWidth;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Multi-page support if the invoice has many items, payments, or signatures
    while (heightLeft > 5) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Trigger download of the PDF file
    pdf.save(fileName);

    // Create File object for Web Share API
    const blob = pdf.output('blob');
    const file = new File([blob], fileName, { type: 'application/pdf' });
    return file;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    // Restore .no-print elements
    noPrintEls.forEach((el, i) => {
      el.style.display = originalDisplays[i] || '';
    });
  }
}

/**
 * Converts a printable HTML DOM element into a high-resolution PNG image.
 * Downloads the image directly and returns a File object for native WhatsApp/Gallery sharing.
 */
export async function exportElementToImage(
  element: HTMLElement,
  fileName: string = 'فاتورة.png'
): Promise<File | null> {
  const noPrintEls = element.querySelectorAll<HTMLElement>('.no-print');
  const originalDisplays = Array.from(noPrintEls).map((el) => el.style.display);
  noPrintEls.forEach((el) => {
    el.style.display = 'none';
  });

  try {
    await preloadImages(element);

    let blob: Blob | null = null;

    try {
      // Primary: html-to-image supports modern CSS oklch variables and base64 signatures natively
      blob = await htmlToImageBlob(element, {
        pixelRatio: 2.2,
        backgroundColor: '#ffffff',
        filter: (node) => !(node as HTMLElement)?.classList?.contains('no-print'),
      });
    } catch (primaryErr) {
      console.warn('html-to-image failed, trying html2canvas-pro fallback:', primaryErr);
      try {
        const canvas = await html2canvas(element, {
          scale: 2.0,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 1024,
          imageTimeout: 15000,
        });

        blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/png', 0.98)
        );
      } catch (fallbackErr) {
        console.error('All image export methods failed:', fallbackErr);
        throw fallbackErr;
      }
    }

    if (!blob) throw new Error('Could not create image blob');

    // Trigger local download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    const file = new File([blob], fileName, { type: 'image/png' });
    return file;
  } catch (error) {
    console.error('Error generating invoice image:', error);
    throw error;
  } finally {
    noPrintEls.forEach((el, i) => {
      el.style.display = originalDisplays[i] || '';
    });
  }
}

/**
 * Shares a PDF or image file directly using Web Share API (native WhatsApp / Files document sharing).
 */
export async function sharePdfFile(file: File, title: string = 'فاتورة'): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text: `فاتورة ${title}`,
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


