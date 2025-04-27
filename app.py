from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
import os
from dotenv import load_dotenv
import json
import random
from together import Together
from datetime import datetime
from flask_socketio import SocketIO, emit
import logging

# Load environment variables
load_dotenv()

app = Flask(__name__, 
            template_folder='Templates',
            static_folder='static',
            static_url_path='/static')
app.secret_key = os.getenv("FLASK_SECRET_KEY", "supersecretkey")
CORS(app)  # Allow all origins for all routes

socketio = SocketIO(app, cors_allowed_origins="*")  # Enable CORS for SocketIO

# Initialize Together client
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
client = Together(api_key=TOGETHER_API_KEY)

# Dictionary to store user chat history
user_chat_history = {}

# Dictionary to store user assessment state
user_assessment_state = {}

# Load mental health questions from JSON file
mental_health_questions = []

def load_mental_health_questions():
    global mental_health_questions
    try:
        with open('static/data/assessment_questions.json', 'r') as f:
            mental_health_questions = json.load(f)
    except Exception as e:
        logging.error(f"Error loading assessment questions: {e}")
        mental_health_questions = []

load_mental_health_questions()

def analyze_responses_with_together(conversation_history, assessment_mode=False, answers=None):
    try:
        system_message = {
            "role": "system",
            "content": """You are MentaLyze, an AI-powered mental health chatbot dedicated to providing empathetic, supportive, and personalized emotional assistance 24/7. Your primary goal is to help users feel heard, understood, and guided toward improving their mental well-being in a safe and respectful manner.

Guidelines:

1. **Empathy and Compassion**  
- Always respond with warmth, kindness, and understanding.  
- Validate the user's feelings and experiences without judgment.  
- Use comforting language that encourages openness and trust.

2. **User Safety and Crisis Management**  
- If the user expresses suicidal thoughts, self-harm intentions, or severe distress, respond with immediate empathy and encourage them to seek professional help.  
- Provide emergency resources (hotline numbers, crisis centers) where appropriate.  
- If the user triggers the emergency alert, confirm the action and reassure them that help is on the way.  
- Never provide medical diagnosis or prescribe treatment.

3. **Personalized Support and Guidance**  
- Use information from mood tracking and assessment responses to tailor advice and coping strategies.  
- Suggest evidence-based coping mechanisms such as mindfulness, breathing exercises, journaling, or seeking social support.  
- Encourage users to engage in positive habits and self-care routines.

4. **Mental Health Assessment**  
- When conducting assessments, ask questions clearly and respectfully.  
- Adapt questions based on user responses to explore areas of concern more deeply.  
- Summarize assessment results in an understandable, non-clinical way, highlighting strengths and areas for improvement.  
- Remind users that assessments are informational and do not replace professional evaluation.

5. **Privacy and Confidentiality**  
- Respect user privacy; do not share or store personal information beyond what is necessary for session continuity.  
- Inform users that conversations are confidential but not a substitute for professional counseling.

6. **Limitations and Transparency**  
- Clearly communicate that you are an AI assistant and not a licensed therapist or doctor.  
- Encourage users to seek professional help for serious or persistent mental health issues.  
- Avoid making promises or guarantees about outcomes.

7. **Tone and Style**  
- Maintain a calm, gentle, and encouraging tone.  
- Avoid technical jargon; use simple, clear language.  
- Be patient and allow users to express themselves fully.

8. **Emergency Situations**  
- If the user indicates immediate danger to self or others, urge them to call emergency services or a trusted person right away.  
- Provide contact information for local or national crisis helplines when available.  
- Do not attempt to handle emergencies alone; always direct users to human support.

9. **Inclusivity and Accessibility**  
- Use inclusive language that respects diverse backgrounds, identities, and experiences.  
- Be mindful of cultural differences in expressing and coping with mental health issues.

Summary:  
You are a compassionate, responsible AI mental health companion. Your responses should always prioritize the user’s emotional safety, provide helpful support, and encourage professional care when necessary. Your role is to listen, support, guide, and empower users on their mental health journey.

Begin each conversation by warmly welcoming the user and inviting them to share how they are feeling today."""
        }
        if assessment_mode and answers:
            prompt = "Analyze these assessment answers:\n" + "\n".join(answers)
            messages = [system_message, {"role": "user", "content": prompt}]
        elif conversation_history:
            prompt = "Continue this conversation:\n" + "\n".join([msg["content"] for msg in conversation_history])
            messages = [system_message, {"role": "user", "content": prompt}]
        else:
            messages = [system_message, {"role": "user", "content": "Hello, how can I assist you today?"}]

        # Call Together API for response
        response = client.chat.completions.create(
            model="mistralai/Mistral-Small-24B-Instruct-2501",
            messages=messages,
            max_tokens=500,
            temperature=0.7,
        )
        return response.choices[0].message.content
    except Exception as e:
        logging.error(f"Error in analyze_responses_with_together: {e}", exc_info=True)
        return "Sorry, I encountered an error processing your request."

@app.before_request
def make_session_permanent():
    session.permanent = True

@app.route('/', methods=['GET'])
def serve_index():
    return send_from_directory(os.getcwd(), 'index.html')

