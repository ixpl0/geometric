# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
pnpm install        # Install dependencies
pnpm dev            # Start development server (Vite)
pnpm build          # Type-check and build for production
pnpm type-check     # Run TypeScript type checking with vue-tsc
pnpm lint           # Run ESLint with auto-fix
pnpm format         # Format code with Prettier
```

## Architecture

Interactive physics simulation app built with Vue 3 + Vite using Matter.js for physics and PixiJS/Tone.js for rendering/audio.

### Key Patterns

**Scene System**: Scenes are Vue components in `src/scenes/` that use the `useScene` composable. Each scene:
- Receives `isRunning`, `shouldRestart`, `isMuted` props from App.vue
- Implements `setupScene` hook to create physics bodies (walls, balls, etc.)
- Implements `setupEventHandlers` for collision detection and mouse interaction
- Implements `animate` hook for per-frame logic (velocity limits, visual effects)

**Composables** (`src/composables/`):
- `useScene` - Core physics engine wrapper around Matter.js (engine, world, render, runner lifecycle)
- `useCollisionSounds` - Tone.js audio for collision events with lazy initialization
- `useRainbowColors` - HSL color animation based on body velocity

**Type Definitions** (`src/types/scene.ts`): `SceneConfig` interface for scene dimensions, gravity, appearance.

### Scene Flow
1. App.vue manages scene selection and control state (running, muted, restart trigger)
2. Selected scene component receives state via props
3. Scene uses `useScene` to init Matter.js engine on mount
4. Control changes propagate via watchers, emits sync state back to parent

## Code Style

- Vue 3 Composition API with `<script setup lang="ts">`
- Prefer `ref` over `reactive`
- Use `const` and arrow functions
- Immutable operations (no push/pop/splice)
- Never use `any` - use `unknown` with type narrowing or generics
- No comments in code (only for eslint-disable or TODOs)
- Path alias: `@/` maps to `src/`
