# Hero Game Component

An interactive particle-based game component used in the hero section of [juanfkurucz.github.io](https://juanfkurucz.github.io).

## Features

- Interactive particle animation
- Click and drag functionality
- Mobile-friendly touch support
- Responsive canvas sizing
- Game-like interaction hints

## Installation

This package is used as a submodule in the main website repository. To use it:

```bash
# In the main repository
git submodule add git@github.com:JuanFKurucz/juanfkurucz-hero-game.git components/game
```

## Development

1. Clone the repository:
```bash
git clone git@github.com:JuanFKurucz/juanfkurucz-hero-game.git
cd juanfkurucz-hero-game
```

2. Install dependencies:
```bash
npm install
```

3. Run development tasks:
```bash
npm run lint    # Run ESLint
npm run format  # Run Prettier
npm run build   # Build TypeScript
```

## Usage

```tsx
import { ParticleCanvas } from '@/components/game';

export default function Hero() {
  return (
    <div>
      <ParticleCanvas />
    </div>
  );
}
```

## License

All rights reserved. 