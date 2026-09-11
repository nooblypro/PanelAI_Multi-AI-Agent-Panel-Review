import { DoodleDecoration } from './components/DoodleDecoration';

export default function App() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <DoodleDecoration />
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <h1 className="font-hand text-4xl md:text-6xl mb-4">Doodle Background Demo</h1>
        <p className="text-lg md:text-xl text-ink-soft max-w-xl text-center">
          Animated hand-drawn decorations floating around the page edges.
          Check the margins and corners!
        </p>
      </main>
    </div>
  );
}
