# 🚀 TMS Pulse

An Electron-based Windows desktop application designed for streamlined server setup, system maintenance, and automated operational workflows. 

TMS Pulse acts as a bridge between a modern, reactive user interface and low-level Windows OS operations, allowing technicians to validate environments and execute complex batch scripts with a single click.

## ✨ Core Features

* **🛡️ System Diagnostics:** Automatically scans local hardware (RAM, CPU, Drive Space) and bypasses network firewalls to validate required external URLs.
* **⚡ Smart Application Discovery:** Uses partial-match directory scanning to locate required software (like the TMS-DOS installer) regardless of version numbers.
* **🔐 Elevated Script Execution:** Securely breaks out of the Electron sandbox to execute native `.bat` and `.ps1` files with Administrator (UAC) privileges.
* **🗄️ Database Management:** Provides GUI wrappers for complex SQL dumps, database initialization, and credential generation.
* **🌍 Built-in Localization:** Powered by a custom, lightweight template engine that dynamically evaluates `{{ __('keys') }}` into translated strings without the bloat of a massive framework.

## ⚙️ Prerequisites

Since this application heavily interacts with the Windows OS level (PowerShell, CMD, file system), it has specific environment requirements:

* **Operating System:** Windows 10 / 11 (macOS/Linux are not supported due to native script execution).
* **Node.js:** v18.0.0 or higher.

## 🛠️ Quick Start

Getting up and running is designed to be completely frictionless.

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Boot the application in development mode:
   ```bash
   npm run start
   ```

## 🏗️ Project Architecture

We follow a strict separation of concerns to keep the codebase secure and maintainable:
* `/src/main/` - The Node.js backend. Manages the window lifecycle and OS operations.
* `/src/main/ipc/` - The "Traffic Controllers". Bridges the UI to system operations (`sys.ipc.js`, `set.ipc.js`, `ui.ipc.js`).
* `/src/preload/` - The secure context bridge. Exposes specific, safe APIs to the frontend.
* `/src/ui/` - The frontend UI. Built with vanilla JS and component-based HTML.
* `/resources/` - Contains the raw `.bat` and `.ps1` automation scripts.

---
## 📁 Project Structure

This project follows a secure, modular Electron architecture, strictly separating the frontend (Renderer), backend (Main), and external execution scripts.

```text
ts-automation-app/
├── resources/               # External Windows Batch Scripts & Configs (Unpacked in production)
│   ├── config/              # Environment variables and spec configurations (.env)
│   ├── lib/                 # Core batch script libraries (admin checks, sys-env variables)
│   └── *.bat                # Task-specific batch scripts (db creation, folders, cleanup, etc.)
│
├── src/                     # Core Application Source Code
│   │
│   ├── backend/             # Electron Main Process (Node.js)
│   │   ├── cnf/             # Global Configurations (App settings, network monitors, string messages)
│   │   ├── ipc/             # Inter-Process Communication (IPC) Listeners
│   │   ├── svc/             # Service Layer (Business logic, OS interaction, PowerShell execution)
│   │   ├── utils/           # Shared Utility Functions (fs.util.js, sys.util.js)
│   │   └── main.js          # Electron app entry point and window initialization
│   │
│   ├── bridge/              # Electron Preload Scripts
│   │   └── preload.js       # Secure Context Bridge (exposes safe Node APIs to the UI)
│   │
│   └── frontend/            # Electron Renderer Process (Chromium / DOM)
│       ├── assets/          # Static files (Icons, Logos, custom graphics)
│       ├── css/             # Custom stylesheets (Bundled via esbuild with Bootstrap)
│       ├── js/              # Frontend logic (State management, API calls, DOM manipulation)
│       │   └── lang/        # Localization (I18n translations engine)
│       ├── views/           # Main HTML views (Dashboard, Settings, Server Validation, etc.)
│       │   └── partials/    # Reusable HTML components injected dynamically
│       └── index.html       # Main application shell/layout
│
├── esbuild.config.js        # Custom Build Engine (Minifies HTML, JS, CSS, and Scripts)
├── package.json             # App metadata, dependencies, and electron-builder configuration
└── README.md                # Project documentation
```
---

## 🧠 Coding Standards & Philosophy

To keep this codebase scalable and developer-friendly, we adhere to the following core rules:

### 1. Short, Punchy Naming Conventions
We optimize for clean UI code and fast file searching.
* **Keep it brief:** We use `API.run('pc')` instead of `window.electronAPI.system.executeSystemToolCommand('explorer-pc')`.
* **IPC Handlers:** We use 3-letter prefixes for backend modules (e.g., `sys.ipc.js`, `set.ipc.js`, `ui.ipc.js`).
* *Why?* It makes the HTML infinitely easier to read, keeps the VS Code file tree clean, and reduces typos.

### 2. Extensive Commenting (The "Amnesia" Rule)
Comments are stripped out by the build tool during minification (`npm run build`), meaning **they cost zero performance or disk space in production**.
* **Rule:** Comment like your future self will have amnesia in six months.
* **Focus on the WHY:** Don't just explain *what* the code does; explain *why* it does it (e.g., explaining why `app.asar.unpacked` is required for batch files). Use JSDoc (`/** ... */`) for function headers.

### 3. DRY (Don't Repeat Yourself)
If you do it twice, abstract it. 
* Example: Instead of writing `child_process.exec` logic in every single button handler, we route all tool executions through a central `ToolSvc.runTool()` engine.

### 4. The "Pulse" Shorthand (Naming Conventions)
We prioritize brevity to keep HTML attributes clean and file searching fast. **Strictly adhere to these abbreviations:**

| Term | Shorthand | Context / Example |
| :--- | :--- | :--- |
| **Configuration** | `cnf` | `#cnf/index.js`, `APP_CNF` |
| **Directory** | `dir` | `uiDir`, `TMS_DIR` |
| **Folder** | `Fldr` | `resourcesFldr` |
| **Location** | `loc` | `customScriptLoc` |
| **Drive** | `drv` | `defDrv` (Default Target), `targetDrv` |
| **Toggle** | `tog` | `tog-exit` (IPC handle for toggling window behavior) |
| **Partials** | `partials` | Reusable HTML fragments located in `/ui/views/partials/` |
| **Modal** | `mdl` | `mdlCntnr`, `openMdl()` |
| **Container** | `cntnr` | `mdlCntnr`, `.file-pckr-cntnr` |
| **Pickers** | `pckrs` | `pckrs.forEach()`, `filePckr` |
| **Hidden** | `hddn` | `hddnInpt` (Hidden File Input) |
| **Input** | `inpt` | `visblInpt`, `hddnInpt` |
| **Visible** | `visbl` | `visblInpt` (Visible Text Input) |
| **Card** | `crd` | `.radio-crd`, `installer-crd` |
| **Path** | `pth` | `file-pth-inpt`, `targetPth` |
| **Error** | `err` | `errMsge`, `errHint`, `logErr()` |

## 📦 Build Instructions

To package the application for production (creates the `.exe` installer):

```bash
npm run build
```
*(Note: Building will minify the code, strip comments, and bundle resources into an encrypted ASAR archive for distribution.)*