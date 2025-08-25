# AI OSINT Report Generator - Supabase Setup Guide

## Overview
This guide will help you set up the AI OSINT Report Generator with Supabase backend integration. The application can work in two modes:
1. **Local Storage Mode** (default fallback)
2. **Supabase Mode** (cloud database with file storage)

## Quick Start (Local Storage)
The application is configured to work immediately with local storage:
```bash
npm run dev
```
Access the application at: http://localhost:5173

## Supabase Setup Instructions

### 1. Create a Supabase Project
1. Go to [Supabase](https://supabase.com)
2. Sign up/log in to your account
3. Click "New Project"
4. Fill in your project details
5. Wait for the project to be created

### 2. Set Up the Database
1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy and paste the contents of `database-schema.sql` into the editor
3. Click "Run" to execute the SQL script
4. This will create all necessary tables, indexes, and storage buckets

### 3. Configure Environment Variables
1. Copy your Supabase project URL and API key from the dashboard
2. Update the `.env` file in the project root:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Gemini API Configuration (already set)
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

### 4. Set Up Storage (Optional)
For file uploads to work with Supabase Storage:
1. In Supabase dashboard, go to **Storage**
2. The `case-files` bucket should already be created by the SQL script
3. Configure bucket policies if needed (currently set to public)

### 5. Launch with Supabase
Once configured, restart the application:
```bash
npm run dev
```

The application will automatically detect Supabase connection and switch modes.

## Features

### Core Functionality
- ✅ Case Management (Create, Edit, Delete OSINT cases)
- ✅ File Upload and Management
- ✅ AI-Powered Analysis (using Gemini API)
- ✅ Interactive Mind Maps
- ✅ Professional Report Generation
- ✅ Export to PDF/HTML
- ✅ Dark Cyber Theme UI

### Storage Features
- ✅ **Hybrid Storage**: Automatically falls back to local storage if Supabase is unavailable
- ✅ **File Storage**: Supports both local and Supabase Storage for uploaded files
- ✅ **Data Persistence**: Cases, files, and analysis results are saved persistently
- ✅ **Backup/Recovery**: Built-in data backup capabilities

### AI Integrations
- ✅ **Google Gemini API**: For intelligent content analysis
- ✅ **Entity Recognition**: Automatic detection of people, places, organizations
- ✅ **Relationship Mapping**: Visual representation of connections
- ✅ **Timeline Generation**: Chronological event analysis
- ✅ **Risk Assessment**: Automated risk scoring

## Usage Instructions

### Creating a New Case
1. Click "Create New Case" on the welcome screen
2. Fill in case name, subject, and description
3. Upload relevant files (images, documents, etc.)
4. Add investigation notes
5. Save the case

### Running AI Analysis
1. Open an existing case
2. Go to the "AI Analysis" tab
3. Click "Run AI Analysis"
4. Wait for the analysis to complete
5. Review entities, relationships, and insights

### Generating Reports
1. After running AI analysis
2. Go to the "Report" tab
3. Click "Generate Report"
4. Review and edit the generated content
5. Export as PDF or HTML

### Working with Mind Maps
1. Go to the "Mind Map" tab
2. View visual representation of case data
3. Interact with nodes and relationships
4. Use for pattern recognition and analysis

## Troubleshooting

### Connection Issues
- Check your `.env` file for correct Supabase credentials
- Verify Supabase project is active and accessible
- Check browser console for connection errors

### File Upload Issues
- Ensure Supabase Storage bucket exists
- Check storage permissions in Supabase dashboard
- Verify file size limits

### API Errors
- Gemini API key may need updating
- Check API quota and usage limits
- Ensure internet connection is stable

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Shadcn/UI components
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI**: Google Gemini API
- **Charts**: Recharts, D3.js
- **Export**: jsPDF, html2canvas

## Security Considerations

### Environment Variables
- Never commit real API keys to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly

### Supabase Security
- Enable Row Level Security (RLS) for production
- Configure proper authentication policies
- Limit anonymous access in production

### File Security
- Validate file types and sizes
- Scan uploaded files for malware
- Consider encryption for sensitive files

## Contributing
This is a demonstration project. For production use:
1. Implement proper authentication
2. Add comprehensive error handling
3. Set up proper logging and monitoring
4. Add unit and integration tests
5. Implement data encryption

## Support
For issues and questions:
1. Check the browser console for errors
2. Verify Supabase dashboard for connection status
3. Review the application logs
4. Test with local storage mode first
