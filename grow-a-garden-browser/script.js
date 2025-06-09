// --- Data and constants ---
const SEEDS = [
  {name:"Carrot", rarity:"common", basePrice:5, icon:"🥕"},
  {name:"Apple", rarity:"common", basePrice:10, icon:"🍎"},
  {name:"Banana", rarity:"common", basePrice:12, icon:"🍌"},
  {name:"Blueberry", rarity:"rare", basePrice:25, icon:"🫐"},
  {name:"Strawberry", rarity:"rare", basePrice:30, icon:"🍓"},
  {name:"Pineapple", rarity:"rare", basePrice:35, icon:"🍍"},
  {name:"Dragonfruit", rarity:"epic", basePrice:75, icon:"🐉"},
  {name:"Mango", rarity:"epic", basePrice:70, icon:"🥭"},
  {name:"Kiwi", rarity:"epic", basePrice:80, icon:"🥝"},
  {name:"Golden Apple", rarity:"legendary", basePrice:200, icon:"🍏"},
  {name:"Chocolate Berry", rarity:"legendary", basePrice:250, icon:"🍫"},
];

const RARITY_WEIGHTS = {
  "common": 50,
  "rare": 30,
  "epic": 15,
  "legendary": 5,
};

const STOCK_SIZE = 5;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const PRICE_VARIANCE = 0.10; // ±10% random price change
const PLANT_GROW_TIME = 5 * 60 * 1000; // 5 minutes grow time
const TSUNAMI_INTERVAL = 30 * 60 * 1000; // 30 minutes
const TSUNAMI_DURATION = 5 * 60 * 1000; // 5 minutes

// --- Variables ---
let balance = 0;
let inventory = {};
let prices = {};
let currentStock = [];
let currentWeather = {
  name: "Clear",
  effectMultiplier: 1,
  description: "No special weather."
};
let tsunamiActive = false;
let tsunamiType = null;
let tsunamiTimeout = null;

let plantedSeed = null;
let plantTime = null;

// --- DOM elements ---
const balanceEl = document.getElementById("balance");
const stockListEl = document.getElementById("stock");
const inventoryListEl = document.getElementById("inventory");
const buyBtn = document.getElementById("buy-btn");
const eventsEl = document.getElementById("events");
const plotStatusEl = document.getElementById("plot-status");
const plantBtn = document.getElementById("plant-btn");
const weatherStatusEl = document.getElementById("weather-status");

// --- Functions ---

function addEventLog(text, type="neutral") {
  const p = document.createElement("p");
  p.textContent = text;
  if(type === "positive") p.style.color = "green";
  else if(type === "negative") p.style.color = "red";
  else p.style.color = "#004400";
  eventsEl.prepend(p);
  // Limit log to last 50 entries
  if(eventsEl.children.length > 50) {
    eventsEl.removeChild(eventsEl.lastChild);
  }
}

