// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const emergencyBtn = document.getElementById('emergency-btn');

// Function to add a message to the chat window
function addMessage(role, message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', role);
  messageElement.innerHTML = `<strong>${role}:</strong> ${message}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to bottom
}

// Function to send a message to the backend (Flask server)
async function sendMessage(message) {
  if (!message) return;
  addMessage('You', message);

  try {
    const response = await fetch('http://127.0.0.1:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) throw new Error('Failed to fetch response');
    
    const data = await response.json();
    if (data.status === 'question') {
      // Display the next question
      addMessage('Mentalyze', data.reply);
    } else if (data.status === 'analysis') {
      // Display the analysis
      addMessage('Mentalyze', data.reply);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    addMessage('Mentalyze', 'Sorry, something went wrong. Please try again.');
  }
}

// Function to send emergency alert
function sendEmergencyAlert() {
  alert('Emergency alert triggered! Please contact a trusted person or helpline.');
}

// Event Listeners
sendBtn.addEventListener('click', () => {
  const message = chatInput.value.trim();
  sendMessage(message);
  chatInput.value = '';
});

chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const message = chatInput.value.trim();
    sendMessage(message);
    chatInput.value = '';
  }
});

emergencyBtn.addEventListener('click', sendEmergencyAlert);

// Ask the first question when the page loads
window.onload = () => {
  addMessage('Mentalyze', QUESTIONS[0]);
};