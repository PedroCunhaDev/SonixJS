const usernameElement = document.getElementById("username");
const messageElement = document.getElementById("message");

const newcomer = ["Welcome to Sonix"];
const greetings = [
  // "Hello",
  // "Welcome back",
  // "Good to see you",
  // "Hey there",
  "Hi"
];
const morning = ["Good morning"];
const afternoon = ["Good afternoon"];
const night = ["Good evening"];

function getRandomGreeting() {
  const randomIndex = Math.floor(Math.random() * greetings.length);
  return greetings[randomIndex];
}

document.addEventListener("DOMContentLoaded", () => {
  const cachedUsername = localStorage.getItem("username");
  if (cachedUsername) {
    usernameElement.textContent = cachedUsername;
  }
  else {
    usernameElement.textContent = '_____';
  }
  messageElement.textContent = getRandomGreeting();
});

usernameElement.onclick = () => {
  if (usernameElement.textContent == '_____') {
    usernameElement.textContent = '';
  }
}
usernameElement.addEventListener("input", () => {
  const currentUsername = usernameElement.textContent;
  if (!currentUsername) {
    currentUsername = "_____";
  }
  localStorage.setItem("username", currentUsername);
});