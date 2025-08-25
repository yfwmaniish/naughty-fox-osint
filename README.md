# 🕵️ AI-Powered OSINT Report Generator

> **Cyberpunk-themed intelligence analysis platform with real Gemini AI integration**

![OSINT Generator](https://img.shields.io/badge/OSINT-Report%20Generator-00ff41?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMDBmZjQxIi8+Cjwvc3ZnPgo=)
![React](https://img.shields.io/badge/React-18.x-61dafb?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=for-the-badge&logo=typescript)
![Gemini AI](https://img.shields.io/badge/Gemini-AI%20Powered-4285f4?style=for-the-badge&logo=google)

## 🎯 Overview

A cutting-edge **Open Source Intelligence (OSINT) Report Generator** featuring a dark cyberpunk aesthetic, real-time AI analysis, and professional report generation capabilities. Built with React, TypeScript, and integrated with Google's Gemini Pro AI for advanced intelligence analysis.

## ✨ Key Features

### 🤖 **AI-Powered Analysis**
- **Real Gemini Pro Integration** - Advanced natural language processing
- **Entity Extraction** - Automatically identify people, organizations, locations
- **Relationship Mapping** - Visualize connections between entities
- **Risk Assessment** - AI-generated threat and confidence scoring
- **Timeline Construction** - Chronological event analysis

### 🎨 **Cyberpunk UI/UX**
- **Dark Theme** - Full cyberpunk aesthetic with neon accents
- **Matrix Background** - Animated digital rain effect
- **Terminal Interface** - Retro-futuristic command-line styling
- **Glitch Effects** - Dynamic text and visual animations
- **Neon Colors** - Green, blue, and red accent system

### 🧠 **Interactive Mind Mapping**
- **D3.js Visualization** - Force-directed graph layouts
- **Drag & Drop** - Interactive node manipulation
- **Entity Relationships** - Visual connection mapping
- **Zoom & Pan** - Smooth navigation controls

### 📊 **Professional Reporting**
- **Multi-format Export** - PDF, HTML, and structured data
- **Chain of Custody** - Proper evidence documentation
- **Watermarking** - Security and authenticity features
- **Custom Templates** - Professional intelligence report formats

### 💾 **Data Management**
- **SQLite Database** - Local data persistence
- **Case Management** - Organize multiple investigations
- **File Upload** - Support for images, documents, videos (up to 100MB)
- **Auto-save** - Prevent data loss during analysis

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/yfwmaniish/osint-report-generator.git
cd osint-report-generator

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

Visit `http://localhost:5173` to access the application.

### 🔑 API Configuration

1. Navigate to the **Config** tab in the application
2. The Gemini API key is pre-configured: `YOUR_GEMINI_API_KEY`
3. Test the connection and customize safety settings as needed

## 📋 Usage Guide

### 1. **Case Setup**
- Create a new investigation case
- Add subject details and case description
- Upload relevant files (documents, images, etc.)
- Add investigation notes and tags

### 2. **AI Analysis**
- Run AI analysis on your investigation data
- Review extracted entities and relationships
- Examine confidence scores and risk assessments
- Analyze timeline of events

### 3. **Mind Map Visualization**
- Explore interactive entity relationship graphs
- Drag nodes to reorganize the visualization
- Click entities for detailed information
- Export visualization as images

### 4. **Report Generation**
- Generate professional intelligence reports
- Customize report sections and content
- Review and edit generated content
- Add custom insights and conclusions

### 5. **Export & Sharing**
- Export reports in PDF or HTML format
- Include evidence attachments
- Apply watermarks and security features
- Maintain chain of custody documentation

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - High-quality component library
- **Framer Motion** - Smooth animations
- **D3.js** - Data visualization

### Backend & Data
- **SQLite** - Local database storage
- **IndexedDB** - Browser-based persistence
- **File System API** - Local file management

### AI Integration
- **Google Gemini Pro** - Advanced language model
- **Custom Prompts** - Optimized for OSINT analysis
- **Retry Logic** - Robust error handling
- **Safety Filters** - Content moderation

### Development Tools
- **Vite** - Fast build tool
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **pnpm** - Efficient package management

## 📁 Project Structure

```
osint-report-generator/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # Shadcn/ui components
│   │   ├── AIAnalysisPanel.tsx
│   │   ├── CaseManager.tsx
│   │   ├── CyberLoader.tsx
│   │   ├── ExportDialog.tsx
│   │   ├── FileUpload.tsx
│   │   ├── GeminiApiConfig.tsx
│   │   ├── MatrixBackground.tsx
│   │   ├── MindMap.tsx
│   │   ├── ReportViewer.tsx
│   │   └── RichEditor.tsx
│   ├── lib/                # Utility functions
│   │   ├── database.ts     # SQLite operations
│   │   ├── exportService.ts # Report export
│   │   ├── geminiApi.ts    # AI integration
│   │   ├── mockData.ts     # Demo data
│   │   ├── storage.ts      # Data persistence
│   │   └── utils.ts        # Helper functions
│   ├── pages/              # Application pages
│   │   ├── Index.tsx       # Main application
│   │   └── NotFound.tsx    # 404 page
│   ├── styles/             # CSS and styling
│   │   ├── dark-theme.css  # Cyberpunk theme
│   │   └── index.css       # Global styles
│   ├── types/              # TypeScript definitions
│   │   └── index.ts        # Type definitions
│   └── hooks/              # Custom React hooks
├── docs/                   # Documentation
│   ├── osint_report_generator_prd.md
│   ├── osint_system_design.md
│   ├── osint_class_diagram.mermaid
│   └── osint_sequence_diagram.mermaid
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables
```env
# Optional: Custom Gemini API key
VITE_GEMINI_API_KEY=your_api_key_here

# Optional: API endpoint override
VITE_GEMINI_ENDPOINT=https://generativelanguage.googleapis.com
```

### Build Configuration
- **Vite Config** - `vite.config.ts`
- **TypeScript** - `tsconfig.json`
- **Tailwind** - `tailwind.config.ts`
- **ESLint** - `eslint.config.js`

## 🧪 Testing

```bash
# Run linting
pnpm run lint

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

## 📚 Documentation

- **[Product Requirements](./docs/osint_report_generator_prd.md)** - Comprehensive PRD
- **[System Design](./docs/osint_system_design.md)** - Architecture overview
- **[Class Diagram](./docs/osint_class_diagram.mermaid)** - Data structures
- **[Sequence Diagram](./docs/osint_sequence_diagram.mermaid)** - Process flows

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** - Advanced language model capabilities
- **Shadcn/ui** - Beautiful component library
- **D3.js Community** - Powerful data visualization
- **React Team** - Excellent frontend framework
- **OSINT Community** - Intelligence analysis methodologies

## 📞 Support

- **Issues** - [GitHub Issues](https://github.com/yfwmaniish/osint-report-generator/issues)
- **Discussions** - [GitHub Discussions](https://github.com/yfwmaniish/osint-report-generator/discussions)

---

**⚡ Built with passion for the OSINT community and cybersecurity professionals worldwide.**

*"Intelligence is not information, but the synthesis of information into actionable knowledge."*