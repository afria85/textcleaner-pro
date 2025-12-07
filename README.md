---

# TextCleaner Pro

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![PWA](https://img.shields.io/badge/PWA-supported-success)
![Status](https://img.shields.io/badge/status-production--ready-success)

**TextCleaner Pro** adalah aplikasi web profesional untuk pembersihan dan pemrosesan teks dengan dukungan multi-format, batch processing, dan fitur lanjutan untuk kebutuhan teknis maupun enterprise.

Dirancang dengan **arsitektur modular**, **performa tinggi**, dan **siap dijalankan sebagai Progressive Web App (PWA)**.

---

## ✨ Features

### Core Features

* **Multi-format Support**
  CSV, JSON, HTML, Markdown, SQL, Log files

* **Batch Processing**
  Memproses banyak file secara bersamaan

* **Smart Format Detection**
  Deteksi format otomatis

* **Data Anonymization**
  Penghapusan data sensitif

* **Regex Engine**
  Pattern matching & replace tingkat lanjut

* **Export Options**
  Ekspor ke berbagai format

* **Presets System**
  Simpan & muat konfigurasi pembersihan

---

### Professional Features

* **Real-time Statistics**
  Jumlah karakter, kata, dan baris

* **Performance Monitoring**
  Tracking waktu pemrosesan

* **History System**
  Riwayat hasil pemrosesan

* **Auto-save**
  Data tetap aman meskipun browser ditutup

* **Offline Support**
  Berjalan tanpa koneksi internet (PWA)

* **Keyboard Shortcuts**
  Workflow lebih cepat

* **Accessibility**
  WCAG 2.1 compliant

---

## 🗂 Project Structure (High-Level)

> Struktur ini mencerminkan **enterprise-ready architecture** dengan modularisasi penuh, test coverage, dan extensibility.

```text
textcleaner-pro/
├── src/                # Frontend application
│   ├── css/            # Styles & themes
│   ├── js/             # Core application logic
│   │   ├── modules/    # Modular architecture
│   │   ├── cleaners/   # Text cleaners
│   │   ├── services/  # App services
│   │   ├── storage/   # Persistence layer
│   │   └── utils/     # Utilities
│   ├── locales/        # i18n translations
│   └── assets/         # Static assets
├── tests/              # Unit, integration & e2e tests
├── docs/               # Technical & user documentation
├── plugins/            # Plugin system
├── server/             # Optional backend services
├── build/              # Build & deployment scripts
├── public/             # Static public files
└── configuration files # ESLint, Prettier, Jest, Docker
```

📌 **Catatan:** Struktur lengkap dijelaskan di folder `/docs`.

---

## 🚀 Getting Started

### Prerequisites

* Modern Web Browser
  Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
* Node.js (development)
* Git

---

### Installation

```bash
git clone https://github.com/yourusername/textcleaner-pro.git
cd textcleaner-pro
npm install
```

---

### Run Development Server

```bash
npm run dev
```

Akses aplikasi di:

```
http://localhost:3000
```

---

### Build for Production

```bash
npm run build
```

Hasil build akan tersedia di folder `dist/`.

---

## 🧑‍💻 Usage

### Basic Text Cleaning

1. Paste teks ke editor input
2. Pilih operasi pembersihan
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

* **Regex Tool** — Membuat & menguji regular expression
* **Data Anonymization** — Menghapus informasi pribadi
* **Format Conversion** — Konversi antar format
* **Presets** — Simpan konfigurasi favorit

---

## 🏗 Architecture & Design

### Code Standards

* ES6+ JavaScript (Modules)
* BEM methodology (CSS)
* Component-based architecture

### Key Design Decisions

* **Modular Design**
  Setiap fitur terpisah dan mudah diperluas

* **Factory Pattern**
  Penambahan cleaner tanpa memodifikasi core

* **Centralized State Management**
  Dengan persistence layer

* **Service Worker**
  Offline support & caching

* **Progressive Enhancement**
  Tetap stabil di browser lama

---

## ➕ Adding a New Cleaner

### 1. Create Cleaner Class

```javascript
export default class MyCleaner {
  constructor() {
    this.name = "My Cleaner";
    this.description = "Cleans my specific format";
  }

  async process(input, options) {
    return {
      output: input,
      metadata: {}
    };
  }
}
```

---

### 2. Register Cleaner

```javascript
import MyCleaner from "./my-cleaner.js";
factory.register("mycleaner", new MyCleaner());
```

---

### 3. Enable Cleaner

```javascript
cleaners: {
  enabled: ["mycleaner"]
}
```

---

## ⚡ Performance Optimizations

* Lazy loading modules
* Web Workers untuk proses berat
* Chunk-based processing
* Debouncing & throttling
* Result caching

---

## 🌍 Browser Support

| Browser | Version |
| ------- | ------- |
| Chrome  | 80+     |
| Firefox | 75+     |
| Safari  | 13+     |
| Edge    | 80+     |

---

## 🤝 Contributing

1. Fork repository
2. Buat feature branch

   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit perubahan

   ```bash
   git commit -m "Add AmazingFeature"
   ```
4. Push ke branch

   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open Pull Request

---

## 📄 License

Distributed under the **MIT License**.
See `LICENSE` for more information.

---

## 🙏 Acknowledgments

* Inspired by various text processing tools
* Uses **Inter Font** by Rasmus Andersson
* Icons from open-source projects
* Thanks to all contributors

---

## 📬 Support

* 📧 Email: **[support@textcleaner.pro](mailto:support@textcleaner.pro)**
* 🐞 Bug Reports: GitHub Issues

---

## ✅ Professional Highlights

* Clean & scalable architecture
* Industry-grade design patterns
* Strong error handling & logging
* Performance-focused implementation
* Accessibility-first design
* Comprehensive documentation
* Testing-ready structure
* Highly extensible codebase

---

