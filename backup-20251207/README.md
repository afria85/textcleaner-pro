# TextCleaner Pro

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-supported-success)
![Status](https://img.shields.io/badge/status-production--ready-success)

**TextCleaner Pro** adalah aplikasi web profesional untuk pembersihan dan pemrosesan teks dengan dukungan multi-format, batch processing, dan fitur lanjutan untuk penggunaan teknis maupun profesional.

Dirancang dengan arsitektur modular, performa tinggi, dan siap digunakan sebagai **PWA (Progressive Web App)**.

---

## ? Features

### Core Features

- ? **Multi-format Support**
  CSV, JSON, HTML, Markdown, SQL, Log files
- ? **Batch Processing**
  Proses banyak file secara bersamaan
- ? **Smart Format Detection**
  Deteksi format otomatis
- ? **Data Anonymization**
  Penghapusan data sensitif
- ? **Regex Engine**
  Pola lanjutan untuk pencarian & penggantian
- ? **Export Options**
  Ekspor ke berbagai format
- ? **Presets System**
  Simpan & muat konfigurasi pembersihan

### Professional Features

- ?? **Real-time Statistics**
  Jumlah karakter, kata, dan baris
- ? **Performance Monitoring**
  Tracking waktu proses
- ?? **History System**
  Riwayat hasil pemrosesan
- ?? **Auto-save**
  Data tidak hilang saat browser ditutup
- ?? **Offline Support**
  Berjalan tanpa koneksi internet (PWA)
- ?? **Keyboard Shortcuts**
  Produktivitas lebih tinggi
- ? **Accessibility**
  WCAG 2.1 compliant

---

## ?? Project Structure

```text
textcleaner-pro/
ÃÄÄ src/                            # Source code
³   ÃÄÄ index.html                  # Main entry point
³   ÃÄÄ css/
³   ³   ÃÄÄ main.css               # Core styles
³   ³   ÃÄÄ components.css         # UI components
³   ³   ÃÄÄ responsive.css         # Responsive design
³   ³   ÃÄÄ themes.css             # Theme management
³   ³   ÀÄÄ animations.css         # CSS animations
³   ÃÄÄ js/
³   ³   ÃÄÄ bootstrap.js           # Application bootstrap
³   ³   ÃÄÄ config.js              # Configuration management
³   ³   ÃÄÄ constants.js           # App constants
³   ³   ÀÄÄ modules/               # Modular architecture
³   ³       ÃÄÄ core/
³   ³       ³   ÃÄÄ App.js         # Main application class
³   ³       ³   ÃÄÄ EventBus.js    # Event management
³   ³       ³   ÃÄÄ StateManager.js # Global state
³   ³       ³   ÃÄÄ Router.js      # Client-side routing
³   ³       ³   ÃÄÄ ServiceManager.js # Service registry
³   ³       ³   ÀÄÄ ErrorHandler.js # Error management
³   ³       ÃÄÄ services/
³   ³       ³   ÃÄÄ ApiService.js  # API integration
³   ³       ³   ÃÄÄ AuthService.js # Authentication
³   ³       ³   ÃÄÄ AnalyticsService.js # Analytics
³   ³       ³   ÃÄÄ CloudSyncService.js # Cloud sync
³   ³       ³   ÃÄÄ AuditLogger.js # Audit logging
³   ³       ³   ÃÄÄ NotificationService.js # Notifications
³   ³       ³   ÀÄÄ PluginService.js # Plugin management
³   ³       ÃÄÄ features/
³   ³       ³   ÃÄÄ TextProcessor.js # Text processing engine
³   ³       ³   ÃÄÄ CleanerFactory.js # Cleaner factory
³   ³       ³   ÃÄÄ BatchProcessor.js # Batch operations
³   ³       ³   ÃÄÄ RegexEngine.js  # Regex tools
³   ³       ³   ÃÄÄ DataAnonymizer.js # Data privacy
³   ³       ³   ÃÄÄ CollaborationManager.js # Team collaboration
³   ³       ³   ÃÄÄ AnalyticsDashboard.js # Analytics UI
³   ³       ³   ÃÄÄ PluginMarketplace.js # Plugin marketplace
³   ³       ³   ÃÄÄ DebugTools.js   # Developer tools
³   ³       ³   ÀÄÄ PerformanceProfiler.js # Performance tools
³   ³       ÃÄÄ cleaners/
³   ³       ³   ÃÄÄ index.js       # Cleaner registry
³   ³       ³   ÃÄÄ BaseCleaner.js # Abstract base
³   ³       ³   ÃÄÄ CsvCleaner.js  # CSV processing
³   ³       ³   ÃÄÄ JsonCleaner.js # JSON processing
³   ³       ³   ÃÄÄ HtmlCleaner.js # HTML cleaning
³   ³       ³   ÃÄÄ SqlCleaner.js  # SQL formatting
³   ³       ³   ÃÄÄ LogCleaner.js  # Log file processing
³   ³       ³   ÃÄÄ MarkdownCleaner.js # Markdown
³   ³       ³   ÀÄÄ CodeFormatter.js # Code formatting
³   ³       ÃÄÄ ui/
³   ³       ³   ÃÄÄ UIController.js # UI management
³   ³       ³   ÃÄÄ ComponentFactory.js # Component creation
³   ³       ³   ÃÄÄ ModalManager.js # Modal dialogs
³   ³       ³   ÃÄÄ NotificationCenter.js # Toast notifications
³   ³       ³   ÃÄÄ ThemeManager.js # Theme switching
³   ³       ³   ÃÄÄ HotKeyManager.js # Keyboard shortcuts
³   ³       ³   ÀÄÄ AccessibilityManager.js # Accessibility
³   ³       ÃÄÄ storage/
³   ³       ³   ÃÄÄ LocalStorage.js # Local storage
³   ³       ³   ÃÄÄ IndexedDB.js    # IndexedDB wrapper
³   ³       ³   ÃÄÄ CacheManager.js # Caching layer
³   ³       ³   ÃÄÄ SessionManager.js # Session management
³   ³       ³   ÀÄÄ BackupManager.js # Data backup
³   ³       ÃÄÄ utils/
³   ³       ³   ÃÄÄ Validator.js   # Input validation
³   ³       ³   ÃÄÄ Formatter.js   # Data formatting
³   ³       ³   ÃÄÄ Logger.js      # Logging utilities
³   ³       ³   ÃÄÄ Performance.js # Performance utilities
³   ³       ³   ÃÄÄ Security.js    # Security utilities
³   ³       ³   ÃÄÄ Debounce.js    # Debounce/throttle
³   ³       ³   ÃÄÄ FileHandler.js # File operations
³   ³       ³   ÀÄÄ StringUtils.js # String utilities
³   ³       ÀÄÄ models/
³   ³           ÃÄÄ User.js        # User model
³   ³           ÃÄÄ Document.js    # Document model
³   ³           ÃÄÄ Preset.js      # Preset model
³   ³           ÃÄÄ HistoryItem.js # History model
³   ³           ÀÄÄ Plugin.js      # Plugin model
³   ÃÄÄ locales/                   # Internationalization
³   ³   ÃÄÄ i18n.js               # i18n initialization
³   ³   ÃÄÄ en.json               # English translations
³   ³   ÃÄÄ id.json               # Indonesian translations
³   ³   ÃÄÄ fr.json               # French translations
³   ³   ÀÄÄ ja.json               # Japanese translations
³   ÃÄÄ assets/
³   ³   ÃÄÄ icons/
³   ³   ÃÄÄ images/
³   ³   ÃÄÄ fonts/
³   ³   ÀÄÄ sounds/
³   ÀÄÄ vendor/                   # Third-party libraries
ÃÄÄ tests/                        # Test suite
³   ÃÄÄ unit/
³   ³   ÃÄÄ setup.js             # Test setup
³   ³   ÃÄÄ teardown.js          # Test teardown
³   ³   ÃÄÄ mocks/
³   ³   ³   ÃÄÄ localStorage.js
³   ³   ³   ÃÄÄ fetch.js
³   ³   ³   ÀÄÄ dom.js
³   ³   ÃÄÄ services/
³   ³   ³   ÃÄÄ AuthService.test.js
³   ³   ³   ÃÄÄ ApiService.test.js
³   ³   ³   ÀÄÄ AnalyticsService.test.js
³   ³   ÃÄÄ features/
³   ³   ³   ÃÄÄ TextProcessor.test.js
³   ³   ³   ÃÄÄ CleanerFactory.test.js
³   ³   ³   ÀÄÄ RegexEngine.test.js
³   ³   ÃÄÄ cleaners/
³   ³   ³   ÃÄÄ CsvCleaner.test.js
³   ³   ³   ÃÄÄ JsonCleaner.test.js
³   ³   ³   ÀÄÄ BaseCleaner.test.js
³   ³   ÃÄÄ utils/
³   ³   ³   ÃÄÄ Validator.test.js
³   ³   ³   ÃÄÄ Formatter.test.js
³   ³   ³   ÀÄÄ Performance.test.js
³   ³   ÀÄÄ models/
³   ³       ÃÄÄ User.test.js
³   ³       ÀÄÄ Document.test.js
³   ÃÄÄ integration/
³   ³   ÃÄÄ e2e/
³   ³   ³   ÃÄÄ text-processing.spec.js
³   ³   ³   ÃÄÄ batch-processing.spec.js
³   ³   ³   ÀÄÄ authentication.spec.js
³   ³   ÀÄÄ api/
³   ³       ÃÄÄ api-integration.test.js
³   ³       ÀÄÄ cloud-sync.test.js
³   ÃÄÄ performance/
³   ³   ÃÄÄ load-testing.js
³   ³   ÃÄÄ stress-testing.js
³   ³   ÀÄÄ benchmark.js
³   ÀÄÄ coverage/                 # Coverage reports
ÃÄÄ build/                        # Build scripts
³   ÃÄÄ webpack/
³   ³   ÃÄÄ webpack.config.js
³   ³   ÃÄÄ webpack.dev.js
³   ³   ÃÄÄ webpack.prod.js
³   ³   ÀÄÄ webpack.analyze.js
³   ÃÄÄ scripts/
³   ³   ÃÄÄ build.js
³   ³   ÃÄÄ deploy.js
³   ³   ÃÄÄ test.js
³   ³   ÀÄÄ lint.js
³   ÀÄÄ config/
³       ÃÄÄ babel.config.js
³       ÃÄÄ jest.config.js
³       ÃÄÄ eslint.config.js
³       ÀÄÄ prettier.config.js
ÃÄÄ docs/                         # Documentation
³   ÃÄÄ api/
³   ³   ÃÄÄ README.md
³   ³   ÃÄÄ services.md
³   ³   ÀÄÄ plugins.md
³   ÃÄÄ development/
³   ³   ÃÄÄ architecture.md
³   ³   ÃÄÄ contributing.md
³   ³   ÀÄÄ testing.md
³   ÃÄÄ user-guide/
³   ³   ÃÄÄ getting-started.md
³   ³   ÃÄÄ features.md
³   ³   ÀÄÄ faq.md
³   ÀÄÄ deployment/
³       ÃÄÄ deployment.md
³       ÃÄÄ scaling.md
³       ÀÄÄ monitoring.md
ÃÄÄ plugins/                      # Plugin system
³   ÃÄÄ core-plugins/
³   ³   ÃÄÄ spell-checker/
³   ³   ÃÄÄ grammar-checker/
³   ³   ÀÄÄ translation/
³   ÃÄÄ third-party/
³   ³   ÃÄÄ github-integration/
³   ³   ÃÄÄ google-drive/
³   ³   ÀÄÄ dropbox/
³   ÀÄÄ marketplace/
³       ÃÄÄ plugin-manifest.json
³       ÀÄÄ install-guide.md
ÃÄÄ public/                       # Static files
³   ÃÄÄ favicon.ico
³   ÃÄÄ robots.txt
³   ÀÄÄ sitemap.xml
ÃÄÄ server/                       # Backend services (if needed)
³   ÃÄÄ api/
³   ³   ÃÄÄ auth.js
³   ³   ÃÄÄ documents.js
³   ³   ÀÄÄ plugins.js
³   ÃÄÄ middleware/
³   ³   ÃÄÄ auth.js
³   ³   ÃÄÄ validation.js
³   ³   ÀÄÄ logging.js
³   ÀÄÄ utils/
³       ÃÄÄ database.js
³       ÀÄÄ encryption.js
ÃÄÄ package.json                  # Dependencies & scripts
ÃÄÄ package-lock.json
ÃÄÄ .env.example                  # Environment variables
ÃÄÄ .gitignore
ÃÄÄ .eslintrc.js                  # ESLint configuration
ÃÄÄ .prettierrc                   # Prettier configuration
ÃÄÄ .babelrc                      # Babel configuration
ÃÄÄ jest.config.js                # Jest configuration
ÃÄÄ tsconfig.json                 # TypeScript config (optional)
ÃÄÄ Dockerfile                    # Docker configuration
ÃÄÄ docker-compose.yml
ÃÄÄ README.md                     # Main documentation
ÃÄÄ CHANGELOG.md                  # Version history
ÃÄÄ CONTRIBUTING.md               # Contribution guidelines
ÃÄÄ LICENSE                       # License file
ÀÄÄ CODE_OF_CONDUCT.md            # Community guidelines
```

---

## ?? Getting Started

### Prerequisites

- Modern Web Browser
  Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- Node.js (for development)
- Git

---

### Installation

```bash
git clone https://github.com/yourusername/textcleaner-pro.git
cd textcleaner-pro
npm install
```

### Run Development Server

```bash
npm run dev
```

Open in browser:

```
http://localhost:3000
```

---

### Build for Production

```bash
npm run build
```

Build output akan tersedia di folder `dist/`.

---

## ????? Usage

### Basic Text Cleaning

1. Paste teks ke editor input
2. Pilih cleaner dari sidebar
3. Klik **Process Text**
4. Salin atau unduh hasilnya

---

### Batch Processing

1. Klik **Batch Process**
2. Pilih beberapa file
3. Atur opsi pemrosesan
4. Proses semua file
5. Unduh hasil dalam format ZIP

---

### Advanced Tools

- **Regex Tool**
  Membuat & menguji regular expression
- **Data Anonymization**
  Menghapus informasi pribadi
- **Format Conversion**
  Konversi antar format
- **Presets**
  Simpan konfigurasi favorit

---

## ?? Architecture & Design

### Code Style

- ES6+ JavaScript (Modules)
- BEM methodology (CSS)
- Component-based architecture

### Key Design Decisions

- **Modular Design**
  Setiap fitur berada dalam modul terpisah
- **Factory Pattern**
  Mudah menambahkan cleaner baru
- **Centralized State Management**
  Dengan persistence
- **Service Worker**
  Offline support & caching
- **Progressive Enhancement**
  Tetap berfungsi di browser lama

---

## ? Adding a New Cleaner

### 1. Create Cleaner Class

`js/modules/cleaners/my-cleaner.js`

```javascript
export default class MyCleaner {
  constructor() {
    this.name = "My Cleaner";
    this.description = "Cleans my specific format";
  }

  async process(input, options) {
    // Processing logic
    return {
      output: input,
      metadata: {},
    };
  }
}
```

### 2. Register Cleaner

`js/modules/cleaners/index.js`

```javascript
import MyCleaner from "./my-cleaner.js";
factory.register("mycleaner", new MyCleaner());
```

### 3. Enable Cleaner

`js/config.js`

```javascript
cleaners: {
  enabled: ["mycleaner"];
}
```

---

## ? Performance Optimizations

- Lazy loading modules
- Web Workers for heavy tasks
- Chunk-based processing
- Debouncing & throttling
- Result caching

---

## ?? Browser Support

| Browser | Version |
| ------- | ------- |
| Chrome  | 80+     |
| Firefox | 75+     |
| Safari  | 13+     |
| Edge    | 80+     |

---

## ?? Contributing

1. Fork repository
2. Create feature branch

   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. Commit changes

   ```bash
   git commit -m "Add AmazingFeature"
   ```

4. Push branch

   ```bash
   git push origin feature/AmazingFeature
   ```

5. Open Pull Request

---

## ?? License

Distributed under the MIT License.
See `LICENSE` for more information.

---

## ?? Acknowledgments

- Inspired by various text processing tools
- Uses **Inter Font** by Rasmus Andersson
- Icons from open-source projects
- Thanks to all contributors

---

## ?? Support

?? Email: **[support@textcleaner.pro](mailto:support@textcleaner.pro)**
?? Issues: GitHub Issues Tab

---

## ? Professional Highlights

- Clean & scalable architecture
- Industry-grade design patterns
- Strong error handling & logging
- Performance-focused implementation
- Accessibility-first approach
- Comprehensive documentation
- Testing-ready structure
- Highly extensible codebase

---
