from flask import Flask, request, jsonify
from transformers import pipeline

app = Flask(__name__)

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

# Function to analyze the user's responses using a local model
def analyze_responses(responses):
    # Combine all responses into a single prompt
    prompt = "The user has provided the following responses to mental health questions:\n"
    for i, response in enumerate(responses):
        prompt += f"Q: {QUESTIONS[i]}\nA: {response}\n\n"
    
    # Analyze the sentiment of the combined responses
    result = sentiment_analyzer(prompt)[0]
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
    
    return analysis

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    
    # For simplicity, we'll just analyze the user's message
    # In a real scenario, you might want to maintain a conversation context
    responses = [user_message]
    analysis = analyze_responses(responses)
    
    return jsonify({'reply': analysis})

if __name__ == '__main__':
    app.run(debug=True)
