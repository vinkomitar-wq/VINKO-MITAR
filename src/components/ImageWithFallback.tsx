import React, { useState, useEffect } from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { Ship } from "lucide-react";

interface ImageWithFallbackProps extends HTMLMotionProps<"img"> {
  src?: string;
  fallbackSrc?: string;
  alt?: string;
  usePlaceholderIcon?: boolean;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc = "https://images.unsplash.com/photo-1544528148-3554460d2b78?auto=format&fit=crop&q=80&w=800",
  alt = "Image",
  usePlaceholderIcon = true,
  className,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn("Image failed to load, falling back:", src);
    if (!hasError) {
      if (usePlaceholderIcon) {
        setImgSrc(undefined);
      } else {
        setImgSrc(fallbackSrc);
      }
      setHasError(true);
    }
  };

  if (imgSrc === undefined || (hasError && usePlaceholderIcon)) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-400 ${className}`}
      >
        <Ship className="h-8 w-8 mb-2 opacity-50" />
        <span className="text-[10px] uppercase tracking-widest font-bold">
          Image Unavailable
        </span>
      </div>
    );
  }

  return (
    <motion.img
      {...props}
      src={imgSrc}
      alt={alt}
      onError={handleError}
      className={className}
      referrerPolicy="no-referrer"
    />
  );
};
