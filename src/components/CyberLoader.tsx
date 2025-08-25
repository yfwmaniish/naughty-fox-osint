import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface CyberLoaderProps {
  text?: string;
  progress?: number;
  showProgress?: boolean;
}

export default function CyberLoader({ text = 'Loading...', progress = 0, showProgress = false }: CyberLoaderProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Animated Scanner */}
      <div className="relative mb-6">
        <div className="w-24 h-24 border-2 border-neon-green rounded-full relative overflow-hidden">
          <motion.div
            className="absolute inset-0 border-t-4 border-neon-blue rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="absolute inset-2 border-2 border-neon-green/50 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* Loading Text */}
      <div className="text-center mb-4">
        <motion.h3
          className="text-neon-green font-mono text-lg font-semibold"
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        >
          {text}{dots}
        </motion.h3>
      </div>

      {/* Progress Bar */}
      {showProgress && (
        <div className="w-64 mb-4">
          <div className="neon-progress h-2">
            <motion.div
              className="neon-progress-bar h-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="text-center mt-2 text-sm text-gray-400 font-mono">
            {Math.round(progress)}%
          </div>
        </div>
      )}

      {/* Matrix-style data stream */}
      <div className="flex space-x-1 text-neon-green font-mono text-xs opacity-60">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          >
            {Math.random() > 0.5 ? '1' : '0'}
          </motion.span>
        ))}
      </div>
    </div>
  );
}