# CreatorTank

CreatorTank is a professional, local-first desktop application designed for content creators to manage their projects, ideas, and assets in a centralized, private environment. By leveraging a local-only architecture, CreatorTank ensures that your intellectual property remains under your control at all times, with no reliance on cloud services for core functionality.

## Core Features

### Project and Portfolio Management
Organize your creative output into distinct projects. Track progress, set platforms (YouTube, Instagram, Blog, Podcast), and maintain a high-level view of all your ongoing initiatives.

### Integrated Content Pipeline
A comprehensive workflow board allows you to visualize the stage of every idea. Moving items from initial concept to final publication is seamless and intuitive, providing clarity on what needs attention next.

### Scheduling and Calendar
The built-in calendar view provides a chronological overview of your content schedule. Plan ahead, identify gaps in your publishing frequency, and ensure consistent output across all your platforms.

### Asset and Script Management
Centralize all resources related to your creative process. Store scripts, research notes, reference images, and links directly within the application, associated with specific ideas for efficient retrieval.

### Privacy and Security
All data is stored locally in an encrypted-capable SQLite database on your machine. CreatorTank does not track your activity or upload your creative work to external servers, prioritizing the security of your creative process.

---

## Installation Guide

### For Windows Users

1.  **Download**: Obtain the `CreatorTank-Setup.exe` installer from the latest release.
2.  **Install**: Run the installer. The application will be installed in your local user directory and a shortcut will be created on your desktop.
3.  **Launch**: Open CreatorTank and begin organizing your creative workflow immediately.

### For Developers and Advanced Users

If you wish to run CreatorTank from source or contribute to its development, follow these steps:

#### System Requirements
- Node.js (Version 16 or higher)
- npm (Version 8 or higher)

#### Setup Instructions
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Basudev-Das25/CreatorTank.git
    cd CreatorTank
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run in Development Mode**:
    ```bash
    npm run dev
    ```

#### Building the Application
To package the application for your specific platform:

- **Windows**: `npm run build:win` (Produces a portable version and an installer)
- **macOS**: `npm run build:mac` (Requires macOS environment)
- **Linux**: `npm run build:linux` (Produces AppImage and .deb packages)

The packaged binaries will be located in the `dist/` directory upon completion.

---

## Technical Specifications
- **Framework**: Electron
- **Frontend**: React with Vite
- **Language**: TypeScript
- **Database**: SQL.js with local persistence
- **Animation**: Framer Motion
- **Icons**: Lucide React

## License
This project is licensed under the MIT License.
