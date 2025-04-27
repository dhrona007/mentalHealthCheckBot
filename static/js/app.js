// Mentalyze Unified Frontend Application

// Application State
const appState = {
  user: null,
  currentView: "home",
  isAssessmentActive: false,
  moodHistory: [],
  darkMode: false,
  voiceEnabled: false,
  voiceController: null,
  responses: [],
  voiceActive: false,
};

// Auto-collapse Bootstrap navbar on nav link click (for mobile)
document.addEventListener("DOMContentLoaded", function () {
  var navbarCollapse = document.getElementById("navbarTogglerDemo01");
  var bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });

  document
    .querySelectorAll("#navbarTogglerDemo01 .nav-link")
    .forEach(function (navLink) {
      navLink.addEventListener("click", function () {
        if (
          window.getComputedStyle(document.querySelector(".navbar-toggler"))
            .display !== "none"
        ) {
          bsCollapse.hide();
        }
      });
    });
});

// Voice Controller
class VoiceController {
  constructor() {
    this.speechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    this.speechSynthesis = window.speechSynthesis;
    this.recognition = null;
    this.isListening = false;
    this.voice = null;
    this.loadVoices();
  }

  loadVoices() {
    const voices = this.speechSynthesis.getVoices();
    if (voices.length > 0) {
      // Select a preferred voice, e.g., a female English voice with natural accent
      this.voice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.toLowerCase().includes("female") ||
            v.name.toLowerCase().includes("google us english") ||
            v.name.toLowerCase().includes("zira") ||
            v.name.toLowerCase().includes("susan"))
      );
      if (!this.voice) {
        this.voice = voices[0];
      }
    } else {
      // Voices not loaded yet, try again after a delay
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadVoices();
      };
    }
  }

  init() {
    if (!this.speechRecognition) {
      console.warn("Speech Recognition not supported");
      return false;
    }

    this.recognition = new this.speechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = "en-US";

    return true;
  }

  startListening(callback) {
    if (!this.recognition) return;

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      callback(transcript);
    };

    this.recognition.start();
    this.isListening = true;
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(text) {
    if (!this.speechSynthesis) return;

    // Cancel any ongoing speech to avoid overlapping
    if (this.speechSynthesis.speaking) {
      this.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) {
      utterance.voice = this.voice;
    }
    utterance.rate = 1.1; // Slightly slower for naturalness
    utterance.pitch = 1.1; // Slightly higher pitch for warmth
    utterance.volume = 1;

    this.speechSynthesis.speak(utterance);
  }
}

// Initialize voice controller
appState.voiceController = new VoiceController();

// Navigation setup
function setupNavigation() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const view = e.target.getAttribute("href").substring(1);
      showView(view);
      // Update active class
      document
        .querySelectorAll(".nav-link")
        .forEach((nav) => nav.classList.remove("active"));
      e.target.classList.add("active");
    });
  });
}
// Auto-collapse Bootstrap navbar on nav link click (for mobile)
document.addEventListener("DOMContentLoaded", function () {
  var navbarCollapse = document.getElementById("navbarTogglerDemo01");
  var bsCollapse = new bootstrap.Collapse(navbarCollapse, { toggle: false });

  document
    .querySelectorAll("#navbarTogglerDemo01 .nav-link")
    .forEach(function (navLink) {
      navLink.addEventListener("click", function () {
        if (
          window.getComputedStyle(document.querySelector(".navbar-toggler"))
            .display !== "none"
        ) {
          bsCollapse.hide();
        }
      });
    });
});
// Show view
function showView(view) {
  appState.currentView = view;
  document.querySelectorAll(".section").forEach((section) => {
    section.style.display = "none";
  });
  document.getElementById(view).style.display = "block";
}

// Load initial data
function loadInitialData() {
  const savedMoodHistory = localStorage.getItem("moodHistory");
  if (savedMoodHistory) {
    appState.moodHistory = JSON.parse(savedMoodHistory);
  }
}

// Chat Module
function initChat() {
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const chatMessages = document.getElementById("chat-messages");

  let isSending = false;

  sendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  });

  function addChatMessage(sender, text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;
    if (sender === "ai") {
      // Parse markdown and set as HTML
      messageDiv.innerHTML = marked.parse(text || "");
    } else {
      // For user messages, set as plain text for safety
      messageDiv.textContent = text;
    }
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async function sendMessage() {
    if (isSending) return;

    const message = chatInput.value.trim();
    if (!message) return;

    // Allow all messages without restriction

    isSending = true;
    sendBtn.disabled = true;
    sendBtn.textContent = "Loading...";

    addChatMessage("user", message);
    chatInput.value = "";

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();
      addChatMessage("ai", data.reply);
    } catch (error) {
      addChatMessage("ai", `⚠️ Error: ${error.message}`);
    } finally {
      isSending = false;
      sendBtn.disabled = false;
      sendBtn.textContent = "Send";
    }
  }
}

