# Repository Guidelines

## Project Structure & Module Organization
- `app/` uses Expo Router for screens and navigation. Examples: `app/(tabs)/index.tsx` (home), `app/note/[id].tsx` (editor), `app/_layout.tsx` (root).
- `components/` reusable UI (e.g., `components/CategoryChip.tsx`, `components/NoteCard.tsx`).
- `lib/` services and context (`lib/supabase.ts`, `lib/NotesContext.tsx`).
- `hooks/` custom hooks (`hooks/useKeyboard.ts`).
- `constants/` design tokens (`constants/theme.ts`).
- `types/` shared TypeScript types. Assets in `assets/`. Native projects in `android/` and `ios/`.

## Build, Test, and Development Commands
- Install: `npm install`
- Start (Dev Client, LAN): `npm run dev` | Tunnel: `npm run dev:tunnel`
- Platform runs: `npm run android`, `npm run ios`
- Web export: `npm run build:web`
- Lint: `npm run lint` (Expo ESLint config)
- Type check: `npm run typecheck`
- EAS build (optional): `eas build --profile preview -p android`

## Coding Style & Naming Conventions
- TypeScript, strict mode; 2‑space indentation.
- ESLint: `eslint-config-expo/flat`. Auto-fix with `npm run lint -- --fix`.
- Components: PascalCase files in `components/` (e.g., `NoteCard.tsx`).
- Hooks: `useSomething` camelCase in `hooks/`.
- Expo Router: keep route filenames under `app/` consistent with navigation (don’t rename without updating routes).
- Types/interfaces PascalCase; variables/functions camelCase. Use path alias `@/*` (see `tsconfig.json`).

## Testing Guidelines
- No automated tests configured yet. Prefer adding Jest + `@testing-library/react-native`.
- Name tests `*.test.ts(x)` beside source or under `__tests__/`.
- Minimum manual QA for PRs: launch via `npm run dev`, verify Home, Editor (`/note/[id]`), and Tabs render without errors on Android and iOS simulators.

## Commit & Pull Request Guidelines
- Follow Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Keep commits small and focused; include a clear summary and rationale.
- PRs must include: concise description, linked issue (if any), screenshots/screen recordings for UI, and a brief test plan (commands run + results).

## Security & Configuration Tips
- Do not commit secrets. Configure runtime keys via Expo env (`EXPO_PUBLIC_*`) or `app.json` `extra` and read them in `lib/`.
- Supabase setup lives in `lib/supabase.ts`; verify keys come from env.
- Avoid direct edits to `android/` and `ios/` unless required; prefer Expo/EAS configs.