function weightedRandomSeed() {
  const totalWeight = Object.values(RARITY_WEIGHTS).reduce((a,b) => a+b, 0);
  let rand = Math.random() * totalWeight;
  let chosenRarity = null;
  for(let rarity in RARITY_WEIGHTS) {
    rand -= RARITY_WEIGHTS[rarity];
    if(rand <= 0) {
      chosenRarity = rarity;
      break;
    }
  }
  const filtered = SEEDS.filter(s => s.rarity === chosenRarity);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function generateStock() {
  let stockSet = new Set();
  // Always add Carrot
  const carrotSeed = SEEDS.find(s => s.name === "Carrot");
  stockSet.add(carrotSeed);
  while(stockSet.size < STOCK_SIZE) {
    stockSet.add(weightedRandomSeed());
  }
  return Array.from(stockSet);
}

function renderStock() {
  stockListEl.innerHTML = "";
  currentStock.forEach(seed => {
    const li = document.createElement("li");
    li.textContent = `${seed.icon} ${seed.name} ($${prices[seed.name].toFixed(2)})`;
    li.dataset.seedName = seed.name;
    li.style.fontWeight = "bold";
    li.style.userSelect = "none";
    if (li.dataset.seedName === selectedSeedName) li.classList.add("selected");

    li.onclick = () => {
      selectedSeedName = seed.name;
      Array.from(stockListEl.children).forEach(c => c.classList.remove("selected"));
      li.classList.add("selected");
    };
    stockListEl.appendChild(li);
  });
}

function renderInventory() {
  inventoryListEl.innerHTML = "";
  for(let seedName in inventory) {
    const seed = SEEDS.find(s => s.name === seedName);
    const li = document.createElement("li");
    li.textContent = `${seed.icon} ${seedName}: ${inventory[seedName]}`;
    inventoryListEl.appendChild(li);
  }
  if(Object.keys(inventory).length === 0) {
    inventoryListEl.textContent = "No seeds or fruits in inventory.";
  }
}

function updateBalance() {
  balanceEl.textContent = `Balance: $${balance.toFixed(2)}`;
}

function updatePrices() {
  currentStock.forEach(seed => {
    const base = SEEDS.find(s => s.name === seed.name).basePrice;
    // Random fluctuation ±10%
    let change = (Math.random() * 2 - 1) * PRICE_VARIANCE * base;
    let newPrice = (prices[seed.name] || base) + change;

    // Apply weather/tsunami multiplier
    newPrice = Math.max(1, newPrice) * currentWeather.effectMultiplier;

    prices[seed.name] = newPrice;
  });
  renderStock();
}

function applyWeather() {
  const weatherTypes = [
    {name:"Clear", multiplier:1, description:"No special weather."},
    {name:"Sunny", multiplier:1.2, description:"Sunny weather! Prices increase 20%."},
    {name:"Rainy", multiplier:0.8, description:"Rainy weather, prices decrease 20%."},
    {name:"Windy", multiplier:1, description:"Windy weather, no effect."},
    {name:"Storm", multiplier:0.7, description:"Storm lowers prices by 30%."},
  ];
  currentWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
  weatherStatusEl.textContent = `Weather: ${currentWeather.name} - ${currentWeather.description}`;
  addEventLog(`Weather update: ${currentWeather.name} - ${currentWeather.description}`, "neutral");
}

function tryTsunami() {
  if(tsunamiActive) return;

  const chance = Math.random();
  if(chance < 0.1) { // 10% chance to happen every 30 mins
    tsunamiActive = true;
    tsunamiType = Math.random() < 0.15 ? "Golden" : "Chocolate"; // 15% golden, 85% chocolate
    const mult = tsunamiType === "Golden" ? 25 : 5;
    currentWeather.effectMultiplier = mult;
    weatherStatusEl.textContent = `Weather: ${tsunamiType} Tsunami! Prices multiplied by ${mult} for 5 minutes!`;
    addEventLog(`${tsunamiType} Tsunami has arrived! Prices multiplied by ${mult} for 5 minutes!`, "positive");

    tsunamiTimeout = setTimeout(() => {
      tsunamiActive = false;
      currentWeather.effectMultiplier = 1;
      applyWeather();
      addEventLog(`${tsunamiType} Tsunami has ended. Prices back to normal.`, "neutral");
      tsunamiType = null;
    }, TSUNAMI_DURATION);
  }
}

function updatePlotStatus() {
  if(!plantedSeed) {
    plotStatusEl.textContent = "Empty plot";
    plotStatusEl.style.cursor = "default";
    plantBtn.disabled = false;
    return;
  }
  const elapsed = Date.now() - plantTime;
  if(elapsed >= PLANT_GROW_TIME) {
    plotStatusEl.textContent = `Your ${plantedSeed} is ready to harvest! Click here to harvest.`;
    plotStatusEl.style.cursor = "pointer";
    plantBtn.disabled = true;
  } else {
    const mins = Math.floor((PLANT_GROW_TIME - elapsed) / 60000);
    const secs = Math.floor(((PLANT_GROW_TIME - elapsed) % 60000) / 1000);
    plotStatusEl.textContent = `Growing ${plantedSeed}... Time left: ${mins}:${secs.toString().padStart(2,"0")}`;
    plotStatusEl.style.cursor = "default";
    plantBtn.disabled = false;
  }
}

// --- Interaction handlers ---

let selectedSeedName = null;

buyBtn.addEventListener("click", () => {
  if(!selectedSeedName) return alert("Please select a seed to buy.");
  const seed = SEEDS.find(s => s.name === selectedSeedName);
  if(!seed) return;

  const price = prices[selectedSeedName];
  if(balance < price) {
    alert("You don't have enough money to buy this seed.");
    return;
  }
  balance -= price;
  inventory[selectedSeedName] = (inventory[selectedSeedName] || 0) + 1;
  updateBalance();
  renderInventory();
  addEventLog(`Bought 1 ${selectedSeedName} for $${price.toFixed(2)}`, "positive");
});

plantBtn.addEventListener("click", () => {
  if(plantedSeed) {
    alert("Your plot is currently occupied.");
    return;
  }
  if(!selectedSeedName) {
    alert("Select a seed to plant by clicking its name in inventory.");
    return;
  }
  if(!inventory[selectedSeedName] || inventory[selectedSeedName] < 1) {
    alert("You need at least 1 seed in your inventory to plant.");
    return;
  }
  // Plant seed
  inventory[selectedSeedName]--;
  if(inventory[selectedSeedName] === 0) delete inventory[selectedSeedName];
  plantedSeed = selectedSeedName;
  plantTime = Date.now();
  updatePlotStatus();
  renderInventory();
  addEventLog(`Planted a ${plantedSeed} seed in your garden plot.`, "neutral");
});

plotStatusEl.addEventListener("click", () => {
  if(!plantedSeed) return;
  const elapsed = Date.now() - plantTime;
  if(elapsed < PLANT_GROW_TIME) return;
  // Harvest
  inventory[plantedSeed] = (inventory[plantedSeed] || 0) + 1;
  addEventLog(`Harvested 1 ${plantedSeed}!`, "positive");
  plantedSeed = null;
  plantTime = null;
  updatePlotStatus();
  renderInventory();
});

// --- Initialization ---

function init() {
  // Set initial prices to base prices
  SEEDS.forEach(s => prices[s.name] = s.basePrice);
  // Generate stock initially
  currentStock = generateStock();
  renderStock();
  // Start with money to buy 5 carrots
  const carrotPrice = SEEDS.find(s => s.name === "Carrot").basePrice;
  balance = carrotPrice * 5;
  updateBalance();
  renderInventory();
  updatePlotStatus();
  applyWeather();

  // Refresh stock and prices every 5 minutes
  setInterval(() => {
    currentStock = generateStock();
    updatePrices();
  }, REFRESH_INTERVAL);

  // Update prices every minute (with weather effect)
  setInterval(() => {
    updatePrices();
  }, 60 * 1000);

  // Update plot status every second
  setInterval(() => {
    updatePlotStatus();
  }, 1000);

  // Weather update every 5 minutes (sync with stock refresh)
  setInterval(() => {
    if(!tsunamiActive) applyWeather();
  }, REFRESH_INTERVAL);

  // Tsunami check every 30 minutes
  setInterval(() => {
    tryTsunami();
  }, TSUNAMI_INTERVAL);
}

init();
