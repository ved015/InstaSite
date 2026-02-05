# InstaSite 
> AI-powered website builder that generates beautiful, production-ready websites in seconds using Google's Gemini AI
![InstaSite Banner](https://img.shields.io/badge/AI-Powered-blue?style=for-the-badge) ![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript) ![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite)
## Features
- 🤖 **AI-Powered Generation** - Leverages Google Gemini 3 Flash for intelligent code generation
- 📡 **Real-time Streaming** - Watch your website being built in real-time with progressive rendering
- 🔄 **Live Preview** - Instant preview using WebContainer technology (runs entirely in browser)
- 📁 **Smart File Explorer** - Organized file tree with syntax-highlighted code editor
## Architecture
### Frontend (`/frontend`)
- **React 18** with TypeScript
- **Vite** for build tooling
- **WebContainer API** for in-browser Node.js environment
- **Monaco Editor** for code editing
- **Tailwind CSS** for styling
- **Lucide React** for icons
### Backend (`/be`)
- **Express.js** server
- **Google Generative AI SDK** (Gemini)
- Streaming response support
- CORS enabled for cross-origin requests

## Getting Started
### Prerequisites
- Node.js 18+ 
- npm or yarn
- Google Gemini API key
### Installation
1. **Clone the repository**
```bash
git clone [https://github.com/ved015/InstaSite.git](https://github.com/ved015/InstaSite.git)
cd InstaSite
```

## Setup Instructions

### 2. Install backend dependencies
```
cd be
npm install
```

### 3. Install frontend dependencies
```
cd ../frontend
npm install
```

### 4. Set up environment variables
Create a `.env` file in the `be` directory:

GEMINI_API_KEY=your_gemini_api_key_here


## Running the Application

### 1. Start the backend server
```
cd be
npm run dev
```

Backend will run on:
http://localhost:3000

### 2. Start the frontend dev server (in a new terminal)
```
cd frontend
npm run dev
```

Frontend will run on:
http://localhost:5173
