// Replace these config values with yours!
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "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",
  authDomain: "YOUR_AUTH_DOMAIN_HERE",
  projectId: "YOUR_PROJECT_ID_HERE",
  storageBucket: "YOUR_STORAGE_BUCKET_HERE",
  messagingSenderId: "YOUR_MSG_SENDER_ID",
  appId: "YOUR_APP_ID_HERE",
  measurementId: "YOUR_MEASUREMENT_ID"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { doc, setDoc, getDoc, updateDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const loginMessage = document.getElementById('login-message');

const seedStockDiv = document.getElementById('seed-stock');
const playerMoneyDiv = document.getElementById('player-money');
const weatherDisplay = document.getElementById('weather-display');
const adminBackdoorBtn = document.getElementById('admin-backdoor-btn');

let currentUser = null;
let playerMoney = 100; // start with money for 5 carrots @ 20 each
let seeds = [];
let seedStock = [];
let weather = 'Sunny';
let weatherMultiplier = 1;

const fruits = [
  { name: 'Carrot', rarity: 'Common', price: 20, growTime: 2*60*1000 },
  { name: 'Strawberry', rarity: 'Uncommon', price: 100, growTime: 5*60*1000 },
  { name: 'Blueberry', rarity: 'Rare', price: 250, growTime: 7*60*1000 },
  { name: 'Golden Apple', rarity: 'Legendary', price: 1000, growTime: 12*60*1000 }
];

function updateUI() {
  playerMoneyDiv.textContent = `Money: $${playerMoney}`;
  seedStockDiv.textContent = 'Seed Stock: ' + seedStock.map(s => `${s.name} ($${s.price})`).join(', ');
  weatherDisplay.textContent = `Weather: ${weather} x${weatherMultiplier}`;
}

function rotateSeedStock() {
  // Always keep carrot in stock, replace others randomly
  seedStock = [{ ...fruits[0] }]; // carrot
  let others = fruits.slice(1);
  // Randomly pick 2 others every 5 minutes
  let chosen = [];
  while (chosen.length < 2) {
    let pick = others[Math.floor(Math.random()*others.length)];
    if (!chosen.includes(pick)) chosen.push(pick);
  }
  seedStock = seedStock.concat(chosen);
  updateUI();
}

function changeWeather() {
  const weatherTypes = ['Sunny', 'Rainy', 'Chocolate Tsunami', 'Golden Tsunami'];
  const chosen = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
  weather = chosen;

  switch (chosen) {
    case 'Sunny': weatherMultiplier = 1; break;
    case 'Rainy': weatherMultiplier = 1.5; break;
    case 'Chocolate Tsunami': weatherMultiplier = 5; break;
    case 'Golden Tsunami': weatherMultiplier = 25; break;
  }
  updateUI();
}

setInterval(rotateSeedStock, 5*60*1000); // 5 mins
setInterval(changeWeather, 30*60*1000); // 30 mins
rotateSeedStock();
changeWeather();

// Authentication handlers
loginBtn.addEventListener('click', () => {
  signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
  .then(userCredential => {
    currentUser = userCredential.user;
    loginMessage.textContent = 'Logged in!';
    loginScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    startGame();
  })
  .catch(err => loginMessage.textContent = err.message);
});

registerBtn.addEventListener('click', () => {
  createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value)
  .then(userCredential => {
    currentUser = userCredential.user;
    loginMessage.textContent = 'Registered!';
    loginScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    startGame();
  })
  .catch(err => loginMessage.textContent = err.message);
});

// Basic game start placeholder
function startGame() {
  updateUI();
  // TODO: Initialize 3D canvas, player movement, planting, weather effects, etc.
  // This is where you'd initialize three.js or Babylon.js and your garden plot visuals.
}

// Admin Backdoor: Ctrl + Shift + B + code 'green-tornado-973' prompt to show controls
window.addEventListener('keydown', async (e) => {
  if (e.ctrlKey && e.shiftKey && e.code === 'KeyB') {
    const code = prompt('Enter admin code:');
    if (code === 'green-tornado-973') {
      alert('Admin controls enabled');
      adminBackdoorBtn.style.display = 'inline-block';
    }
  }
});

// Admin button click handler (example: toggle weather)
adminBackdoorBtn.addEventListener('click', () => {
  const weatherTypes = ['Sunny', 'Rainy', 'Chocolate Tsunami', 'Golden Tsunami'];
  let nextIndex = (weatherTypes.indexOf(weather) + 1) % weatherTypes.length;
  weather = weatherTypes[nextIndex];

  switch (weather) {
    case 'Sunny': weatherMultiplier = 1; break;
    case 'Rainy': weatherMultiplier = 1.5; break;
    case 'Chocolate Tsunami': weatherMultiplier = 5; break;
    case 'Golden Tsunami': weatherMultiplier = 25; break;
  }
  updateUI();
});

