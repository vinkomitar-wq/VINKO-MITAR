import React, { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Play,
  Pause,
} from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";

interface VesselLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  vesselName: string;
  initialIndex?: number;
}

export default function VesselLightbox({
  isOpen,
  onClose,
  images,
  vesselName,
  initialIndex = 0,
}: VesselLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Sync initialIndex whenever the lightbox is opened
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsPlaying(false);
    }
  }, [isOpen, initialIndex]);

  // Slideshow Autoplay Effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isOpen && isPlaying) {
      intervalId = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 3500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isOpen, isPlaying, images.length]);

  // Keyboard navigation support for premium user experience
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentIndex, images.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Monitor browser physical full-screen changes
  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 backdrop-blur-md select-none touch-none">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/80 to-transparent z-10">
          <div>
            <h3 className="text-sm font-serif italic text-white/90 tracking-wider">
              {vesselName} Gallery
            </h3>
            <p className="text-[10px] font-sans font-medium text-slate-400 mt-0.5 uppercase tracking-widest">
              Image {currentIndex + 1} of {images.length}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Play/Pause Autoplay Slideshow */}
            {images.length > 1 && (
              <button
                id="lightbox-btn-slideshow"
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title={isPlaying ? "Pause Slideshow" : "Start Slideshow"}
              >
                {isPlaying ? (
                  <Pause className="h-4.5 w-4.5" />
                ) : (
                  <Play className="h-4.5 w-4.5" />
                )}
              </button>
            )}

            {/* Browser Fullscreen Toggle */}
            <button
              id="lightbox-btn-fullscreen"
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer hidden md:block"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4.5 w-4.5" />
              ) : (
                <Maximize2 className="h-4.5 w-4.5" />
              )}
            </button>

            {/* Close Lightbox */}
            <button
              id="lightbox-btn-close"
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer hover:rotate-90 duration-300"
              title="Close Lightbox"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Central Display */}
        <div className="relative flex-1 flex items-center justify-center px-4 sm:px-12">
          {/* Navigation Arrows - Prev */}
          {images.length > 1 && (
            <button
              id="lightbox-btn-prev"
              type="button"
              onClick={handlePrev}
              className="absolute left-4 sm:left-8 z-10 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-3xs"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Actual High-Res Photo Container */}
          <div className="w-full max-w-5xl h-full max-h-[72vh] flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <ImageWithFallback
                key={currentIndex}
                src={images[currentIndex]}
                alt={`${vesselName} High Resolution Photos - Slide ${currentIndex + 1}`}
                referrerPolicy="no-referrer"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className={`max-w-full max-h-full object-contain shadow-2xl rounded-sm ${images.length > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
                draggable={false}
                drag={images.length > 1 ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, { offset }) => {
                  if (images.length <= 1) return;
                  if (offset.x < -40) {
                    handleNext();
                  } else if (offset.x > 40) {
                    handlePrev();
                  }
                }}
              />
            </AnimatePresence>
          </div>

          {/* Navigation Arrows - Next */}
          {images.length > 1 && (
            <button
              id="lightbox-btn-next"
              type="button"
              onClick={handleNext}
              className="absolute right-4 sm:right-8 z-10 p-3 rounded-full bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all cursor-pointer backdrop-blur-3xs"
              aria-label="Next image"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Bottom Filmstrip Thumbnails Preview Strip */}
        <div className="px-6 py-6 bg-gradient-to-t from-black/90 to-transparent flex flex-col items-center gap-3">
          {images.length > 1 && (
            <div className="flex gap-2 max-w-full overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  id={`lightbox-thumbnail-${idx}`}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative aspect-video w-16 sm:w-24 shrink-0 rounded-xs overflow-hidden transition-all duration-200 cursor-pointer ${
                    currentIndex === idx
                      ? "ring-2 ring-amber-400 opacity-100 scale-105"
                      : "opacity-45 hover:opacity-85 ring-1 ring-white/10"
                  }`}
                  aria-label={`Show slide number ${idx + 1}`}
                >
                  <ImageWithFallback
                    src={img}
                    alt={`Thumbnail preview ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <span className="text-[9px] uppercase tracking-widest font-sans text-slate-500 font-bold">
            Phuket Luxury Yacht Charters • Interactive Full Resolution Slideshow
          </span>
        </div>
      </div>
    </AnimatePresence>
  );
}
