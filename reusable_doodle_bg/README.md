# Reusable Doodle Background

A standalone mini-project featuring animated hand-drawn SVG decorations (cars, bicycles, clouds, sun, trees, flowers, compass, house, and more) positioned around page edges with floating, swaying, spinning, fluttering, twinkling, and driving animations.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 to see the animated doodle background demo.

## Project Structure

```
reusable_doodle_bg/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    └── components/
        ├── DoodleDecoration.tsx
        └── Doodles.tsx
```

## Features

- Hand-drawn SVG doodles: car, bicycle, clouds, sun, trees, flowers, compass, house, and more
- Positioned around page edges with responsive breakpoints
- Animations: floating, swaying, spinning, fluttering, twinkling, and driving
- Behind content using `z-0` and `pointer-events-none`
- Respects `prefers-reduced-motion` accessibility settings
- Custom Tailwind color palette (ink, paper, sky, leaf, sun, coral, lilac)
- Custom animation keyframes and utilities

## Usage in Your Own Project

Copy the `src/components` folder into your React + Tailwind project:

```tsx
import { DoodleDecoration } from './components/DoodleDecoration';

function App() {
  return (
    <div className="min-h-screen">
      <DoodleDecoration />
      <main className="relative z-10">Your content here</main>
    </div>
  );
}
```

Ensure your Tailwind config includes the custom animations and colors from `tailwind.config.js`, and import the Google Fonts and Tailwind directives from `index.css`.
