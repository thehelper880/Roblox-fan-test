// Seed catalog with rarity, base price, icon for rarity
const SEEDS = [
  {name: "Apple", rarity:"common", basePrice:7, icon:"●"},
  {name: "Banana", rarity:"common", basePrice:8, icon:"●"},
  {name: "Orange", rarity:"common", basePrice:9, icon:"●"},
  {name: "Lemon", rarity:"common", basePrice:6, icon:"●"},
  {name: "Pear", rarity:"common", basePrice:7, icon:"●"},
  {name: "Grape", rarity:"common", basePrice:10, icon:"●"},

  {name: "Cherry", rarity:"uncommon", basePrice:14, icon:"★"},
  {name: "Strawberry", rarity:"uncommon", basePrice:15, icon:"★"},
  {name: "Fig", rarity:"uncommon", basePrice:16, icon:"★"},
  {name: "Nectarine", rarity:"uncommon", basePrice:13, icon:"★"},
  {name: "Plum", rarity:"uncommon", basePrice:14, icon:"★"},

  {name: "Raspberry", rarity:"rare", basePrice:20, icon:"◆"},
  {name: "Mango", rarity:"rare", basePrice:22, icon:"◆"},
  {name: "Papaya", rarity:"rare", basePrice:23, icon:"◆"},
  {name: "Pineapple", rarity:"rare", basePrice:24, icon:"◆"},
  {name: "Watermelon", rarity:"rare", basePrice:21, icon:"◆"},

  {name: "Elderberry", rarity:"epic", basePrice:28, icon:"✦"},
  {name: "Dragonfruit", rarity:"epic", basePrice:30, icon:"✦"},
  {name: "Pomegranate", rarity:"epic", basePrice:29, icon:"✦"},

  {name: "Golden Apple", rarity:"legendary", basePrice:40, icon:"👑"},
  {name: "Mythical Fruit", rarity:"legendary", basePrice:45, icon:"👑"},
];

// Frequency weights by rarity for random selection (higher = more common)
const RARITY_WEIGHTS = {
  common: 50,
  uncommon: 25,
  rare: 15,
  epic: 7,
  legendary: 3
};

const STOCK_SIZE = 5; // Number of seeds in stock at one time
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const PRICE_VARIANCE = 0.1; // 10% price fluctuation per update
const PRICE_UPDATE_INTERVAL = 10 * 1000; // Update prices every 10 seconds
const EVENTS_INTERVAL = 30 * 1000; // Market event every 30 seconds

let balance = 1000;
let inventory = {};
let currentStock = [];
let prices = {};
let eventTimer;
let priceUpdateTimer;
let stockRefreshTimer;
let nextRefreshTime = Date.now() + REFRESH_INTERVAL;

const balanceEl = document.getElementById("balance");
const stockListEl = document.getElementById("stock-list");
const inventoryListEl = document.getElementById("inventory-list");
const buyBtn = document.getElementById("buy-btn");
const sellBtn = document.getElementById("sell-btn");
const buyQtyEl = document.getElementById("buy-qty");
const sellQtyEl = document.getElementById("sell-qty");
const timerEl = document.getElementById("timer");
const eventsListEl = document.getElementById("events-list");

// Utility: weighted random pick
function weightedRandomSeed() {
  const totalWeight = SEEDS.reduce((sum,s) => sum + RARITY_WEIGHTS[s.rarity], 0);
  let rnd = Math.random() * totalWeight;
  for (let seed of SEEDS) {
    rnd -= RARITY_WEIGHTS[seed.rarity];
    if (rnd <= 0) return seed;
  }
  return SEEDS[0]; // fallback
}

// Pick unique random seeds weighted by rarity to fill stock
function generateStock() {
  let stock = new Set();
  while(stock.size < STOCK_SIZE) {
    stock.add(weightedRandomSeed());
  }
  return Array.from(stock);
}

// Initialize prices based on basePrice
function initPrices(stock) {
  let p = {};
  stock.forEach(seed => {
    p[seed.name] = seed.basePrice;
  });
  return p;
}

// Update displayed balance
function updateBalance() {
  balanceEl.textContent = `Balance: $${balance.toFixed(2)}`;
}

