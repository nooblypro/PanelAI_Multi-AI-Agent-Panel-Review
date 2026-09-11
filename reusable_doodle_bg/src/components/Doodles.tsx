import type { CSSProperties } from 'react';

type DoodleProps = {
  className?: string;
  style?: CSSProperties;
  title?: string;
};

const base = (className?: string) => className ?? '';

/* A small hand-drawn car, isometric-ish, black outline */
export function DoodleCar({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 64 44"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M6 30 L8 20 Q10 14 18 14 L40 14 Q46 14 50 20 L56 26 L58 28 Q60 29 60 32 L60 34" />
      <path d="M6 30 L6 34 Q6 36 8 36 L58 36 Q60 36 60 34" />
      <path d="M20 14 L22 6 Q23 4 25 4 L37 4 Q39 4 40 6 L42 14" />
      <path d="M24 14 L25 8 L31 8 L32 14" />
      <path d="M34 14 L35 8 L37 8 L38 14" />
      <circle cx="18" cy="36" r="5" fill="#fffdf7" />
      <circle cx="18" cy="36" r="2" fill="#1f2233" stroke="none" />
      <circle cx="48" cy="36" r="5" fill="#fffdf7" />
      <circle cx="48" cy="36" r="2" fill="#1f2233" stroke="none" />
      <path d="M44 20 L48 20" />
    </svg>
  );
}

export function DoodleTree({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 48 56"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M24 36 L24 52" />
      <path d="M24 52 L20 50 M24 52 L28 50" />
      <path d="M24 36 Q4 32 12 18 Q8 6 24 8 Q40 6 36 18 Q44 32 24 36 Z" fill="#e3f7ec" />
      <path d="M18 20 Q22 16 24 20" />
      <path d="M28 24 Q30 20 32 24" />
    </svg>
  );
}

export function DoodleTrafficLight({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 28 56"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M10 52 L18 52" />
      <path d="M14 52 L14 46" />
      <rect x="6" y="4" width="16" height="42" rx="4" fill="#fffdf7" />
      <circle cx="14" cy="13" r="3.4" fill="#e8624a" stroke="#1f2233" />
      <circle cx="14" cy="25" r="3.4" fill="#f6a623" stroke="#1f2233" />
      <circle cx="14" cy="37" r="3.4" fill="#1f9d63" stroke="#1f2233" />
    </svg>
  );
}

export function DoodleRoadSign({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 56 56"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M28 52 L28 34" />
      <path d="M28 52 L24 50 M28 52 L32 50" />
      <path d="M6 12 L50 12 L44 24 L50 36 L6 36 L12 24 Z" fill="#fff3da" />
      <path d="M14 20 L42 20" />
      <path d="M14 28 L34 28" />
    </svg>
  );
}

export function DoodleBusStop({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 56 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M10 62 L10 14 Q10 8 16 8 L34 8 Q40 8 40 14 L40 48" />
      <path d="M40 62 L40 54" />
      <path d="M10 62 L40 62" />
      <path d="M14 14 L14 24 L36 24 L36 14" />
      <path d="M14 30 L18 30 M22 30 L26 30 M30 30 L34 30" />
      <path d="M14 38 L36 38" />
      <circle cx="16" cy="48" r="3" fill="#fffdf7" />
      <circle cx="34" cy="48" r="3" fill="#fffdf7" />
    </svg>
  );
}

export function DoodleBench({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 56 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M6 22 L50 22" />
      <path d="M6 16 L50 16" />
      <path d="M12 22 L12 28 M44 22 L44 28" />
      <path d="M10 28 L14 28 M42 28 L46 28" />
      <path d="M6 16 L6 12 M50 16 L50 12" />
    </svg>
  );
}

export function DoodleCup({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 40 44"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M8 14 L32 14 L29 38 Q28 42 24 42 L16 42 Q12 42 11 38 Z" fill="#fff3da" />
      <path d="M32 18 Q38 18 38 24 Q38 30 32 30" />
      <path d="M14 8 Q14 4 16 4" />
      <path d="M22 8 Q22 4 24 4" />
      <path d="M8 14 L8 10 L32 10 L32 14" />
    </svg>
  );
}

