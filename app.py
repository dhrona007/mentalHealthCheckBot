from flask import Flask, request, jsonify, render_template, send_from_directory
from transformers import pipeline

app = Flask(__name__, static_folder='static')

# Load a local sentiment analysis model
sentiment_analyzer = pipeline("sentiment-analysis")

# Define a list of questions to ask the user
QUESTIONS = [
    "How have you been feeling lately?",
    "Have you been experiencing any stress or anxiety?",
    "Do you feel lonely or isolated?",
    "How is your sleep quality?",
    "Have you lost interest in activities you used to enjoy?",
    "Do you have thoughts of self-harm or suicide?",
]

# Store user responses
user_responses = []

# Function to analyze the user's responses using a local model
def analyze_responses(responses):
    # Combine all responses into a single prompt
    prompt = "The user has provided the following responses to mental health questions:\n"
    for i, response in enumerate(responses):
        prompt += f"Q: {QUESTIONS[i]}\nA: {response}\n\n"

    # Analyze the sentiment of the combined responses
    try:
        print(f"Analyzing prompt: {prompt}")  # Debugging: Print the prompt being analyzed
        result = sentiment_analyzer(prompt)[0]
        print(f"Sentiment analysis result: {result}")  # Debugging: Print the result
        sentiment = result['label']
        score = result['score']

        # Provide a basic analysis based on sentiment
        if sentiment == "NEGATIVE" and score > 0.8:
            analysis = (
                "Based on your responses, it seems like you're experiencing significant distress. "
                "Please consider reaching out to a mental health professional for support."
            )
        elif sentiment == "NEGATIVE":
            analysis = (
                "Your responses suggest you're feeling down or stressed. "
                "Try mindfulness exercises or journaling to help manage your feelings."
            )
        else:
            analysis = (
                "Your responses seem positive. Keep practicing self-care and reach out if you need support."
            )
    except Exception as e:
        print(f"Error analyzing sentiment: {e}")  # Debugging: Print the error
        analysis = "Sorry, something went wrong while analyzing your response. Please try again."

    return analysis

@app.route('/api/chat', methods=['POST'])
def chat():
    global user_responses  # Use the global list to store responses

    data = request.json
    user_message = data.get('message', '')

    # Add the user's response to the list
    user_responses.append(user_message)

    # Check if all questions have been answered
    if len(user_responses) < len(QUESTIONS):
        # Ask the next question
        next_question = QUESTIONS[len(user_responses)]
        return jsonify({'reply': next_question, 'status': 'question'})
    else:
        # Analyze all responses and provide feedback
        analysis = analyze_responses(user_responses)
        user_responses = []  # Reset responses for the next session
        return jsonify({'reply': analysis, 'status': 'analysis'})

@app.route('/')
def index():
    return render_template('index.html')  # Serve index.html from the templates folder

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('static', path)

if __name__ == '__main__':
    app.run(debug=True)