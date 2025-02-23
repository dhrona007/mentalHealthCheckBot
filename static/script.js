// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const emergencyBtn = document.getElementById('emergency-btn');
const moodButtons = {
  happy: document.getElementById('happy-btn'),
  sad: document.getElementById('sad-btn'),
  anxious: document.getElementById('anxious-btn'),
};

// Function to add a message to the chat window
function addMessage(role, message) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', role);
  messageElement.innerHTML = `<strong>${role}:</strong> ${message}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight; // Auto-scroll to bottom
}

// Function to send a message to the backend (OpenAI request via backend)
async function sendMessage(message) {
  if (!message) return;
  addMessage('You', message);

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) throw new Error('Failed to fetch response');
    
    const data = await response.json();
    addMessage('Bot', data.reply);
  } catch (error) {
    console.error('Error sending message:', error);
    addMessage('Bot', 'Sorry, something went wrong. Please try again.');
  }
}

// Function to track mood
function trackMood(mood) {
  addMessage('Bot', `You're feeling ${mood}. Let me know if you want to talk.`);
  sendMessage(`I'm feeling ${mood}. Can you help me?`);
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
    sendMessage(chatInput.value.trim());
    chatInput.value = '';
  }
});

// Smooth scrolling for navbar links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
      e.preventDefault(); // Prevent default anchor behavior

      const targetId = this.getAttribute('href'); // Get the target section ID
      const targetSection = document.querySelector(targetId); // Find the target section

      if (targetSection) {
          const targetPosition = targetSection.offsetTop; // Get the position of the target section
          const startPosition = window.pageYOffset; // Current scroll position
          const distance = targetPosition - startPosition - 100; // Distance to scroll
          const duration = 1000; // Duration of the scroll animation in milliseconds
          let startTime = null;

          function animation(currentTime) {
              if (startTime === null) startTime = currentTime;
              const timeElapsed = currentTime - startTime;
              const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
              window.scrollTo(0, run);
              if (timeElapsed < duration) requestAnimationFrame(animation);
          }

          // Easing function for smooth scrolling
          function easeInOutQuad(t, b, c, d) {
              t /= d / 2;
              if (t < 1) return c / 2 * t * t + b;
              t--;
              return -c / 2 * (t * (t - 2) - 1) + b;
          }

          requestAnimationFrame(animation);
      }
  });
});


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
    const response = await fetch('http://127.0.0.1:5000/api/chat', { // Update this URL if your Flask server is hosted elsewhere
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) throw new Error('Failed to fetch response');
    
    const data = await response.json();
    addMessage('Bot', data.reply);
  } catch (error) {
    console.error('Error sending message:', error);
    addMessage('Bot', 'Sorry, something went wrong. Please try again.');
  }
}

// Function to track mood
function trackMood(mood) {
  addMessage('Bot', `You're feeling ${mood}. Let me know if you want to talk.`);
  sendMessage(`I'm feeling ${mood}. Can you help me?`);
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
    sendMessage(chatInput.value.trim());
    chatInput.value = '';
  }
});

// Smooth scrolling for navbar links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
      e.preventDefault(); // Prevent default anchor behavior

      const targetId = this.getAttribute('href'); // Get the target section ID
      const targetSection = document.querySelector(targetId); // Find the target section

      if (targetSection) {
          const targetPosition = targetSection.offsetTop; // Get the position of the target section
          const startPosition = window.pageYOffset; // Current scroll position
          const distance = targetPosition - startPosition - 100; // Distance to scroll
          const duration = 1000; // Duration of the scroll animation in milliseconds
          let startTime = null;

          function animation(currentTime) {
              if (startTime === null) startTime = currentTime;
              const timeElapsed = currentTime - startTime;
              const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
              window.scrollTo(0, run);
              if (timeElapsed < duration) requestAnimationFrame(animation);
          }

          // Easing function for smooth scrolling
          function easeInOutQuad(t, b, c, d) {
              t /= d / 2;
              if (t < 1) return c / 2 * t * t + b;
              t--;
              return -c / 2 * (t * (t - 2) - 1) + b;
          }

          requestAnimationFrame(animation);
      }
  });
});

moodButtons.happy.addEventListener('click', () => trackMood('Happy'));
moodButtons.sad.addEventListener('click', () => trackMood('Sad'));
moodButtons.anxious.addEventListener('click', () => trackMood('Anxious'));

emergencyBtn.addEventListener('click', sendEmergencyAlert);
