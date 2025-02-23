# Mental Health Check-Up Bot

## Description
The **Mental Health Check-Up Bot** is a chatbot designed to provide mental health support by tracking user moods, offering conversational support, and providing resources for mental well-being. It uses AI to generate empathetic responses and help users manage their emotions effectively.

---

## Features
- **Mood Tracking**: Users can log their current mood (e.g., happy, sad, anxious).
- **AI-Powered Chat**: The bot uses AI to provide supportive and empathetic responses.
- **Emergency Alert**: Users can trigger an emergency alert to notify a trusted contact.
- **User-Friendly Interface**: Simple and intuitive design for easy interaction.

---

## Getting Started

### Prerequisites
- Python 3.8 or higher
- Node.js (for the frontend)
- OpenAI API key (for AI responses)
- Git (for version control)

---

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://code.swecha.org/dhronachandra/mentalhealthcheckupbot.git
   cd mentalhealthcheckupbot
   ```

2. **Set Up the Backend**:
   - Navigate to the `backend` folder:
     ```bash
     cd backend
     ```
   - Install dependencies:
     ```bash
     pip install -r requirements.txt
     ```
   - Create a `.env` file and add your OpenAI API key:
     ```plaintext
     OPENAI_API_KEY=your_openai_api_key_here
     ```

3. **Set Up the Frontend**:
   - Navigate to the `frontend` folder:
     ```bash
     cd ../frontend
     ```
   - Install dependencies:
     ```bash
     npm install
     ```

4. **Run the Application**:
   - Start the backend server:
     ```bash
     cd ../backend
     python server.py
     ```
   - Open the frontend in your browser:
     - Open `frontend/index.html` in your browser.

---

## Usage

1. **Log Your Mood**:
   - Click on one of the mood buttons (e.g., Happy, Sad, Anxious) to log your current mood.

2. **Chat with the Bot**:
   - Type your message in the chat input and press **Send** to interact with the bot.

3. **Emergency Alert**:
   - Click the **Emergency Alert** button to notify a trusted contact in case of an emergency.

---

## Integrations

- **OpenAI GPT-3.5 Turbo**: Used for generating AI-powered responses.
- **GitLab CI/CD**: For continuous integration and deployment.

---

## Collaborate

- **Invite Team Members**: Add collaborators to the project on GitLab.
- **Create Merge Requests**: Submit changes for review and merge them into the main branch.
- **Set Up Approvals**: Enable merge request approvals for better collaboration.

---

## Roadmap

- **Mood Analytics**: Add a feature to track mood trends over time.
- **Multilingual Support**: Support multiple languages for broader accessibility.
- **Integration with Mental Health APIs**: Provide resources and helpline numbers based on user location.

---

## Contributing

We welcome contributions! Here’s how you can help:

1. Fork the repository.
2. Create a new branch for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your commit message here"
   ```
4. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a merge request on GitLab.

---

## Authors and Acknowledgments

- **Dhronachandra**: Project Lead and Developer.
- **OpenAI**: For providing the GPT-3.5 Turbo model.
- **GitLab**: For hosting the repository and CI/CD tools.

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

![Chatbot Interface](screenshots/chatbot-interface.png)  
*Screenshot of the Mental Health Check-Up Bot interface.*

---

This README provides a comprehensive overview of your project, making it easy for users and contributors to understand and get started. Let me know if you need further adjustments! 🚀