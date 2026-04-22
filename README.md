# PawGuide - Pet Assistant Chatbot

A modern, AI-powered pet assistant chatbot built with FastAPI and Next.js. Get real-time advice about pet care, health, behavior, and more using Google's Gemini AI.

## 🚀 Features

- **AI-Powered Chat**: Powered by Google Gemini API for intelligent, contextual pet advice
- **Voice Input**: Talk to your pet assistant using voice commands
- **Dark/Light Themes**: Toggle between dark and light modes for comfortable viewing
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Chat Sidebar**: Quick access to conversation history and suggestions
- **Knowledge Cards**: Display pet information and tips in an organized format
- **Pet Profiles**: Customize and manage your pet information
- **Welcome Tour**: Interactive guide for first-time users
- **Real-time Chat**: Fast, responsive communication with the AI backend

## 📦 Tech Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **Server**: Uvicorn 0.23.2
- **AI**: Google Generative AI (Gemini)
- **Validation**: Pydantic 2.4.2
- **Environment**: Python-dotenv for configuration

### Frontend
- **Framework**: Next.js 14.0.4
- **Language**: TypeScript 5
- **UI Library**: React 18
- **Styling**: Tailwind CSS 3.3.0
- **Components**: Radix UI components
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Markdown**: React Markdown with syntax highlighting

## 🛠️ Installation

### Prerequisites
- Python 3.8+ (for backend)
- Node.js 18+ (for frontend)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file in the backend directory with your configuration:
   ```env
   GEMINI_API_KEY=your_api_key_here
   BACKEND_URL=http://localhost:8000/api/chat
   ```

6. Run the backend server:
   ```bash
   python main.py
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The frontend will be available at `http://localhost:3000`

## 🚀 Quick Start

1. Ensure both backend and frontend servers are running
2. Open your browser and navigate to `http://localhost:3000`
3. Start chatting with your pet assistant!

### Using run.bat (Windows)
A convenient batch script is included for Windows users:
```bash
run.bat
```

This will start both the backend and frontend servers.

## 📁 Project Structure

```
PawGuideL/
├── backend/
│   ├── main.py              # FastAPI application entry point
│   ├── main2.py             # Alternative implementation
│   ├── requirements.txt      # Python dependencies
│   └── .env                 # Environment configuration
├── frontend/
│   ├── app/
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   ├── page2.tsx        # Secondary page
│   │   └── api/
│   │       ├── chat/        # Chat API endpoint
│   │       └── mock/        # Mock API for testing
│   ├── components/          # Reusable React components
│   │   ├── chat-sidebar.tsx
│   │   ├── voice-input.tsx
│   │   ├── pet-profile.tsx
│   │   ├── knowledge-card.tsx
│   │   ├── welcome-tour.tsx
│   │   └── ui/              # Radix UI components
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Utility functions
├── README.md                # This file
└── run.bat                  # Windows startup script

```

## 🔑 Environment Variables

### Backend (.env)
```env
GEMINI_API_KEY=your_google_gemini_api_key
BACKEND_URL=http://localhost:8000/api/chat
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

## 📚 API Endpoints

### Backend API
- `POST /api/chat` - Send a message to the pet assistant
- `GET /api/chat/history` - Retrieve chat history (if implemented)

## 🧪 Development

### Running Tests
Backend tests (if available):
```bash
cd backend
pytest
```

### Building for Production

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

**Backend:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Azure Deployment with GitHub Actions

This repository includes a deployment workflow at `.github/workflows/azure-webapps-deploy.yml` that deploys:
- `backend/` to an Azure Web App (Python/FastAPI)
- `frontend/` to an Azure Web App (Node.js/Next.js standalone build)

### 1) Create two Azure Web Apps
- Backend app: Linux, Python runtime
- Frontend app: Linux, Node.js runtime

### 2) Configure GitHub secrets
In your GitHub repo Settings -> Secrets and variables -> Actions, add:
- `AZURE_BACKEND_APP_NAME`
- `AZURE_BACKEND_PUBLISH_PROFILE`
- `AZURE_FRONTEND_APP_NAME`
- `AZURE_FRONTEND_PUBLISH_PROFILE`

Use each Web App's **Get publish profile** download content as the `*_PUBLISH_PROFILE` secret value.

### 3) Configure Azure App Settings
Backend Web App:
- `GEMINI_API_KEY=<your_key>`

Frontend Web App:
- `BACKEND_URL=https://<your-backend-app>.azurewebsites.net/api/chat`

### 4) Deploy
Push to `master` (or run the workflow manually from the Actions tab).  
GitHub Actions will build and deploy both services.

## 🐛 Troubleshooting

### Backend connection issues
- Ensure the backend server is running on `http://localhost:8000`
- Check that `BACKEND_URL` is correctly configured in frontend environment
- Verify API key is valid in backend `.env` file

### CORS issues
- Make sure the frontend origin is allowed in backend CORS configuration
- Check backend logs for detailed error messages

### Chat not working
- Verify your Gemini API key is valid and has necessary permissions
- Check network connection and API rate limits
- Review browser console for any JavaScript errors

## 📝 License

This project is open source and available under the MIT License.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues, questions, or suggestions, please open an issue on the repository.