// Render the stock market list
function renderStock() {
  stockListEl.innerHTML = "";
  currentStock.forEach(seed => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="seed-name ${seed.rarity}">
      <span class="seed-icon">${seed.icon}</span> ${seed.name}</span> 
      <span>$${prices[seed.name].toFixed(2)}</span>`;
    li.dataset.seedName = seed.name;
    stockListEl.appendChild(li);
  });
}

// Render player inventory
function renderInventory() {
  inventoryListEl.innerHTML = "";
  if (Object.keys(inventory).length === 0) {
    inventoryListEl.innerHTML = "<li>Empty</li>";
    return;
  }
  for (const [seedName, qty] of Object.entries(inventory)) {
    if(qty <= 0) continue;
    const li = document.createElement("li");
    li.textContent = `${seedName}: ${qty}`;
    inventoryListEl.appendChild(li);
  }
}

// Buy seeds
buyBtn.addEventListener("click", () => {
  const qty = parseInt(buyQtyEl.value);
  if(isNaN(qty) || qty < 1) return alert("Enter valid buy quantity.");
  const selectedLi = stockListEl.querySelector("li.selected");
  if (!selectedLi) return alert("Select a seed to buy by clicking its name.");
  const seedName = selectedLi.dataset.seedName;
  const price = prices[seedName];
  const cost = price * qty;
  if (cost > balance) return alert("Not enough balance.");
  balance -= cost;
  inventory[seedName] = (inventory[seedName] || 0) + qty;
  updateBalance();
  renderInventory();
});

// Sell seeds
sellBtn.addEventListener("click", () => {
  const qty = parseInt(sellQtyEl.value);
  if(isNaN(qty) || qty < 1) return alert("Enter valid sell quantity.");
  const selectedLi = stockListEl.querySelector("li.selected");
  if (!selectedLi) return alert("Select a seed to sell by clicking its name.");
  const seedName = selectedLi.dataset.seedName;
  if (!inventory[seedName] || inventory[seedName] < qty) return alert("Not enough seeds to sell.");
  const price = prices[seedName];
  const revenue = price * qty;
  balance += revenue;
  inventory[seedName] -= qty;
  if(inventory[seedName] <= 0) delete inventory[seedName];
  updateBalance();
  renderInventory();
});

// Select seed from stock list (for buy/sell)
stockListEl.addEventListener("click", (e) => {
  let li = e.target;
  while(li && li.tagName !== "LI") {
    li = li.parentElement;
  }
  if(!li) return;
  stockListEl.querySelectorAll("li").forEach(li => li.classList.remove("selected"));
  li.classList.add("selected");
});

// Price fluctuation logic
function updatePrices() {
  currentStock.forEach(seed => {
    const base = SEEDS.find(s => s.name === seed.name).basePrice;
    // Random fluctuation ±10%
    let change = (Math.random() * 2 - 1) * PRICE_VARIANCE * base;
    prices[seed.name] = Math.max(1, prices[seed.name] + change);
  });
  renderStock();
}

// Market events list
const MARKET_EVENTS = [
  {
    name: "Boom Time",
    effect: () => {
      currentStock.forEach(seed => {
        prices[seed.name] *= 1.2;
      });
      addEventLog("Market boom! Prices increased 20%.", "positive");
    }
  },
  {
    name: "Price Crash",
    effect: () => {
      currentStock.forEach(seed => {
        prices[seed.name] *= 0.7;
      });
      addEventLog("Market crash! Prices dropped 30%.", "negative");
    }
  },
  {
    name: "Rainfall",
    effect: () => {
      addEventLog("Rainfall event! Plants grow faster (no direct effect here).", "positive");
    }
  },
  {
    name: "Pests Infestation",
    effect: () => {
      currentStock.forEach(seed => {
        prices[seed.name] *= 0.85;
      });
      addEventLog("Pests damage plants! Prices down 15%.", "negative");
    }
  },
  {
    name: "Dividend Payout",
    effect: () => {
      let dividendTotal = 0;
      for (const seedName in inventory) {
        let dividend = prices[seedName] * inventory[seedName] * 0.05;
        dividendTotal += dividend;
      }
      balance += dividendTotal;
      updateBalance();
      addEventLog(`Dividend payout! You earned $${dividendTotal.toFixed(2)}.`, "positive");
    }
  }
];

// Add event to events log UI
function addEventLog(message, type="neutral") {
  const li = document.createElement("li");
  li.textContent = message;
  if(type === "positive") li.classList.add("positive");
  else if(type === "negative") li.classList.add("negative");
  eventsListEl.prepend(li);
  // Keep max 10 events
  if(eventsListEl.children.length > 10) {
    eventsListEl.removeChild(eventsListEl.lastChild);
  }
}

// Run a random market event
function runMarketEvent() {
  const event = MARKET_EVENTS[Math.floor(Math.random() * MARKET_EVENTS.length)];
  event.effect();
  renderStock();
}

// Refresh stock market seeds every 5 minutes
function refreshStock() {
  currentStock = generateStock();
  prices = initPrices(currentStock);
  renderStock();
  nextRefreshTime = Date.now() + REFRESH_INTERVAL;
  addEventLog("Stock market refreshed with new seeds.");
}

// Countdown timer for stock refresh
function updateTimer() {
  let remaining = nextRefreshTime - Date.now();
  if(remaining < 0) remaining = 0;
  let mins = Math.floor(remaining / 60000);
  let secs = Math.floor((remaining % 60000) / 1000);
  timerEl.textContent = `Next stock refresh in: ${mins}:${secs.toString().padStart(2,"0")}`;
}

// Initialization
function init() {
  refreshStock();
  updateBalance();
  renderInventory();

  // Update prices every 10 seconds with random fluctuation
  priceUpdateTimer = setInterval(() => {
    updatePrices();
  }, PRICE_UPDATE_INTERVAL);

  // Run market events every 30 seconds
  eventTimer = setInterval(() => {
    runMarketEvent();
  }, EVENTS_INTERVAL);

  // Refresh stock every 5 minutes
  stockRefreshTimer = setInterval(() => {
    refreshStock();
  }, REFRESH_INTERVAL);

  // Update countdown timer every second
  setInterval(() => {
    updateTimer();
  }, 1000);
}

init();
