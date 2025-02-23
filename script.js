:root {
  --navbar-height: 80px;
  --primary-color: #007bff;
  --success-color: #28a745;
  --danger-color: #dc3545;
  --text-color: #333;
  --white: #fff;
  --black: #000;
  --background-opacity: 0.7;
}

body {
  font-family: Arial, sans-serif;
  background: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, var(--background-opacity))),
    url("https://static.vecteezy.com/system/resources/previews/025/446/274/large_2x/mental-health-happiness-creative-abstract-concept-colorful-illustration-of-male-head-paint-splatter-style-mindfulness-positive-thinking-self-care-idea-banner-white-background-generative-ai-photo.jpg") no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
  color: var(--text-color);
  margin: 0;
  padding: 10px;
  line-height: 1.6;
  opacity : 0.82;
  scrollbar-width: thin;
  scrollbar-color: #fcfcfc transparent;
  background-color: transparent;
  
}

.navbar {
  padding-bottom  : 60px;
}
/* Navbar spacing for sections */
#Home,
#core-objectives,
#future-goals,
#aboutUs {
  padding-top: var(--navbar-height);
  scroll-margin-top: var(--navbar-height);

}

#aboutUs {
  min-height : 200px;
}
.chat-sectionindow {
  background-color: rgba(7, 5, 0, 0.718);
  border-radius: 10px;
}

.mainContent {
  color: white;
  padding: 20px;
  border-radius: 10px;
  margin: auto;
  max-width: 800px;
  opacity: 1;
  z-index: 1;
}

.mainContent h1 {
  font-size: 3rem;
  margin-bottom: 15px;
}

.mainContent p {
  font-size: 1.2rem;
  margin-bottom: 20px;
}

.mainContent .btn {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 10px 20px;
  font-size: 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.mainContent .btn:hover {
  background-color: #0056b3;
}

.container {
  background: transparent;
  padding: 20px;
  padding-bottom : 10px;
  border-radius: 10px;
  width: 500px;
  text-align: center;
  align-items: center;
  height : auto;
}

.chat-sectionindow {
  /* background-color: rgba(7, 5, 0, 0.718); */
  background-color: rgba(255, 255, 255, 0.718);
  border-radius: 10px;

 /* Add margin to push content below */
  max-height: 600px; /* Minimum height to ensure it doesn't collapse */
  z-index: 1; /* Ensure it doesn't overlap other content */
}

#chat-messages {
  /* color: var(--black); */
  max-height: 200px; /* Limit the height of the chat messages area */
  overflow-y: auto; /* Add scroll if messages exceed the height */
  margin-bottom: 5px; /* Add space below the chat messages */
  scrollbar-width: thin;
  scrollbar-color: #888 transparent;
}

#chat-messages::-webkit-scrollbar {
  width: 8px; /* Width of the scrollbar */
}

#chat-messages::-webkit-scrollbar-thumb {
  background-color: #888; /* Color of the scrollbar thumb */
  border-radius: 4px; /* Rounded corners for the thumb */
}

#chat-messages::-webkit-scrollbar-track {
  background-color: transparent; /* Transparent track */
}

#chat-input {
  width: calc(100% - 90px);
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-right: 10px;
}

#send-btn,
#emergency-btn {
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  min-width: 100px;
  max-width: 170px;
  max-height: 60px;
  margin: 10px;
  margin-top : 20px;
}

#send-btn {
  background-color: var(--success-color);
  color: var(--white);
}

#emergency-btn {
  background-color: var(--danger-color);
  color: var(--white);
}

#send-btn:hover {
  background-color: #218838;
}

#emergency-btn:hover {
  background-color: #c82333;
}

.mood-buttons button {
  background-color: var(--primary-color);
  color: var(--white);
  border: none;
  padding: 10px 20px;
  margin: 5px;
  border-radius: 5px;
  cursor: pointer;
}

.mood-buttons button:hover {
  background-color: #0056b3;
}

section {
  margin: 40px auto;
  padding: 30px;
  max-width: 900px;
  background: var(--white);
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  color: var(--text-color);
}

.aboutus {
  margin-bottom: 100px;
  max-height: 350px;
}
