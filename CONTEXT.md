# ?? TEXT CLEANER PRO ? PROJECT CONTEXT

**Chat ID:** `textcleaner-pro-enterprise`
**Status:** Development ? MVP Ready
**Last Updated:** `$(date +"%Y-%m-%d %H:%M")`

---

## ?? PROJECT GOAL

Build an **enterprise-grade Text Cleaning Micro-SaaS** with:

1. Multi-format text processing
2. Professional UI/UX (enterprise-ready)
3. Monetization-ready architecture
4. Scalable & maintainable codebase

---

## ??? TECH STACK

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS + React Icons
- **State Management:** React Hooks + LocalStorage
- **Build Tool:** Vite (production-ready)
- **Deployment:** Vercel _(planned)_

---

## ?? FOLDER STRUCTURE (ACTIVE)

```text
src/
ÃÄÄ components/
³   ÃÄÄ layout/                  # Layout components
³   ³   ÃÄÄ Header.tsx            # ? COMPLETED
³   ³   ÀÄÄ Sidebar.tsx           # ? COMPLETED
³   ÀÄÄ features/                # Feature components
³       ÃÄÄ TextEditor.tsx        # ? COMPLETED
³       ÃÄÄ TextStatistics.tsx    # ? COMPLETED
³       ÃÄÄ OperationsPanel.tsx   # ? COMPLETED
³       ÀÄÄ HistoryPanel.tsx      # ? COMPLETED
ÃÄÄ hooks/                        # Custom hooks
³   ÃÄÄ useKeyboardShortcuts.ts   # ? COMPLETED
³   ÀÄÄ useLocalStorage.ts        # ? COMPLETED
ÃÄÄ types/                        # TypeScript types
³   ÀÄÄ index.ts                  # ? COMPLETED
ÃÄÄ utils/                        # Utilities
³   ÀÄÄ textProcessor.ts          # ? COMPLETED
ÃÄÄ styles/                       # Global styles
³   ÀÄÄ global.css                # ? COMPLETED
ÃÄÄ App.tsx                       # Main App ? COMPLETED
ÀÄÄ main.tsx                      # Entry point ? COMPLETED
```

---

## ?? VARIABLE NAMING CONVENTIONS (**CRITICAL**)

### ? State Variables (`useState`)

```ts
// TEXT
inputText: string                 // User input text
outputText: string                // Processed output text
selectedOperation: string         // Selected cleaning operation

// PROCESSING
processingResult: ProcessingResult | null  // Last processing result
history: HistoryItem[]             // Processing history

// UI STATE
isProcessing: boolean              // Loading state
errorMessage: string | null        // Error message
```

---

### ? Function Naming

```ts
// TEXT PROCESSING
handleProcessText(); // Process input ? output
handleClearAll(); // Clear input & output
handleCopyOutput(); // Copy output to clipboard

// HISTORY
handleSaveToHistory(); // Save current result
handleRestoreFromHistory(); // Restore from history
handleClearHistory(); // Clear all history

// FILE OPERATIONS
handleFileUpload(); // Upload text file
handleFileDownload(); // Download output
```

---

### ? Component Props Interfaces

#### `TextEditor.tsx`

```ts
interface TextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  readOnly?: boolean;
  showStats?: boolean;
  onClear?: () => void;
  onCopy?: () => void;
}
```

#### `OperationsPanel.tsx`

```ts
interface OperationsPanelProps {
  selectedOperation: string;
  onOperationChange: (op: string) => void;
  onProcess: () => void;
  onClearAll: () => void;
  onCopyOutput: () => void;
  inputText: string;
  outputText: string;
  processingTime?: number;
}
```

---

## ?? DESIGN SYSTEM

### Colors

```css
--primary: #3b82f6; /* Blue 500 */
--primary-dark: #2563eb;
--secondary: #10b981; /* Green 500 */
--success: #10b981;
--warning: #f59e0b;
--danger: #ef4444;
```

### Spacing

```css
--spacing-xs: 0.25rem; /* 4px */
--spacing-sm: 0.5rem; /* 8px */
--spacing-md: 1rem; /* 16px */
--spacing-lg: 1.5rem; /* 24px */
--spacing-xl: 2rem; /* 32px */
```

---

## ?? CURRENT TASK LIST

### ? COMPLETED (MVP)

- Basic text processing (10+ operations)
- Real-time statistics
- History (LocalStorage)
- Keyboard shortcuts
- Responsive UI

### ?? IN PROGRESS

- Batch processing
- File upload / download
- Export formats (JSON, CSV, PDF)

### ? PENDING

- User authentication
- Payment integration (Stripe)
- Analytics dashboard
- PWA installation

---

## ?? DEPLOYMENT READINESS

### Build Commands

```bash
npm run build      # Production build
npm run preview    # Preview production build
```

### Deployment Targets

1. **Vercel** (Recommended) ? [https://vercel.com](https://vercel.com)
2. Netlify ? [https://netlify.com](https://netlify.com)
3. GitHub Pages ? [https://pages.github.com](https://pages.github.com)

---

## ?? CONTINUATION PROTOCOL

If development or chat session breaks, provide **exactly**:

1. `CONTEXT.md`
2. `package.json`
3. Message:

```text
Continue TextCleaner Pro Enterprise ? MVP Phase
```

4. Current task from **IN PROGRESS** list

---

## ?? NEXT IMMEDIATE TASKS

1. Clean up legacy folders (`src/js/`, `src/css/`)
2. Implement batch processing
3. Setup deployment pipeline
4. Add basic analytics

---

## ??? STATUS AUTO-UPDATE (IMPORTANT)

After editing this file:

**Save manually**

- **Windows/Linux:** `Ctrl + S`
- **macOS:** `Cmd + S`

Ensure script below is used to sync project status.

---

## ?? SCRIPT UPDATE NOTICE

File to update:

```text
scripts/update-status.js
```

? Replace contents with the **latest standardized version**
? Script generates `PROJECT_STATUS.md` automatically
? Always review `CONTEXT.md` before continuing work

---

### ? THIS FILE IS AUTHORITATIVE

> `CONTEXT.md` is the **source of truth** for:

- Architecture decisions
- Naming conventions
- Current project state
- Continuation instructions

---
