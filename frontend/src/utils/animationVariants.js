// Centralized Animation Variants for NIFTY50 AI Dashboard

export const pageTransition = {
  initial: { opacity: 0, y: 12, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, filter: 'blur(4px)' },
  transition: { duration: 0.35, ease: [0.25, 0.4, 0.25, 1] }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] } 
  }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { duration: 0.4, ease: 'easeOut' } 
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] } 
  }
};

export const blurIn = {
  hidden: { opacity: 0, filter: 'blur(10px)', scale: 0.96 },
  visible: { 
    opacity: 1, 
    filter: 'blur(0px)', 
    scale: 1, 
    transition: { duration: 0.6, ease: [0.25, 0.4, 0.25, 1] } 
  }
};

export const buttonHover = {
  hover: { scale: 1.03, y: -2 },
  tap: { scale: 0.97 }
};
