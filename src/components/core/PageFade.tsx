import { PropsWithChildren } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DEFAULT_TRANSITION } from '@/config/motion';

export function PageFade({ children }: PropsWithChildren) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={DEFAULT_TRANSITION}
    >
      {children}
    </motion.div>
  );
}