export function DoodleRestroom({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 44 56"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <rect x="4" y="4" width="36" height="48" rx="4" fill="#e8f0ff" />
      <circle cx="16" cy="16" r="3.4" fill="#1f2233" stroke="none" />
      <path d="M16 20 L16 34 M12 22 L20 22 M16 34 L13 44 M16 34 L19 44" />
      <circle cx="30" cy="16" r="3.4" fill="#1f2233" stroke="none" />
      <path d="M30 20 L30 30 M26 22 L34 22 M26 30 L34 30 L34 44 L26 44 Z" fill="#fffdf7" />
    </svg>
  );
}

export function DoodleCloud({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 64 36"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M12 28 Q4 28 6 20 Q4 12 14 14 Q16 6 26 8 Q34 4 38 12 Q50 10 50 20 Q58 22 54 28 Z" fill="#fffdf7" />
    </svg>
  );
}

export function DoodleHeart({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 44 40"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M22 36 Q4 24 4 14 Q4 4 12 4 Q18 4 22 12 Q26 4 32 4 Q40 4 40 14 Q40 24 22 36 Z" fill="#fde9e3" />
    </svg>
  );
}

/* Hand-drawn bicycle */
export function DoodleBicycle({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 64 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Rear wheel */}
      <circle cx="15" cy="33" r="10" fill="#fffdf7" />
      <circle cx="15" cy="33" r="2.5" fill="#1f2233" stroke="none" />
      <path d="M15 23 L15 43 M5 33 L25 33" strokeWidth={1.5} />
      {/* Front wheel */}
      <circle cx="49" cy="33" r="10" fill="#fffdf7" />
      <circle cx="49" cy="33" r="2.5" fill="#1f2233" stroke="none" />
      <path d="M49 23 L49 43 M39 33 L59 33" strokeWidth={1.5} />
      {/* Frame */}
      <path d="M15 33 L28 33 L39 19 L23 19 Z" fill="#e8f0ff" />
      <path d="M28 33 L23 13" />
      {/* Saddle */}
      <path d="M19 13 Q24 11 28 13" strokeWidth={3} />
      {/* Fork & Handlebars */}
      <path d="M49 33 L42 13 L47 11" />
      <path d="M44 11 Q48 9 51 13" />
      {/* Pedals */}
      <circle cx="28" cy="33" r="3" fill="#fffdf7" />
    </svg>
  );
}

/* Smiling cheerful sun with rays */
export function DoodleSun({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 56 56"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Center circle */}
      <circle cx="28" cy="28" r="13" fill="#fff3da" />
      {/* Gentle face */}
      <circle cx="23" cy="26" r="1.6" fill="#1f2233" stroke="none" />
      <circle cx="33" cy="26" r="1.6" fill="#1f2233" stroke="none" />
      <path d="M24 31 Q28 35 32 31" />
      {/* Cheeks */}
      <ellipse cx="20" cy="29" rx="2" ry="1.2" fill="#fde9e3" stroke="none" />
      <ellipse cx="36" cy="29" rx="2" ry="1.2" fill="#fde9e3" stroke="none" />
      {/* Rays */}
      <path d="M28 5 L28 10" />
      <path d="M28 46 L28 51" />
      <path d="M5 28 L10 28" />
      <path d="M46 28 L51 28" />
      <path d="M12 12 L16 16" />
      <path d="M40 40 L44 44" />
      <path d="M44 12 L40 16" />
      <path d="M12 44 L16 40" />
    </svg>
  );
}

/* Hand-drawn 4-point sparkle star */
export function DoodleSparkle({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 36 36"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path
        d="M18 3 Q18 18 3 18 Q18 18 18 33 Q18 18 33 18 Q18 18 18 3 Z"
        fill="#fff3da"
      />
      <circle cx="28" cy="8" r="1.5" fill="#f6a623" stroke="none" />
      <circle cx="8" cy="28" r="1.2" fill="#f6a623" stroke="none" />
    </svg>
  );
}

/* Map pin / location marker doodle */
export function DoodlePin({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 40 52"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <ellipse cx="20" cy="48" rx="8" ry="3" fill="#1f2233" opacity="0.15" stroke="none" />
      <path
        d="M20 4 C11 4 7 11 7 19 C7 29 18 43 20 46 C22 43 33 29 33 19 C33 11 29 4 20 4 Z"
        fill="#fde9e3"
      />
      <circle cx="20" cy="18" r="5" fill="#fffdf7" />
      <circle cx="20" cy="18" r="2" fill="#e8624a" stroke="none" />
    </svg>
  );
}

