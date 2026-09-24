import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { EASE_PREMIUM, VIEWPORT_ONCE } from '../../lib/motion';

export interface ImageRevealProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: string;
}

export const ImageReveal: React.FC<ImageRevealProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = '',
  aspectRatio,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return (
      <div className={`overflow-hidden rounded-2xl ${containerClassName}`} style={{ aspectRatio }}>
        <img
          src={src}
          alt={alt}
          className={className}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={VIEWPORT_ONCE}
      transition={{ duration: 0.7, ease: EASE_PREMIUM }}
      className={`overflow-hidden rounded-2xl ${containerClassName}`}
      style={{ aspectRatio }}
    >
      <motion.img
        src={src}
        alt={alt}
        initial={{ scale: 1.04 }}
        whileInView={{ scale: 1 }}
        viewport={VIEWPORT_ONCE}
        transition={{ duration: 0.8, ease: EASE_PREMIUM }}
        className={className}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </motion.div>
  );
};

export default ImageReveal;
