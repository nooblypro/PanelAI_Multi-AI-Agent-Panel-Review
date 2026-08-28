import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ConfidenceGaugeProps {
  value: number; // 0-100
  size?: number; // diameter in px
  stroke?: number;
  color?: string;
  label?: string;
}

export function ConfidenceGauge({
  value,
  size = 120,
  stroke = 8,
  color = '#4C8DFF',
  label = 'Confidence',
}: ConfidenceGaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-text" style={{ fontSize: size * 0.22 }}>
            {Math.round(animatedValue)}%
          </span>
        </div>
      </div>
      {label && <span className="text-[11px] text-muted font-medium">{label}</span>}
    </div>
  );
}
