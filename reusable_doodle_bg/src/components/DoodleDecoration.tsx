import {
  DoodleCar,
  DoodleTree,
  DoodleTrafficLight,
  DoodleRoadSign,
  DoodleBusStop,
  DoodleBench,
  DoodleCup,
  DoodleRestroom,
  DoodleCloud,
  DoodleHeart,
  DoodleBicycle,
  DoodleSun,
  DoodleSparkle,
  DoodlePin,
  DoodleFlower,
  DoodleBird,
  DoodleHotAirBalloon,
  DoodleRainbow,
  DoodleCompass,
  DoodleMusic,
  DoodleCoffeeShop,
  DoodleGasStation,
  DoodleButterfly,
  DoodleSwirl,
  DoodleBridge,
  DoodleDog,
  DoodleWindingRoad,
  DoodleHouse,
  DoodleLeaves,
} from './Doodles';

/**
 * Ambient doodle decoration.
 * Doodles sit in margins, corners, and atmospheric background layers
 * with pointer-events disabled so they never block user interaction.
 */
export function DoodleDecoration() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* =========================================
          TOP SKY / ATMOSPHERE LAYER
          ========================================= */}
      {/* Cheerful Sun */}
      <DoodleSun
        className="absolute top-4 right-8 sm:right-16 w-14 sm:w-16 text-sun-dark/45 animate-spinSlow"
        style={{ animationDuration: '30s' }}
      />

      {/* Floating Rainbow */}
      <DoodleRainbow
        className="absolute top-5 left-10 sm:left-24 w-14 sm:w-18 text-ink/35 animate-floatySlow"
        style={{ animationDelay: '0.5s' }}
      />

      {/* Clouds drifting */}
      <DoodleCloud
        className="absolute top-16 left-4 sm:left-10 w-20 sm:w-24 text-ink/30 animate-floaty"
        style={{ animationDelay: '0.2s' }}
      />
      <DoodleCloud
        className="absolute top-8 left-[38%] w-16 sm:w-20 text-ink/20 animate-floatySlow hidden md:block"
        style={{ animationDelay: '1.4s' }}
      />
      <DoodleCloud
        className="absolute top-20 right-28 sm:right-44 w-16 sm:w-22 text-ink/25 animate-floaty"
        style={{ animationDelay: '0.8s' }}
      />

      {/* Hot Air Balloon */}
      <DoodleHotAirBalloon
        className="absolute top-24 right-16 sm:right-32 w-10 sm:w-12 text-ink/35 animate-floatySlow"
        style={{ animationDelay: '1.2s' }}
      />

      {/* Flying Birds */}
      <DoodleBird
        className="absolute top-12 left-[28%] w-8 text-sky-dark/40 animate-flutter"
        style={{ animationDelay: '0.3s' }}
      />
      <DoodleBird
        className="absolute top-28 left-[18%] w-7 text-ink/30 animate-flutter hidden sm:block"
        style={{ animationDelay: '1.1s' }}
      />

      {/* Twinkling Sparkles in the sky */}
      <DoodleSparkle
        className="absolute top-10 left-[48%] w-5 text-sun-dark/50 animate-twinkle"
        style={{ animationDelay: '0.2s' }}
      />
      <DoodleSparkle
        className="absolute top-32 left-32 w-6 text-sun-dark/40 animate-twinkle hidden sm:block"
        style={{ animationDelay: '1.5s' }}
      />
      <DoodleSparkle
        className="absolute top-14 right-[32%] w-5 text-sun-dark/45 animate-twinkle"
        style={{ animationDelay: '0.9s' }}
      />

      {/* =========================================
          LEFT MARGIN CLUSTER (Exploration & Nature)
          ========================================= */}
      {/* Pine / Forest Trees */}
      <DoodleTree
        className="absolute top-52 left-2 sm:left-5 w-12 text-leaf-dark/40 animate-sway"
        style={{ animationDelay: '0.2s' }}
      />
      <DoodleTree
        className="absolute top-[480px] left-1 sm:left-3 w-10 text-leaf-dark/35 animate-sway hidden xl:block"
        style={{ animationDelay: '1.6s' }}
      />

      {/* Cruising Bicycle */}
      <DoodleBicycle
        className="absolute top-[370px] left-2 sm:left-4 w-14 sm:w-16 text-sky-dark/40 animate-drive hidden lg:block"
      />

      {/* Roadside Cafe */}
      <DoodleCoffeeShop
        className="absolute top-[560px] left-2 sm:left-5 w-13 sm:w-15 text-sun-dark/40 hidden xl:block"
      />

      {/* Wind breeze & falling leaves */}
      <DoodleSwirl
        className="absolute top-96 left-4 sm:left-8 w-11 text-sky-dark/30 animate-floaty"
        style={{ animationDelay: '0.7s' }}
      />
      <DoodleLeaves
        className="absolute top-[660px] left-3 sm:left-6 w-8 sm:w-9 text-leaf-dark/35 animate-flutter hidden xl:block"
        style={{ animationDelay: '0.5s' }}
      />

      {/* Friendly Dog & Car near bottom-left */}
      <DoodleDog
        className="absolute bottom-52 left-4 sm:left-8 w-10 text-sun-dark/45 animate-wiggle hidden sm:block"
        style={{ animationDelay: '0.3s' }}
      />
      <DoodleCar
        className="absolute bottom-32 left-2 sm:left-5 w-16 text-ink/35 animate-drive"
      />
      <DoodleBusStop
        className="absolute bottom-8 left-4 sm:left-8 w-12 text-sky-dark/35"
      />

      {/* Hearts rising */}
      <DoodleHeart
        className="absolute top-40 left-20 sm:left-28 w-7 text-coral/40 animate-floaty"
        style={{ animationDelay: '1.1s' }}
      />
      <DoodleHeart
        className="absolute bottom-64 left-14 sm:left-20 w-6 text-coral/35 animate-floatySlow hidden sm:block"
        style={{ animationDelay: '2.0s' }}
      />

      {/* =========================================
          RIGHT MARGIN CLUSTER (Wayfinding & Roadside)
          ========================================= */}
      {/* Compass */}
      <DoodleCompass
        className="absolute top-44 right-3 sm:right-6 w-11 text-coral/40 animate-sway"
        style={{ animationDelay: '0.8s' }}
      />

      {/* Traffic Light */}
      <DoodleTrafficLight
        className="absolute top-68 right-2 sm:right-5 w-7 sm:w-8 text-ink/35 animate-floaty"
        style={{ animationDelay: '0.6s' }}
      />

      {/* Road Direction Sign */}
      <DoodleRoadSign
        className="absolute top-[380px] right-2 sm:right-5 w-12 sm:w-14 text-sun-dark/40 hidden lg:block"
      />

      {/* Wildflowers & Fluttering Butterfly */}
      <DoodleFlower
        className="absolute top-[490px] right-3 sm:right-6 w-10 text-coral/40 animate-sway hidden lg:block"
        style={{ animationDelay: '1.3s' }}
      />
      <DoodleButterfly
        className="absolute top-[465px] right-12 sm:right-16 w-8 text-lilac/45 animate-flutter hidden lg:block"
        style={{ animationDelay: '0.4s' }}
      />

      {/* Road Trip Music notes */}
      <DoodleMusic
        className="absolute top-[580px] right-4 sm:right-8 w-8 sm:w-9 text-lilac/40 animate-flutter hidden xl:block"
        style={{ animationDelay: '1.0s' }}
      />

      {/* EV Charging Pump */}
      <DoodleGasStation
        className="absolute top-[680px] right-3 sm:right-6 w-11 text-leaf-dark/40 hidden xl:block"
      />

      {/* Map Location Pin */}
      <DoodlePin
        className="absolute bottom-68 right-4 sm:right-8 w-8 text-coral/45 animate-floaty"
        style={{ animationDelay: '1.7s' }}
      />

      {/* Park Bench Rest Stop & Coffee Cup */}
      <DoodleBench
        className="absolute bottom-40 right-3 sm:right-6 w-14 text-ink/35"
      />
      <DoodleCup
        className="absolute bottom-48 right-16 sm:right-20 w-8 text-sun-dark/40 animate-floatySlow hidden sm:block"
        style={{ animationDelay: '0.9s' }}
      />

      {/* Restroom sign */}
      <DoodleRestroom
        className="absolute bottom-24 right-20 sm:right-28 w-8 text-sky-dark/30 hidden lg:block"
      />

      {/* Cozy Destination Cottage */}
      <DoodleHouse
        className="absolute bottom-8 right-4 sm:right-8 w-12 sm:w-13 text-sun-dark/40"
      />

      {/* Sparkles on the right */}
      <DoodleSparkle
        className="absolute top-80 right-20 w-5 text-sun-dark/40 animate-twinkle hidden sm:block"
        style={{ animationDelay: '1.8s' }}
      />
      <DoodleSparkle
        className="absolute bottom-80 right-14 w-5 text-sun-dark/45 animate-twinkle hidden lg:block"
        style={{ animationDelay: '0.6s' }}
      />

      {/* =========================================
          LOWER ATMOSPHERIC & HORIZON ACCENTS
          ========================================= */}
      {/* Little Arch Bridge */}
      <DoodleBridge
        className="absolute bottom-3 left-[26%] w-16 sm:w-20 text-sky-dark/25 hidden md:block"
      />

      {/* Gentle S-curve Winding Road */}
      <DoodleWindingRoad
        className="absolute bottom-4 right-[28%] w-14 sm:w-18 text-ink/20 hidden md:block"
      />

      {/* Soft floating clouds at bottom */}
      <DoodleCloud
        className="absolute bottom-16 right-[18%] w-16 text-ink/20 animate-floaty hidden sm:block"
        style={{ animationDelay: '1.5s' }}
      />
      <DoodleCloud
        className="absolute bottom-20 left-[18%] w-16 text-ink/15 animate-floatySlow hidden sm:block"
        style={{ animationDelay: '2.2s' }}
      />
    </div>
  );
}

