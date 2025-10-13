const API_KEY = "67b4ab6804cf2a2f6303f89de582d871";
const BASE_URL = "https://api.openweathermap.org/data/2.5/weather";

// ====== DOM SELECTORS ======
const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const historyList = document.getElementById("history-list");
const clearBtn = document.getElementById("clear-history");
const toggleBtn = document.getElementById("toggle-theme");

// Weather data display elements
const cityNameEl = document.getElementById("city-name");
const descriptionEl = document.getElementById("description");
const tempEl = document.getElementById("temp");
const feelsLikeEl = document.getElementById("feels-like");
const humidityEl = document.getElementById("humidity");
const windEl = document.getElementById("wind");
const iconEl = document.getElementById("weather-icon");

// ====== UTILITIES ======
function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? "#e63946" : "#555";
}

function showResult() {
  resultEl.classList.remove("hidden");
}

function hideResult() {
  resultEl.classList.add("hidden");
}

// Local storage helpers
function loadHistory() {
  const raw = localStorage.getItem("weather-history");
  return raw ? JSON.parse(raw) : [];
}

function saveHistory(history) {
  localStorage.setItem("weather-history", JSON.stringify(history));
}

function addToHistory(city) {
  let h = loadHistory();
  // Prevent duplicates and keep newest first
  h = h.filter(x => x.toLowerCase() !== city.toLowerCase());
  h.unshift(city);
  if (h.length > 10) h = h.slice(0, 10);
  saveHistory(h);
  renderHistory();
}

function renderHistory() {
  const h = loadHistory();
  historyList.innerHTML = h.map(city => `<li data-city="${city}">${city}</li>`).join("");
}

clearBtn.addEventListener("click", () => {
  localStorage.removeItem("weather-history");
  renderHistory();
});

// ====== WEATHER FETCH FUNCTION ======
async function fetchWeather(city) {
  setStatus("Loading...");
  hideResult();
  addLoadingSpinner();

  try {
    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);

    if (!res.ok) {
      if (res.status === 404) throw new Error("City not found. Try again.");
      else throw new Error(`API Error: ${res.status}`);
    }

    const data = await res.json();
    displayWeather(data);
    addToHistory(city);
    setStatus(""); // Clear any old status
  } catch (err) {
    setStatus(err.message || "Something went wrong.", true);
  } finally {
    removeLoadingSpinner();
  }
}

// ====== DISPLAY WEATHER DATA ======
function displayWeather(data) {
  const name = `${data.name}, ${data.sys?.country || ""}`;
  const description = data.weather?.[0]?.description || "";
  const icon = data.weather?.[0]?.icon;
  const temp = data.main?.temp;
  const feels = data.main?.feels_like;
  const humidity = data.main?.humidity;
  const wind = data.wind?.speed;

  cityNameEl.textContent = name;
  descriptionEl.textContent = description;
  tempEl.textContent = Math.round(temp);
  feelsLikeEl.textContent = Math.round(feels);
  humidityEl.textContent = humidity;
  windEl.textContent = wind;

  if (icon) {
    iconEl.src = `https://openweathermap.org/img/wn/${icon}@2x.png`;
    iconEl.alt = description || "weather icon";
  }

  // Animate the result card
  showResult();
  const card = resultEl.querySelector(".weather-card");
  card.style.animation = "slideUp 0.5s ease";

  // Change background color based on condition
  updateBackground(description.toLowerCase());
}

// ====== DYNAMIC BACKGROUND CHANGER ======
function updateBackground(condition) {
  const body = document.body;

  let gradient;
  if (condition.includes("clear")) {
    gradient = "linear-gradient(135deg, #f8c291, #e77f67)";
  } else if (condition.includes("cloud")) {
    gradient = "linear-gradient(135deg, #dfe4ea, #ced6e0)";
  } else if (condition.includes("rain")) {
    gradient = "linear-gradient(135deg, #74b9ff, #0984e3)";
  } else if (condition.includes("storm") || condition.includes("thunder")) {
    gradient = "linear-gradient(135deg, #636e72, #2d3436)";
  } else if (condition.includes("snow")) {
    gradient = "linear-gradient(135deg, #f1f2f6, #dfe4ea)";
  } else if (condition.includes("mist") || condition.includes("fog")) {
    gradient = "linear-gradient(135deg, #a4b0be, #747d8c)";
  } else {
    gradient = "linear-gradient(135deg, #dfe6e9, #b2bec3)";
  }

  body.style.background = gradient;
  body.style.transition = "background 0.8s ease";
}

// ====== LOADING SPINNER ======
function addLoadingSpinner() {
  const spinner = document.createElement("div");
  spinner.className = "spinner";
  spinner.innerHTML = `<div></div><div></div><div></div><div></div>`;
  statusEl.appendChild(spinner);
}

function removeLoadingSpinner() {
  const spinner = document.querySelector(".spinner");
  if (spinner) spinner.remove();
}

// ====== EVENT LISTENERS ======
form.addEventListener("submit", ev => {
  ev.preventDefault();
  const city = input.value.trim();
  if (!city) {
    setStatus("Please enter a city name.", true);
    return;
  }
  fetchWeather(city);
  input.blur();
});

historyList.addEventListener("click", ev => {
  const li = ev.target.closest("li[data-city]");
  if (!li) return;
  const city = li.dataset.city;
  input.value = city;
  fetchWeather(city);
});

// ====== DARK MODE TOGGLE ======
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  toggleBtn.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("theme", isDark ? "dark" : "light");
});

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  toggleBtn.textContent = "☀️";
}

// ====== INIT ======
renderHistory();
setStatus("Search for any city to get started!");

