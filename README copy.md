# Mental Health Chatbot

A chatbot that provides mental health support by analyzing user responses using Hugging Face's sentiment analysis model.

# Folder Structure
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


## Setup

1. Clone the repository:

   git clone https://github.com/dhrona007/mentalHealthCheckBot.git


2. Install dependencies:

    pip install -r requirements.txt

3. Run the Flask app:

    python app.py

4. Open http://127.0.0.1:5000 in your browser to use the chatbot.

 chatbot.

5. static/:

Contains static files like CSS, JavaScript, and images.

Example files:

styles.css: Styles for the frontend.

script.js: JavaScript for handling frontend logic.

6. templates/:

Contains HTML templates.

Example file:

index.html: The main HTML file for the chatbot interface.

7. Procfile (optional for Heroku deployment):

Specifies the command to run the app on platforms like Heroku.

Example:

Copy
web: gunicorn app:app