// Assessment Module
async function initAssessment() {
  const questionsContainer = document.getElementById("assessment-questions");
  const startBtn = document.getElementById("start-assessment-btn");
  const progressText = document.getElementById("assessment-progress");
  const prevBtn = document.getElementById("prev-question-btn");
  const nextBtn = document.getElementById("next-question-btn");
  const descriptionDiv = document.getElementById("assessment-description");
  const navigationDiv = document.getElementById("assessment-navigation");

  let assessmentQuestions = [];

  function resetAssessmentUI() {
    descriptionDiv.style.display = "block";
    startBtn.style.display = "inline-block";
    questionsContainer.style.display = "none";
    navigationDiv.style.display = "none";
    progressText.textContent = "";
  }

  startBtn.addEventListener("click", () => {
    if (assessmentQuestions.length === 0) {
      alert("Assessment questions not loaded. Please try again later.");
      return;
    }
    appState.responses = new Array(assessmentQuestions.length);
    appState.currentView = "assessment";
    showView("assessment");
    descriptionDiv.style.display = "none";
    startBtn.style.display = "none";
    questionsContainer.style.display = "block";
    navigationDiv.style.display = "block";
    renderQuestion(0);
  });

  prevBtn.addEventListener("click", () => {
    if (appState.currentQuestionIndex > 0) {
      appState.currentQuestionIndex--;
      renderQuestion(appState.currentQuestionIndex);
    }
  });

  nextBtn.addEventListener("click", () => {
    if (appState.currentQuestionIndex < assessmentQuestions.length - 1) {
      appState.currentQuestionIndex++;
      renderQuestion(appState.currentQuestionIndex);
    }
  });

  function renderQuestion(index) {
    appState.currentQuestionIndex = index;
    const q = assessmentQuestions[index];
    questionsContainer.innerHTML = `
      <div class="question">
        <h3>Question ${index + 1} of ${assessmentQuestions.length}</h3>
        <p>${q.question}</p>
        <div class="options">
          ${q.options
            .map(
              (opt, i) => `
            <button class="option" data-value="${opt}" data-index="${i}">${opt}</button>
          `
            )
            .join("")}
        </div>
      </div>
    `;

    progressText.textContent = `Answered ${index} / ${assessmentQuestions.length} questions`;

    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === assessmentQuestions.length - 1;

    document.querySelectorAll(".option").forEach((button) => {
      button.addEventListener("click", () => {
        appState.responses[index] = {
          question: q.question,
          answer: button.getAttribute("data-value"),
          score: parseInt(button.getAttribute("data-index")) + 1,
        };
        if (index < assessmentQuestions.length - 1) {
          renderQuestion(index + 1);
        } else {
          showCompletion();
        }
      });
    });
  }

  function showCompletion() {
    questionsContainer.innerHTML = `
      <div class="question">
        <h3>Assessment Complete</h3>
        <p>Thank you for completing the assessment.</p>
        <button id="view-results-btn" class="btn-primary">View Results</button>
      </div>
    `;
    progressText.textContent = "Assessment complete.";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    navigationDiv.style.display = "none";

    document
      .getElementById("view-results-btn")
      .addEventListener("click", showResults);
  }

  async function showResults() {
    const answers = appState.responses.map((r) => r?.answer || null);

    questionsContainer.innerHTML = `
      <div class="question">
        <h3>Your Assessment Results</h3>
        <p>Loading analysis...</p>
      </div>
    `;

    try {
      const response = await fetch("/api/assessment_analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) throw new Error("Failed to get analysis");

      const data = await response.json();

      questionsContainer.innerHTML = `
        <div class="question">
          <h3>Your Assessment Analysis</h3>
          <div class="analysis-content" id="analysis-content">${marked.parse(
            data.analysis || ""
          )}</div>
          <button id="download-report" class="btn-primary" style="margin-top: 10px;">Download reports</button>
          <button id="restart-assessment" class="btn-primary" style="margin-top: 10px;">Restart Assessment</button>
        </div>
      `;

      document
        .getElementById("restart-assessment")
        .addEventListener("click", () => {
          resetAssessmentUI();
          appState.responses = new Array(assessmentQuestions.length);
          renderQuestion(0);
        });

      document
        .getElementById("download-report")
        .addEventListener("click", () => {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();
          const content =
            document.getElementById("analysis-content").innerText || "";
          const splitContent = doc.splitTextToSize(content, 180);
          doc.text(splitContent, 10, 10);
          doc.save("assessment_report.pdf");
        });
    } catch (error) {
      questionsContainer.innerHTML = `
        <div class="question">
          <h3>Error</h3>
          <p>Could not load analysis: ${error.message}</p>
          <button id="restart-assessment" class="btn-primary">Restart Assessment</button>
        </div>
      `;

      document
        .getElementById("restart-assessment")
        .addEventListener("click", () => {
          resetAssessmentUI();
          appState.responses = new Array(assessmentQuestions.length);
          renderQuestion(0);
        });
    }
  }

  // Initialize UI state
  resetAssessmentUI();

  // Fetch assessment questions from backend
  try {
    const response = await fetch("/api/assessment_questions");
    if (!response.ok) {
      throw new Error("Failed to load assessment questions");
    }
    assessmentQuestions = await response.json();
  } catch (error) {
    alert("Error loading assessment questions: " + error.message);
  }
}

// Mood Module
function initMood() {
  const happyBtn = document.getElementById("happy-btn");
  const sadBtn = document.getElementById("sad-btn");
  const anxiousBtn = document.getElementById("anxious-btn");
  const moodChartCanvas = document.createElement("canvas");
  moodChartCanvas.id = "mood-chart";
  moodChartCanvas.style.maxWidth = "600px";
  moodChartCanvas.style.marginTop = "20px";

  const moodSection = document.getElementById("mood");
  moodSection.appendChild(moodChartCanvas);

  let moodChart = null;
  let moodCounts = { happy: 0, sad: 0, anxious: 0 };

  happyBtn.addEventListener("click", () => recordMood("happy"));
  sadBtn.addEventListener("click", () => recordMood("sad"));
  anxiousBtn.addEventListener("click", () => recordMood("anxious"));

  function recordMood(mood) {
    const now = new Date();

    appState.moodHistory.push({
      mood,
      timestamp: now.toISOString(),
    });

    // Increment mood count dynamically
    if (moodCounts.hasOwnProperty(mood)) {
      moodCounts[mood]++;
    }

    saveMoodHistory();
    updateMoodChart();

    // Provide user feedback on mood selection
    // alert(`Mood recorded: ${mood}`);

    // In a real app, send mood to backend here
  }

  function saveMoodHistory() {
    localStorage.setItem("moodHistory", JSON.stringify(appState.moodHistory));
  }

  function updateMoodChart() {
    const total = moodCounts.happy + moodCounts.sad + moodCounts.anxious;
    const data = {
      labels: ["Happy", "Sad", "Anxious"],
      datasets: [
        {
          label: "Mood Distribution",
          data: [
            ((moodCounts.happy / total) * 100).toFixed(1),
            ((moodCounts.sad / total) * 100).toFixed(1),
            ((moodCounts.anxious / total) * 100).toFixed(1),
          ],
          backgroundColor: ["#28a745", "#17a2b8", "#ffc107"],
          hoverOffset: 30,
        },
      ],
    };

    const config = {
      type: "doughnut",
      data: data,
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                return `${context.label}: ${context.parsed}%`;
              },
            },
          },
          legend: {
            position: "bottom",
            labels: {
              font: {
                size: 14,
              },
            },
          },
        },
      },
    };

    if (moodChart) {
      // Update existing chart data and options dynamically
      moodChart.data.labels = data.labels;
      moodChart.data.datasets = data.datasets;
      moodChart.options = config.options;
      moodChart.update();
    } else {
      moodChart = new Chart(document.getElementById("mood-chart"), config);
    }

    // Update mood feedback text
    const feedbackDiv = document.getElementById("mood-feedback");
    if (appState.moodHistory.length > 0) {
      const lastMood =
        appState.moodHistory[appState.moodHistory.length - 1].mood;
      feedbackDiv.textContent = `Last mood recorded: ${lastMood}`;
    } else {
      feedbackDiv.textContent = "";
    }
  }

  // Load existing mood history and render chart
  if (appState.moodHistory.length > 0) {
    // Recalculate moodCounts from history on load
    moodCounts = { happy: 0, sad: 0, anxious: 0 };
    appState.moodHistory.forEach((entry) => {
      if (moodCounts.hasOwnProperty(entry.mood)) {
        moodCounts[entry.mood]++;
      }
    });
    updateMoodChart();
  }
}

