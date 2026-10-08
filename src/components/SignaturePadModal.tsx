import React, { useRef, useState, useEffect } from 'react';
import { X, Check, RotateCcw, Undo2, PenTool, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title?: string;
  signerName?: string;
  initialSignature?: string;
  onSave: (signatureDataUrl: string) => void;
  onClose: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export const SignaturePadModal: React.FC<Props> = ({
  isOpen,
  title = 'توقيع الزبون على الفاتورة',
  signerName,
  initialSignature,
  onSave,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null);
  const [penColor, setPenColor] = useState<string>('#1d4ed8'); // Default Ink Blue
  const [penWidth, setPenWidth] = useState<number>(3.5);
  const [isEmpty, setIsEmpty] = useState<boolean>(!initialSignature);
  const isDrawing = useRef(false);

  // Setup canvas with DPI scaling
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 2);

    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(ratio, ratio);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    redrawCanvas();
  };

  useEffect(() => {
    if (isOpen) {
      // Small timeout to allow container to render with exact dimensions
      const timer = setTimeout(() => {
        setupCanvas();
      }, 50);

      const handleResize = () => setupCanvas();
      window.addEventListener('resize', handleResize);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);

    // If initial image exists and no strokes made yet
    if (initialSignature && strokes.length === 0 && !currentStroke) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width / ratio, canvas.height / ratio);
      };
      img.src = initialSignature;
      return;
    }

    // Draw all strokes
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke.points, stroke.color, stroke.width);
    });

    if (currentStroke && currentStroke.length > 0) {
      drawStroke(ctx, currentStroke, penColor, penWidth);
    }
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, points: Point[], color: string, width: number) => {
    if (points.length === 0) return;

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (points.length === 1) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }

    // Connect to last point
    const last = points[points.length - 1];
    const prev = points[points.length - 2];
    ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
    ctx.stroke();
  };

  // Coordinates helper
  const getCoordinates = (e: React.TouchEvent | React.MouseEvent | TouchEvent | MouseEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      return null;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Touch & Pointer handlers
  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const point = getCoordinates(e);
    if (!point) return;

    setCurrentStroke([point]);
    setIsEmpty(false);
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing.current || !currentStroke) return;
    e.preventDefault();
    const point = getCoordinates(e);
    if (!point) return;

    const newPoints = [...currentStroke, point];
    setCurrentStroke(newPoints);

    // Direct incremental drawing for ultra responsiveness
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawStroke(ctx, newPoints, penColor, penWidth);
      }
    }
  };

  const handleEnd = (e?: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing.current) return;
    if (e) e.preventDefault();
    isDrawing.current = false;

    if (currentStroke && currentStroke.length > 0) {
      const newStroke: Stroke = {
        points: currentStroke,
        color: penColor,
        width: penWidth,
      };
      setStrokes((prev) => [...prev, newStroke]);
      setCurrentStroke(null);
    }
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke(null);
    setIsEmpty(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const ratio = Math.max(window.devicePixelRatio || 1, 2);
        ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);
      }
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    const remaining = strokes.slice(0, -1);
    setStrokes(remaining);
    setIsEmpty(remaining.length === 0);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    ctx.clearRect(0, 0, canvas.width / ratio, canvas.height / ratio);

    remaining.forEach((stroke) => {
      drawStroke(ctx, stroke.points, stroke.color, stroke.width);
    });
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    // Export transparent PNG
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 select-none font-['Cairo',sans-serif]">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 text-blue-400 flex items-center justify-center">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">{title}</h3>
              {signerName && (
                <p className="text-[11px] text-slate-300">الاسم: <strong className="text-amber-400">{signerName}</strong></p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions banner */}
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>حرّك إصبعك أو قلم الشاشة داخل الإطار الأبيض للتوقيع الحي.</span>
          </div>
          <span className="text-[10px] bg-amber-200/70 text-amber-950 font-bold px-2 py-0.5 rounded-full">
            شاشة لمس 📱
          </span>
        </div>

        {/* Signature Canvas Area */}
        <div className="p-4 bg-slate-100 flex-1 flex flex-col">
          <div
            ref={containerRef}
            className="w-full h-56 sm:h-64 bg-white rounded-xl border-2 border-dashed border-slate-300 relative overflow-hidden shadow-inner touch-none cursor-crosshair flex items-center justify-center"
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full touch-none"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
              onTouchCancel={handleEnd}
            />

            {/* Placeholder guide line */}
            <div className="absolute bottom-10 left-8 right-8 border-b border-slate-200 pointer-events-none flex justify-between text-[10px] text-slate-400 pb-1">
              <span>خط التوقيع والاعتماد الرسمي</span>
              <span>✖</span>
            </div>

            {isEmpty && (
              <div className="pointer-events-none text-slate-300 flex flex-col items-center gap-1">
                <PenTool className="w-7 h-7 stroke-1 text-slate-300" />
                <span className="text-xs">المس هنا للتوقيع بإصبعك</span>
              </div>
            )}
          </div>

          {/* Canvas Tools Toolbar */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Color selection */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 ml-1">اللون:</span>
              <button
                type="button"
                onClick={() => setPenColor('#1d4ed8')}
                className={`w-6 h-6 rounded-full bg-blue-700 transition-all cursor-pointer ${
                  penColor === '#1d4ed8' ? 'ring-2 ring-offset-2 ring-blue-600 scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                title="أزرق حبري"
              />
              <button
                type="button"
                onClick={() => setPenColor('#0f172a')}
                className={`w-6 h-6 rounded-full bg-slate-900 transition-all cursor-pointer ${
                  penColor === '#0f172a' ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                title="أسود رسمي"
              />
              <button
                type="button"
                onClick={() => setPenColor('#047857')}
                className={`w-6 h-6 rounded-full bg-emerald-700 transition-all cursor-pointer ${
                  penColor === '#047857' ? 'ring-2 ring-offset-2 ring-emerald-600 scale-110' : 'opacity-70 hover:opacity-100'
                }`}
                title="أخضر معتمد"
              />
            </div>

            {/* Stroke Width */}
            <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 ml-1">السُمك:</span>
              <button
                type="button"
                onClick={() => setPenWidth(2)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  penWidth === 2 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                رفيع
              </button>
              <button
                type="button"
                onClick={() => setPenWidth(3.5)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  penWidth === 3.5 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                متوسط
              </button>
              <button
                type="button"
                onClick={() => setPenWidth(5.5)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  penWidth === 5.5 ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                عريض
              </button>
            </div>

            {/* Undo / Clear Actions */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-40 disabled:hover:bg-white rounded-lg border border-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                title="تراجع عن آخر حركة"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>تراجع</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                disabled={isEmpty && strokes.length === 0}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-40 disabled:hover:bg-rose-50 rounded-lg border border-rose-200 text-xs font-semibold transition-all cursor-pointer"
                title="مسح اللوحة والبدء من جديد"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>مسح</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isEmpty}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>حفظ واعتماد التوقيع على الفاتورة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