/* Sweet wildflower / daisy */
export function DoodleFlower({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 42 54"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Stem */}
      <path d="M21 24 Q18 38 21 51" />
      {/* Leaves */}
      <path d="M20 38 Q10 35 12 42 Q18 43 20 38 Z" fill="#e3f7ec" />
      <path d="M21 32 Q30 28 30 36 Q24 37 21 32 Z" fill="#e3f7ec" />
      {/* Petals */}
      <circle cx="21" cy="9" r="5" fill="#fffdf7" />
      <circle cx="28" cy="14" r="5" fill="#fffdf7" />
      <circle cx="26" cy="22" r="5" fill="#fffdf7" />
      <circle cx="16" cy="22" r="5" fill="#fffdf7" />
      <circle cx="14" cy="14" r="5" fill="#fffdf7" />
      {/* Flower center */}
      <circle cx="21" cy="16" r="4.5" fill="#f6a623" />
    </svg>
  );
}

/* Flying little bird */
export function DoodleBird({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 48 38"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path
        d="M10 24 C14 16 24 14 34 15 C38 15 42 18 44 21 C41 27 34 30 24 29 C16 29 10 32 6 34 C8 30 9 26 10 24 Z"
        fill="#e8f0ff"
      />
      {/* Wing */}
      <path d="M22 17 Q28 6 36 12 Q28 20 22 21 Z" fill="#fffdf7" />
      {/* Beak & eye */}
      <path d="M42 19 L47 21 L42 23" fill="#f6a623" />
      <circle cx="36" cy="19" r="1.5" fill="#1f2233" stroke="none" />
      {/* Tail feather line */}
      <path d="M6 34 L12 28" />
    </svg>
  );
}

/* Mountain range with snowy peaks */
export function DoodleMountains({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 68 44"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Back/Right mountain */}
      <path d="M30 40 L48 12 L64 40 Z" fill="#efe8fb" />
      <path d="M42 22 Q46 25 48 23 Q50 26 55 22 L48 12 Z" fill="#fffdf7" />
      {/* Front/Left mountain */}
      <path d="M4 40 L26 8 L48 40 Z" fill="#e8f0ff" />
      <path d="M19 19 Q23 23 26 20 Q29 24 34 19 L26 8 Z" fill="#fffdf7" />
      {/* Ridge lines */}
      <path d="M26 20 L24 40" strokeWidth={1.8} />
      <path d="M48 23 L49 40" strokeWidth={1.8} />
    </svg>
  );
}

/* Floating hot air balloon */
export function DoodleHotAirBalloon({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 46 62"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Balloon envelope */}
      <path
        d="M13 25 C9 12 37 12 33 25 C30 33 27 38 25 41 L21 41 C19 38 16 33 13 25 Z"
        fill="#fff3da"
      />
      {/* Stripes */}
      <path d="M23 7 Q17 24 21 41" strokeWidth={1.8} fill="#fde9e3" opacity="0.7" />
      <path d="M23 7 Q29 24 25 41" strokeWidth={1.8} fill="#e8f0ff" opacity="0.7" />
      {/* Rigging cables */}
      <path d="M20 41 L19 49 M26 41 L27 49" strokeWidth={1.8} />
      {/* Basket */}
      <path d="M17 49 L29 49 L27 57 L19 57 Z" fill="#f5edd4" />
      <path d="M17 53 L29 53" strokeWidth={1.5} />
    </svg>
  );
}