@app.route('/api/start_detailed_assessment', methods=['POST'])
def start_detailed_assessment():
    data = request.json
    user_name = data.get("username", None)
    if not user_name:
        user_name = session.get('user_id')
    if not user_name:
        user_name = f"user_{random.randint(1000,9999)}"
        session['user_id'] = user_name

    user_assessment_state[user_name] = {
        "current_question_index": 0,
        "answered_questions": set(),
        "assessment_history": []
    }

    return jsonify({
        'reply': mental_health_questions[0]['question'] if mental_health_questions else "No questions available.",
        'status': 'detailed_assessment'
    })

@app.route('/api/start_general_assessment', methods=['POST'])
def start_general_assessment():
    data = request.json
    user_name = data.get("username", None)
    if not user_name:
        user_name = session.get('user_id')
    if not user_name:
        user_name = f"user_{random.randint(1000,9999)}"
        session['user_id'] = user_name

    user_assessment_state[user_name] = {
        "current_question_index": 0,
        "answered_questions": set(),
        "assessment_history": []
    }

    return jsonify({
        'reply': mental_health_questions[0]['question'] if mental_health_questions else "No questions available.",
        'status': 'general_assessment'
    })

def select_next_question(user_message, answered_questions):
    scores = {}
    for question_index, question in enumerate(mental_health_questions):
        if question_index not in answered_questions:
            if any(keyword in user_message.lower() for keyword in question['options']):
                scores[question_index] = scores.get(question_index, 0) + 1

    if scores:
        next_question_index = max(scores, key=scores.get)
        return next_question_index
    return None

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    if not data or 'message' not in data:
        return jsonify({"error": "Invalid request"}), 400
    user_message = data['message']

    user_id = session.get('user_id')
    if not user_id:
        user_id = f"user_{random.randint(1000,9999)}"
        session['user_id'] = user_id

    logging.info(f"Chat request from user_id: {user_id} with message: {user_message}")

    history = user_chat_history.get(user_id, [])
    logging.info(f"Current conversation history length: {len(history)}")
    history.append({"role": "user", "content": user_message})

    if user_id in user_assessment_state:
        assessment_state = user_assessment_state[user_id]
        current_question_index = assessment_state["current_question_index"]
        answered_questions = assessment_state["answered_questions"]
        assessment_history = assessment_state["assessment_history"]

        assessment_history.append({
            "question_index": current_question_index,
            "question": mental_health_questions[current_question_index]['question'],
            "answer": user_message
        })

        answered_questions.add(current_question_index)

        next_question_index = select_next_question(user_message, answered_questions)

        if next_question_index is not None:
            assessment_state["current_question_index"] = next_question_index
            return jsonify({
                'reply': mental_health_questions[next_question_index]['question'],
                'status': 'assessment'
            })
        else:
            analysis = analyze_responses_with_together(
                conversation_history=None,
                assessment_mode=True,
                answers=[q["answer"] for q in assessment_history]
            )
            del user_assessment_state[user_id]
            return jsonify({
                'reply': analysis,
                'status': 'analysis'
            })
    else:
        ai_response = analyze_responses_with_together(history)
        history.append({"role": "assistant", "content": ai_response})
        user_chat_history[user_id] = history
        return jsonify({"reply": ai_response})

@app.route('/api/model_benchmark', methods=['GET'])
def get_model_benchmark():
    try:
        with open('static/data/model_benchmark.json', 'r') as f:
            benchmark_data = json.load(f)
        return jsonify(benchmark_data)
    except Exception as e:
        logging.error(f"Failed to load benchmark data: {e}")
        return jsonify({"error": "Failed to load benchmark data", "message": str(e)}), 500

@app.route('/api/assessment_questions', methods=['GET'])
def get_assessment_questions():
    try:
        with open('static/data/assessment_questions.json', 'r') as f:
            questions = json.load(f)
        return jsonify(questions)
    except Exception as e:
        logging.error(f"Failed to load assessment questions: {e}")
        return jsonify({"error": "Failed to load assessment questions", "message": str(e)}), 500

@app.route('/api/test_together', methods=['GET'])
def test_together():
    try:
        response = client.chat.completions.create(
            model="mistralai/Mistral-Small-24B-Instruct-2501",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10,
            temperature=0.7,
        )
        return jsonify({"response": response.choices[0].message.content})
    except Exception as e:
        logging.error(f"Error in test_together route: {e}", exc_info=True)
        return jsonify({"error": "Failed to get response from Together API", "message": str(e)}), 500

@app.route('/api/assessment_analysis', methods=['POST'])
def assessment_analysis():
    data = request.get_json()
    answers = data.get("answers", [])
    if not answers:
        return jsonify({"error": "No answers provided"}), 400
    analysis = analyze_responses_with_together(
        conversation_history=None,
        assessment_mode=True,
        answers=answers
    )
    return jsonify({"analysis": analysis})

@socketio.on('voice_message')
def handle_voice_message(data):
    user_id = session.get('user_id')
    if not user_id:
        user_id = f"user_{random.randint(1000,9999)}"
        session['user_id'] = user_id

    message = data
    if not message:
        emit('bot_response', 'Sorry, I did not receive any message.')
        return

    # Get user chat history or initialize
    history = user_chat_history.get(user_id, [])
    history.append({"role": "user", "content": message})

    # Process message with AI
    ai_response = analyze_responses_with_together(history)

    # Append AI response to history
    history.append({"role": "assistant", "content": ai_response})
    user_chat_history[user_id] = history

    # Emit response back to client
    emit('bot_response', ai_response)

if __name__ == '__main__':
    socketio.run(app, debug=True)
