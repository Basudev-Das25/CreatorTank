# CreatorTank

> A local-first desktop operating system for content creators. Plan, write, organize, and produce content — all in one place, completely offline.

![Electron](https://img.shields.io/badge/Electron-33-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Overview

CreatorTank is a premium desktop application built for content creators who need a centralized workspace to manage their entire creative process. Instead of switching between Notion, Google Docs, folders, image viewers, calendars, and browsers — everything lives inside one beautiful, offline-first application.

**The app is not intended to replace professional editing software like Premiere Pro, Photoshop, or DaVinci Resolve.** Instead, it manages everything before and around production.

Think of it as:
- The brain of a creator
- The creative workspace
- The planning center
- The writing environment
- The production organizer

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| **Creator Dashboard** | Personalized home screen with Today's Focus, Recent Projects, Upcoming Schedule, Recently Edited, and Productivity Summary |
| **Project Management** | Organize content by brand, channel, or client with platform tags (YouTube, Instagram, Podcast, Blog) |
| **Idea Management** | Capture, organize, and prioritize ideas with workflow stages and scheduling |
| **Content Workspace** | Tabbed workspace for each idea: Overview, Script, Assets, Research, Links, Checklist, Publishing Notes |
| **Script Editor** | Clean writing environment with auto-save, word count, notes panel, and export (TXT/MD) |
| **Asset Management** | Attach files, images, and links to ideas with preview support |
| **Quick Capture Inbox** | Global shortcut (Ctrl+Shift+Space) for instant idea capture without choosing a project |
| **Production Checklist** | Default 10-item checklist per idea with progress tracking |
| **Calendar** | Monthly view of scheduled content with date/time support |
| **Workflow Board** | Kanban-style board: Idea, Writing, Recording, Editing, Ready, Published |
| **Split View** | Dual-panel workspace for comparing content or viewing multiple projects |
| **Global Search** | Instant full-text search across all projects, ideas, and scripts (Ctrl+K) |
| **Backup & Restore** | Manual backup/restore with database and assets export |
| **Theme System** | Dark mode first with light mode and system preference support |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Desktop** | Electron 33 |
| **Frontend** | React 18 + Vite |
| **Language** | TypeScript 5.3 |
| **Database** | SQLite (sql.js WASM) |
| **IPC** | Electron contextBridge |
| **Styling** | CSS Custom Properties (Mosspherism Design System) |
| **Animations** | Framer Motion 12 |
| **Icons** | Lucide React |
| **Build** | electron-vite + electron-builder |

---

## Design System — "Mosspherism"

CreatorTank uses a custom design language called **Mosspherism** — combining modern glassmorphism with a calm, nature-inspired aesthetic.

### Principles
- Dark mode first
- Floating layout with generous whitespace
- Layered translucent glass panels with soft background blur
- Organic accent palette: moss greens, forest, slate, muted teal
- 8px grid spacing system
- Premium typography with clear hierarchy
- Smooth micro-interactions via Framer Motion

### Color Palette

| Token | Light | Dark |
|-------|-------|------|
| Primary | #16a34a (Moss 600) | #4ade80 (Moss 400) |
| Background | #f5f7f3 | #0a0f14 |
| Card | #ffffff | #141c26 |
| Text | #1a2e05 | #e8edf4 |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

`ash
git clone https://github.com/Basudev-Das25/CreatorTank.git
cd CreatorTank
npm install
npm run dev
`

### Build

`ash
npm run build        # Build for production
npm run build:win    # Build Windows installer
npm run build:mac    # Build macOS installer
npm run build:linux  # Build Linux installer
`

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+K | Global Search |
| Ctrl+B | Toggle Sidebar |
| Ctrl+Shift+Space | Quick Capture (Inbox) |
| Ctrl+S | Save Script |
| Escape | Close modals |

---

## Database Schema

| Table | Purpose |
|-------|---------|
| projects | Content projects |
| ideas | Ideas with workflow stages |
| scripts | Script content |
| ssets | Files, images, links |
| inbox_items | Quick capture items |
| checklists | Production checklist items |
| workspace_notes | Research, links, publishing notes |
| settings | App configuration |
| search_index | FTS5 full-text search |

---

## Target Users

- YouTubers, Streamers, Video editors
- Shorts creators, Instagram creators
- Bloggers, Writers, Podcasters
- Course creators, Freelancers

---

## Roadmap

### Completed
- [x] Project & Idea Management
- [x] Script Editor with auto-save
- [x] Asset Management
- [x] Calendar & Workflow Board
- [x] Global Search (FTS5)
- [x] Backup & Restore
- [x] Creator Dashboard
- [x] Quick Capture Inbox
- [x] Production Checklists
- [x] Content Workspace
- [x] Split View
- [x] Mosspherism Design System

### Future Phases
- [ ] Version History, Templates, Tags
- [ ] AI Assistance
- [ ] Cloud Sync, Collaboration
- [ ] Publishing Automation
- [ ] Analytics, Plugins, Marketplace

---

## Privacy & Data

- **100% Offline** — No internet required
- **Local-First** — SQLite on your machine
- **No Subscriptions** — Free and open-source
- **No Server** — No backend infrastructure
- **You Own Your Data** — Export anytime

---

## License

MIT License

---

## Acknowledgments

Inspired by Linear, Arc Browser, Raycast, Obsidian, and Figma.
