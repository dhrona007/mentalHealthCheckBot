# Mentalyze - AI Mental Health Check Bot

<div align="center">
<img width="1200" height="475" alt="Mentalyze Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

## Overview

Mentalyze is an AI-powered mental health assessment and chat application built with React, TypeScript, and Firebase. It provides users with personalized mental health insights through interactive assessments, mood tracking, and AI-powered conversations using Google's Gemini AI.

## Features

- **Mental Health Assessment**: Comprehensive questionnaire-based mental health evaluation
- **Mood Tracking**: Daily mood logging with visual analytics
- **AI Chat Support**: Intelligent conversations powered by Gemini AI
- **User Authentication**: Secure Google authentication via Firebase
- **Data Visualization**: Interactive charts and graphs for mood trends
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **Real-time Database**: Firebase Firestore for data persistence

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Motion (animations)
- **Backend**: Firebase (Authentication, Firestore)
- **AI**: Google Gemini AI API
- **Charts**: Recharts
- **Markdown**: React Markdown
- **Build Tool**: Vite

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key
- Firebase project

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/dhrona007/mentalHealthCheckBot.git
   cd mentalHealthCheckBot
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   APP_URL=http://localhost:3000
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Sign In**: Use Google authentication to sign in to your account.
2. **Take Assessment**: Complete the mental health assessment questionnaire.
3. **Track Mood**: Log your daily mood and view trends over time.
4. **Chat with AI**: Engage in supportive conversations with the AI assistant.
5. **View Insights**: Analyze your mental health data through interactive charts.

## Project Structure

```
mentalHealthCheckBot/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Navbar.tsx
│   │   └── views/
│   │       ├── AssessmentView.tsx
│   │       ├── ChatView.tsx
│   │       └── MoodView.tsx
│   ├── lib/
│   │   ├── firebase.ts
│   │   ├── logic.ts
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

## Deployment

### Deploy to Render

This app can be deployed as a static site on Render.

1. Push your code to a Git repository (e.g., GitHub, GitLab).
2. Sign up for a Render account at https://render.com.
3. Connect your repository to Render.
4. Create a new Static Site service.
5. Set the build command to: `npm run build`
6. Set the publish directory to: `dist`
7. In the Environment section, add the following environment variables:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `APP_URL`: The URL of your deployed app (e.g., https://your-app-name.onrender.com)
8. Deploy the service.
9. In your Firebase console, add the Render domain to the authorized domains for Authentication (under Authentication > Sign-in method > Authorized domains).

## Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication with Google provider
3. Enable Firestore Database
4. Copy your Firebase config to `firebase-applet-config.json`
5. Update Firestore security rules in `firestore.rules`

## API Keys

- **Gemini API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Firebase Config**: Available in your Firebase project settings

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Google Gemini AI for powering the chat functionality
- Firebase for backend services
- React and Vite for the frontend framework
- Tailwind CSS for styling