/* Hand-drawn mini rainbow */
export function DoodleRainbow({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 54 36"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Outer red/coral arch */}
      <path d="M8 32 A19 19 0 0 1 46 32" stroke="#e8624a" strokeWidth={3} />
      {/* Middle gold/sun arch */}
      <path d="M14 32 A13 13 0 0 1 40 32" stroke="#f6a623" strokeWidth={3} />
      {/* Inner sky arch */}
      <path d="M20 32 A7 7 0 0 1 34 32" stroke="#2f6fed" strokeWidth={3} />
      {/* Left cloud puff */}
      <path d="M4 32 Q2 27 7 26 Q9 23 13 25 Q16 27 15 32 Z" fill="#fffdf7" stroke="currentColor" strokeWidth={2} />
      {/* Right cloud puff */}
      <path d="M39 32 Q38 27 43 25 Q46 23 49 26 Q52 28 50 32 Z" fill="#fffdf7" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

/* Navigational compass doodle */
export function DoodleCompass({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 46 46"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <circle cx="23" cy="23" r="18" fill="#fffdf7" />
      {/* Dial ticks */}
      <path d="M23 7 L23 10 M23 36 L23 39 M7 23 L10 23 M36 23 L39 23" strokeWidth={2} />
      {/* North needle */}
      <path d="M23 10 L27 23 L23 23 Z" fill="#e8624a" />
      <path d="M23 10 L19 23 L23 23 Z" fill="#c8492f" />
      {/* South needle */}
      <path d="M23 36 L27 23 L23 23 Z" fill="#1f2233" />
      <path d="M23 36 L19 23 L23 23 Z" fill="#3a3f57" />
      {/* Pivot */}
      <circle cx="23" cy="23" r="2.5" fill="#fffdf7" />
    </svg>
  );
}

/* Cheerful music notes for road trip playlist */
export function DoodleMusic({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 40 38"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M12 28 A4 3 20 1 1 8 24 L8 9 L28 4 L28 22 A4 3 20 1 1 24 18 L24 5 M8 13 L28 8" />
      <circle cx="8" cy="26" r="3.5" fill="#1f2233" stroke="none" />
      <circle cx="24" cy="20" r="3.5" fill="#1f2233" stroke="none" />
      {/* Sparkle note accent */}
      <path d="M33 10 Q35 8 37 10" strokeWidth={1.8} />
    </svg>
  );
}

/* Roadside cafe / cozy shop */
export function DoodleCoffeeShop({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 54 50"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Building base */}
      <rect x="8" y="20" width="38" height="26" rx="2" fill="#fffdf7" />
      {/* Striped awning */}
      <path d="M5 20 L49 20 L45 10 L9 10 Z" fill="#fff3da" />
      <path d="M15 10 L13 20 M23 10 L22 20 M31 10 L32 20 M39 10 L41 20" strokeWidth={1.8} />
      <path d="M5 20 Q9 24 13 20 Q17 24 22 20 Q27 24 32 20 Q37 24 41 20 Q45 24 49 20" />
      {/* Window */}
      <rect x="13" y="27" width="13" height="12" rx="2" fill="#e8f0ff" />
      <path d="M13 33 L26 33 M19.5 27 L19.5 39" strokeWidth={1.5} />
      {/* Door */}
      <path d="M32 46 L32 28 L41 28 L41 46" fill="#fde9e3" />
      <circle cx="39" cy="37" r="1.5" fill="#1f2233" stroke="none" />
    </svg>
  );
}

/* EV Charging station / Gas pump */
export function DoodleGasStation({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 46 54"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Pump body */}
      <rect x="8" y="10" width="22" height="38" rx="4" fill="#e3f7ec" />
      <path d="M5 48 L33 48" />
      {/* Screen */}
      <rect x="13" y="16" width="12" height="10" rx="2" fill="#fffdf7" />
      {/* Lightning bolt EV icon */}
      <path d="M20 18 L17 22 L20 22 L18 25" strokeWidth={1.8} stroke="#1f9d63" />
      {/* Hose & Nozzle */}
      <path d="M30 20 Q39 20 38 34 Q37 42 41 36 L41 22 L38 20" />
      <circle cx="41" cy="22" r="2" fill="#fffdf7" />
    </svg>
  );
}

/* Fluttering butterfly */
export function DoodleButterfly({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 42 36"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Left wings */}
      <path d="M21 16 Q8 4 6 15 Q6 23 21 21" fill="#efe8fb" />
      <path d="M21 21 Q10 24 12 31 Q18 34 21 24" fill="#fde9e3" />
      {/* Right wings */}
      <path d="M21 16 Q34 4 36 15 Q36 23 21 21" fill="#efe8fb" />
      <path d="M21 21 Q32 24 30 31 Q24 34 21 24" fill="#fde9e3" />
      {/* Body & antennae */}
      <path d="M21 13 L21 26" strokeWidth={2.6} />
      <path d="M21 13 Q16 8 15 10 M21 13 Q26 8 27 10" strokeWidth={1.8} />
    </svg>
  );
}

/* Gentle wind breeze swirl */
export function DoodleSwirl({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 48 26"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M4 16 Q18 16 26 10 Q32 4 37 8 Q41 12 36 16 Q31 18 29 13 Q28 8 33 6" />
      <path d="M10 22 Q20 22 28 18 Q34 14 40 18" strokeWidth={1.8} opacity="0.6" />
    </svg>
  );
}

/* Arch bridge over calm stream */
export function DoodleBridge({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 58 36"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Bridge roadway */}
      <path d="M4 20 Q29 10 54 20" />
      <path d="M4 25 Q29 15 54 25" />
      {/* Arch underneath */}
      <path d="M12 29 Q29 16 46 29" fill="#e8f0ff" />
      {/* Railing posts */}
      <path d="M16 22 L16 17 M29 18 L29 13 M42 22 L42 17" strokeWidth={1.8} />
      {/* Water ripples */}
      <path d="M6 31 Q12 29 18 31 M24 33 Q30 31 36 33 M42 31 Q48 29 54 31" strokeWidth={1.6} stroke="#2f6fed" opacity="0.6" />
    </svg>
  );
}

/* Happy little puppy */
export function DoodleDog({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 46 44"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Head & ears */}
      <path d="M14 14 C10 8 6 16 9 24 C11 28 15 32 23 32 C31 32 35 28 37 24 C40 16 36 8 32 14" fill="#fff3da" />
      <path d="M14 14 Q23 10 32 14" />
      {/* Left floppy ear */}
      <path d="M12 14 Q6 16 8 25 Q11 27 14 20" fill="#f5edd4" />
      {/* Right floppy ear */}
      <path d="M34 14 Q40 16 38 25 Q35 27 32 20" fill="#f5edd4" />
      {/* Eyes */}
      <circle cx="18" cy="20" r="2" fill="#1f2233" stroke="none" />
      <circle cx="28" cy="20" r="2" fill="#1f2233" stroke="none" />
      {/* Snout & nose */}
      <ellipse cx="23" cy="25" rx="3" ry="2" fill="#1f2233" stroke="none" />
      <path d="M23 27 L23 30 M20 30 Q23 32 26 30" />
      {/* Happy tongue */}
      <path d="M21 31 Q23 37 25 31 Z" fill="#fde9e3" />
    </svg>
  );
}

/* Winding scenic road doodle */
export function DoodleWindingRoad({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 54 42"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Road ribbon */}
      <path
        d="M8 38 Q22 36 24 26 Q26 14 42 12 Q48 11 50 6"
        strokeWidth={14}
        stroke="#f5edd4"
        strokeLinecap="butt"
      />
      {/* Road border lines */}
      <path d="M4 42 Q20 40 21 28 Q23 16 39 15 Q46 14 48 4" strokeWidth={2.2} />
      <path d="M12 34 Q24 32 27 24 Q29 12 45 9 Q50 9 52 8" strokeWidth={2.2} />
      {/* Dashed centerline */}
      <path
        d="M8 38 Q22 36 24 26 Q26 14 42 12 Q48 11 50 6"
        strokeWidth={2}
        strokeDasharray="3 4"
        stroke="#1f2233"
      />
    </svg>
  );
}

/* Cozy cottage / destination home */
export function DoodleHouse({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 48 50"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Chimney smoke */}
      <path d="M35 10 Q38 6 36 3 Q34 0 38 -2" strokeWidth={1.8} opacity="0.6" />
      {/* Chimney */}
      <path d="M32 18 L32 8 L37 8 L37 18" fill="#fde9e3" />
      {/* Roof */}
      <path d="M6 22 L24 6 L42 22 Z" fill="#fff3da" />
      {/* Body */}
      <rect x="10" y="22" width="28" height="22" rx="2" fill="#fffdf7" />
      {/* Window */}
      <rect x="14" y="26" width="8" height="8" rx="1.5" fill="#e8f0ff" />
      <path d="M14 30 L22 30 M18 26 L18 34" strokeWidth={1.5} />
      {/* Door */}
      <path d="M27 44 L27 32 L34 32 L34 44" fill="#f5edd4" />
      <circle cx="32" cy="38" r="1" fill="#1f2233" stroke="none" />
    </svg>
  );
}

/* Swirling gentle leaves */
export function DoodleLeaves({ className, style, title }: DoodleProps) {
  return (
    <svg
      className={base(className)}
      style={style}
      viewBox="0 0 40 38"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <path d="M8 20 Q12 8 24 10 Q22 22 8 20 Z" fill="#e3f7ec" />
      <path d="M8 20 Q16 16 24 10" strokeWidth={1.6} />
      <path d="M22 28 Q30 18 38 24 Q30 34 22 28 Z" fill="#fff3da" />
      <path d="M22 28 Q30 25 38 24" strokeWidth={1.6} />
    </svg>
  );
}

