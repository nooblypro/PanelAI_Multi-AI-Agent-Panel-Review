import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export function ConfidenceBar({
  value,
  color = '#4C8DFF',
  height = 4,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div
      className="w-full rounded-full overflow-hidden bg-white/[0.06]"
      style={{ height }}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${animated}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
