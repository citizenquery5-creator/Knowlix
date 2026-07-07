import { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize, Minimize, RotateCw, Download } from 'lucide-react';

interface DocumentViewerProps {
  open: boolean;
  onClose: () => void;
  fileUrl: string;
  fileType: string;
  title: string;
  onDownload?: () => void;
}

export default function DocumentViewer({ open, onClose, fileUrl, fileType, title, onDownload }: DocumentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isFullscreen) toggleFullscreen();
      else onClose();
    }
  }, [isFullscreen, onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, handleEsc]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (!open) return null;

  const isPdf = fileType === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType);

  const zoomIn = () => setZoom(z => Math.min(300, z + 25));
  const zoomOut = () => setZoom(z => Math.max(50, z - 25));
  const rotate = () => setRotation(r => (r + 90) % 360);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[100] bg-neutral-900/95 backdrop-blur-sm flex flex-col ${isFullscreen ? 'fullscreen' : ''}`}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-medium text-white truncate">{title}</h2>
        </div>

        <div className="flex items-center gap-1">
          {isPdf && (
            <>
              <button
                onClick={() => setPageNum(p => Math.max(1, p - 1))}
                disabled={pageNum <= 1}
                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-neutral-400 px-2 min-w-16 text-center">
                {pageNum} / {numPages}
              </span>
              <button
                onClick={() => setPageNum(p => Math.min(numPages, p + 1))}
                disabled={pageNum >= numPages}
                className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-neutral-700 mx-1" />
            </>
          )}

          <button
            onClick={zoomOut}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-neutral-400 px-1 min-w-12 text-center">{zoom}%</span>
          <button
            onClick={zoomIn}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-neutral-700 mx-1" />

          <button
            onClick={rotate}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          {onDownload && (
            <>
              <div className="w-px h-5 bg-neutral-700 mx-1" />
              <button
                onClick={onDownload}
                className="flex items-center gap-1.5 px-3 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </>
          )}
        </div>
      </div>

      {/* Viewer content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {isPdf ? (
          <iframe
            ref={iframeRef}
            src={`${fileUrl}#view=FitH&zoom=${zoom}&page=${pageNum}`}
            className="w-full h-full bg-white rounded-lg shadow-2xl"
            style={{ transform: `rotate(${rotation}deg)` }}
            title={title}
            onLoad={() => {
              try {
                setNumPages(1);
              } catch { /* cross-origin */ }
            }}
          />
        ) : isImage ? (
          <img
            src={fileUrl}
            alt={title}
            className="max-w-none rounded-lg shadow-2xl transition-transform"
            style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)`, transformOrigin: 'center' }}
          />
        ) : (
          <div className="text-center text-neutral-400">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-sm mb-4">Preview not available for {fileType.toUpperCase()} files</p>
            {onDownload && (
              <button onClick={onDownload} className="btn-primary">
                <Download className="w-4 h-4" /> Download to View
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
