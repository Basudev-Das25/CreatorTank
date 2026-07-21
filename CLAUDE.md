# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CreatorTank is a local-first Electron desktop application for content creators to manage projects, ideas, scripts, assets, and scheduling. Built with Electron + React + TypeScript using the electron-vite build system.

## Common Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Typecheck + build for production
npm run start        # Preview the built app
npm run build:win    # Build Windows installer
npm run build:mac    # Build macOS installer  
npm run build:linux  # Build Linux installer
npm run lint         # ESLint with auto-fix
npm run format       # Prettier formatting
npm run typecheck    # Run TypeScript type checking for both main and renderer
```

## Architecture

### Three-Process Electron Model

```
src/
├── main/           # Electron main process (Node.js)
│   ├── index.ts    # Window creation, IPC handlers, app lifecycle
│   └── db.ts       # SQLite database via sql.js (WASM-based)
├── preload/        # Preload script (bridge between main/renderer)
│   └── index.ts    # contextBridge API exposure
└── renderer/       # React UI (browser context)
    └── src/
        ├── App.tsx           # Root component with state management
        ├── lib/              # Shared utilities
        │   ├── animations.ts # Framer Motion presets
        │   └── constants.ts  # Shared constants
        ├── components/       # Feature components
        │   └── ui/           # Shared UI primitives
        └── assets/
            └── index.css     # Design system tokens
```

### IPC Communication Pattern

All database operations flow through IPC:
1. **Renderer** calls `window.api.methodName()` (defined in preload/index.ts)
2. **Preload** invokes `ipcRenderer.invoke("channel:name", args)`
3. **Main process** handles via `ipcMain.handle("channel:name", callback)`
4. **Database** operations use helper functions: `runRun()` (INSERT/UPDATE/DELETE), `runAll()` (SELECT multiple), `runGet()` (SELECT single)

### Database (sql.js + SQLite)

- Uses sql.js (WebAssembly-based SQLite) for in-memory database with file persistence
- Database file: `{userData}/database.sqlite`
- Schema migrations run on startup in `db.ts` using try/catch column existence checks
- FTS5 full-text search index (`search_index` table) with auto-sync triggers
- Tables: `projects`, `ideas`, `scripts`, `assets`, `settings`, `search_index`

## Design System — "Mosspherism"

### Color Palette

Dark mode first, organic nature-inspired colors:
- **Primary**: Moss green (`#4ade80` light, `#4ade80` dark)
- **Backgrounds**: Near-black with blue undertone (`#0a0f14`)
- **Cards**: Slate (`#141c26`)
- **Text**: `#e8edf4` main, `#9fb3c8` secondary, `#627d98` muted

### Theme System

- Dark mode is default (no class needed)
- `.light-theme` class on `<body>` for light mode
- Toggle via `ToolsPanel` → Theme settings

### Design Tokens (CSS Variables)

All visual properties use CSS custom properties in `src/renderer/src/assets/index.css`:
- Colors: `--primary`, `--bg`, `--card-bg`, `--text-main`, `--text-muted`, etc.
- Glassmorphism: `--glass-bg`, `--glass-border`, `--glass-blur`, `--glass-shadow`
- Spacing: `--space-1` (4px) to `--space-16` (64px) on 8px grid
- Radius: `--radius-sm` (8px) to `--radius-2xl` (24px)
- Typography: `--text-xs` (11px) to `--text-3xl` (32px)
- Shadows: `--shadow-xs` to `--shadow-xl`

### Shared UI Components

Located in `src/renderer/src/components/ui/`:
- **GlassPanel**: Translucent panel with blur (variants: default, elevated, sunken)
- **Button**: primary/secondary/ghost/danger variants with Framer Motion tap
- **Input/Select**: Standardized form controls
- **Badge**: success/warning/danger/info/muted pills
- **EmptyState**: Icon + title + description + optional action
- **LoadingSpinner**: Pulsing animation
- **SectionHeader**: Uppercase tracked header

### Animation System

Centralized in `src/renderer/src/lib/animations.ts`:
- `viewTransition` — fade + y-offset for view changes
- `panelSlideIn` — spring-based right panel entrance
- `overlayFade` — modal backdrop fade
- `modalPop` — modal content scale + fade
- `searchModalPop` — command palette entrance
- `listItem` — staggered list entrance

### Key Components

- **ProjectSidebar**: Project list, navigation, view switching
- **IdeaPanel**: Ideas list with cards, create form, search
- **ScriptEditor**: Script editor with autosave, notes panel, export
- **AssetPanel**: File/image/link attachments for ideas
- **CalendarView**: Monthly calendar showing scheduled items
- **WorkflowBoard**: Kanban-style board with workflow stages
- **SearchModal**: Global FTS5 search (Ctrl+K)
- **ToolsPanel**: Settings slide-in panel
- **ScheduleDialog**: Date/time scheduling modal
- **ConfirmDialog**: Confirmation modal with variants

### Data Flow

```
User Action → Component → window.api.method() → IPC → Main Process → Database → Response
```

All API calls return `{ success: boolean, data?: any, error?: string }`.

## Development Notes

- Database schema migrations are ad-hoc: new columns added via `ALTER TABLE` in try/catch blocks
- WASM file (`sql-wasm.wasm`) must be in `node_modules/sql.js/dist/` for dev, `resources/` for production
- Assets are stored in `{userData}/assets/{ideaId}/` directories
- Window state (sidebar width, asset panel) managed in App.tsx, not persisted to settings
- All components use Framer Motion for animations — use centralized presets from `lib/animations.ts`
- Use shared UI components (`ui/`) instead of inline styles for consistency