//Dark Mode Toggle
function initDarkMode() {
  const darkModeToggle = document.createElement("button");
  darkModeToggle.id = "dark-mode-toggle";
  darkModeToggle.textContent = "Toggle Dark Mode";
  darkModeToggle.style.position = "fixed";
  darkModeToggle.style.top = "10px";
  darkModeToggle.style.right = "10px";
  darkModeToggle.style.zIndex = "1000";
  // document.body.appendChild(darkModeToggle);

  // Load saved preference
  const savedMode = localStorage.getItem("darkMode");
  if (savedMode === "true") {
    document.body.classList.add("dark-mode");
    appState.darkMode = true;
  }

  // darkModeToggle.addEventListener("click", () => {
  //   appState.darkMode = !appState.darkMode;
  //   if (appState.darkMode) {
  //     document.body.classList.add("dark-mode");
  //   } else {
  //     document.body.classList.remove("dark-mode");
  //   }
  //   localStorage.setItem("darkMode", appState.darkMode);
  // });
}

function initApp() {
  appState.voiceEnabled = appState.voiceController.init();

  initDarkMode();
  initChat();
  initAssessment();
  initMood();

  setupNavigation();

  // Emergency button event listener
  const emergencyBtn = document.getElementById("emergency-btn");
  if (emergencyBtn) {
    emergencyBtn.addEventListener("click", async () => {
      try {
        const response = await fetch("/api/emergency_alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ timestamp: new Date().toISOString() }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        alert("Emergency alert sent successfully!");
      } catch (error) {
        alert("Failed to send emergency alert: " + error.message);
      }
    });
  }

  // Voice Chat Socket.io Integration
  if (appState.voiceEnabled) {
    const socket = io();

    const startVoiceChatBtn = document.getElementById("start-voice-chat-btn");
    const voiceChatMessages = document.getElementById("voice-chat-messages");

    function appendVoiceChatMessage(sender, text) {
      const messageDiv = document.createElement("div");
      messageDiv.className = `message ${sender}`;

      if (sender === "ai") {
        messageDiv.innerHTML = marked.parse(text || "");
      } else {
        messageDiv.textContent = text;
      }
      voiceChatMessages.appendChild(messageDiv);
      voiceChatMessages.scrollTop = voiceChatMessages.scrollHeight;
    }

    startVoiceChatBtn.addEventListener("click", () => {
      if (appState.voiceActive) {
        appState.voiceController.stopListening();
        appState.voiceActive = false;
        startVoiceChatBtn.textContent = "Start Voice Chat";
      } else {
        appState.voiceController.startListening((transcript) => {
          appendVoiceChatMessage("user", transcript);
          socket.emit("voice_message", transcript);
        });
        appState.voiceActive = true;
        startVoiceChatBtn.textContent = "Listening... Click to Stop";
      }
    });

    socket.on("bot_response", (msg) => {
      appendVoiceChatMessage("ai", msg);
      appState.voiceController.speak(msg);
    });
  }

  loadInitialData();
  showView("home");
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initApp();
  loadModelBenchmark();
});

// Function to fetch and display model benchmark data
async function loadModelBenchmark() {
  const container = document.getElementById("model-comparison-content");
  try {
    const response = await fetch("/api/model_benchmark");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (data.error) {
      container.innerHTML = `<p>Error loading benchmark data: ${data.error}</p>`;
      return;
    }

    // Build HTML for model comparison
    let html = '<ul style="list-style: none; padding-left: 0;">';
    data.models.forEach((model) => {
      html += `
        <li style="margin-bottom: 15px;">
          <strong>${model.name}</strong><br/>
          Average Response Time: <strong>${
            model.average_response_time_ms
          } ms</strong><br/>
          <em>${model.description}</em>
          <div style="background: #ddd; border-radius: 5px; overflow: hidden; margin-top: 5px; height: 15px; width: 100%;">
            <div style="background: #4a6fa5; height: 100%; width: ${Math.min(
              model.average_response_time_ms / 15,
              100
            )}%;"></div>
          </div>
        </li>
      `;
    });
    html += "</ul>";
    html += `<p style="font-style: italic; margin-top: 10px;">${data.comparison_note}</p>`;

    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `<p>Error loading benchmark data: ${error.message}</p>`;
  }
}
