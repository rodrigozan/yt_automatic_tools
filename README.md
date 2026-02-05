# YouTube Automatic Tools 🎥🤖

A comprehensive suite of tools for automating YouTube content creation, including AI-powered story generation, music creation with Suno, and automated video uploading.

## 📁 Project Structure

This repository is organized into three main components:

- **[`api`](./api)**: The backend server built with Node.js, Express, and TypeScript. It handles core logic, AI integrations, database interactions (MongoDB), and YouTube API communication.
- **[`web`](./web)**: The frontend dashboard built with React, Vite, TypeScript, and Tailwind CSS. It provides a user interface for managing channels, tools, and uploads.
- **[`microservice`](./microservice)**: A Python-based utility for advanced video and audio processing, utilizing FFmpeg and Demucs for sound separation and mixing.

---

## ✨ Key Features

- **YouTube Integration**: Full OAuth2 flow for channel authorization and automated video uploads.
- **AI Story Generation**: Generate compelling stories and scripts using advanced AI models.
- **Suno Music Integration**: Integration with Suno for generating custom music tracks.
- **Video Metadata Automation**: Automatically generate optimized titles, descriptions, and tags.
- **Advanced Audio Processing**: Isolate vocals and mix background music with precision.
- **Channel Management**: Manage multiple YouTube channels from a single dashboard.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Yarn or NPM
- Python 3.10+
- FFmpeg
- MongoDB

### Installation

#### 1. Backend (API)

```bash
cd api
yarn install
# Copy .env.example to .env and fill in your credentials
npm run dev
```

#### 2. Frontend (Web)

```bash
cd web
npm install
npm run dev
```

#### 3. Microservice (Python)

```bash
cd microservice
# Create a virtual environment
python -m venv venv
source venv/bin/scripts/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt  # If requirements.txt exists
```

---

## 🛠️ Technologies Used

- **Backend**: Node.js, Express, TypeScript, Mongoose, Google Cloud SDK, Groq, FFmpeg.
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, Lucide Icons, Shadcn/UI.
- **Audio Processing**: Python, Demucs, FFmpeg.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
