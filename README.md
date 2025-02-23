# Mental Health Chatbot - MentaLyze

## Description
The **Mental Health Chatbot - MentaLyze** is an AI-powered chatbot designed to provide mental health support by analyzing user responses, tracking moods, and offering personalized guidance. It aims to make mental health assistance accessible 24/7 through AI-powered conversations, emotion detection, and proactive well-being tracking.

---

## Features
- **Mood Tracking**: Users can log their current mood (e.g., happy, sad, anxious).
- **AI-Powered Chat**: The bot uses AI to provide supportive and empathetic responses.
- **Emergency Alert**: Users can trigger an emergency alert to notify a trusted contact.
- **Emotion Detection**: The bot analyzes user responses to provide tailored coping strategies.
- **Proactive Well-being Tracking**: Helps users monitor their mental health trends and suggests preventative care.
- **Multi-Platform Availability**: Accessible via web, mobile apps, and popular messaging platforms (WhatsApp, Telegram).

---

## Objectives
- **Accessible Mental Health Support**: Make mental health assistance available 24/7 through AI-powered conversations.
- **Emotion Detection & Personalized Guidance**: Use voice & text-based emotion analysis to provide tailored coping strategies.
- **Proactive Well-being Tracking**: Help users monitor their mental health trends and suggest preventative care.
- **Emergency Intervention**: Identify signs of distress and provide real-time crisis support or connect users with professionals.
- **Multi-Platform Availability**: Enable access via web, mobile apps, and popular messaging platforms (WhatsApp, Telegram).

---

## Future Goals
1. **AI-Powered Speech & Emotion Analysis**:
   - **Voice-Based Interaction**: Users will be able to speak instead of typing using speech-to-text technology.
   - **Emotion Detection from Voice**: Advanced AI models will analyze voice tone, pitch, and speed to detect emotions like stress, sadness, or anxiety.
   - **Soothing AI-Generated Audio Responses**: The chatbot will convert text into calming voice responses using Google TTS, ElevenLabs, or AWS Polly.

2. **Personalized Mental Health Reports**:
   - **Mood Tracking History**: Users will get weekly/monthly reports on their mood trends, stored in a secure database.
   - **AI-Powered Insights & Advice**: The bot will provide personalized coping strategies, breathing exercises, and wellness tips based on user interactions.
   - **Wearable Device Integration**: Future versions will connect with Apple Watch, Fitbit, or Oura Ring to analyze heart rate, stress levels, and sleep patterns and offer tailored recommendations.

3. **AI-Powered Therapy & Intervention**:
   - **Virtual Therapy Sessions**: Users will be able to schedule AI-guided therapy sessions based on Cognitive Behavioral Therapy (CBT) techniques.
   - **Sentiment-Based AI Responses**: The chatbot will use fine-tuned AI models to provide empathetic and context-aware responses.
   - **Meditation & Relaxation Features**: Integration with YouTube API and guided breathing exercises to help users relax and manage stress effectively.

4. **Multi-Platform & Multimodal Expansion**:
   - **Mobile App Launch**: A dedicated React Native/Flutter mobile app for Android & iOS.
   - **Chatbot Integration**: Available on WhatsApp, Telegram, and Discord for on-the-go mental health support.
   - **Multilingual Support**: AI-powered translations will allow users to communicate in their native languages.
   - **Anonymous Mental Health Community**: A forum/chatroom where users can discuss mental health topics anonymously.

5. **Emergency & Crisis Support**:
   - **Automated SOS Feature**: The chatbot will detect distress signals and contact emergency contacts or helplines with user consent.
   - **Mental Health Helpline Integration**: Direct real-time chat with professionals via API integrations (e.g., Twilio, BetterHelp).
   - **Location-Based Help**: Users will be able to find nearby therapists and crisis centers for immediate support.

---

## Getting Started

### Prerequisites
- Python 3.8 or higher
- Flask (for the backend)
- Node.js (for the frontend, if applicable)
- Git (for version control)

---

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/dhrona007/mentalHealthCheckBot.git
   cd mentalHealthCheckBot
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the Flask App**:
   ```bash
   python app.py
   ```

4. **Open the Application**:
   - Open `http://127.0.0.1:5000` in your browser to use the chatbot.

---

## Usage

1. **Log Your Mood**:
   - Click on one of the mood buttons (e.g., Happy, Sad, Anxious) to log your current mood.

2. **Chat with the Bot**:
   - Type your message in the chat input and press **Send** to interact with the bot.

3. **Emergency Alert**:
   - Click the **Emergency Alert** button to notify a trusted contact in case of an emergency.

---

## Folder Structure
```
mentalHealthChatbot/
├── app.py
├── requirements.txt
├── runtime.txt
├── README.md
├── static/
│   ├── styles.css
│   ├── script.js
│   └── (other static files like images, if any)
├── templates/
│   └── index.html
└── Procfile (for deployment to platforms like Heroku)
```


## About Us
A team of 3 students studying B.Tech under Artificial Intelligence background in Sreenidhi Institute of Science & Technology.

**Contributors**:
- V Dhrona Chandra
- G Thrigun Chandra
- E Nithin Kumar

---

## License
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## Project Status
**Active Development**: The project is currently under active development. New features and improvements are being added regularly.

---

## Support
For help or questions, please open an issue on the [GitLab repository](https://code.swecha.org/dhronachandra/mentalhealthcheckupbot).

---

## Visuals
![Chatbot Interface](/static/chatbot-interface.png.png)  
*Screenshot of the Mental Health Chatbot interface.*

---

This README provides a comprehensive overview of your project, making it easy for users and contributors to understand and get started. Let me know if you need further adjustments! 🚀