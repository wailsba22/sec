let FRUITS = [];
let lastResult = null;
let currentFruit = null;

async function init() {
  try {
    const response = await fetch('./fruits.json');
    if (!response.ok) throw new Error(`Failed to load fruits.json: ${response.status}`);
    FRUITS = await response.json();
    renderPage();
  } catch (error) {
    console.error(error);
  }
}

function renderPage() {
  const fruitKey = document.body.dataset.fruitKey;
  if (fruitKey) {
    renderFruitPage(fruitKey);
  } else {
    renderIndexPage();
  }
}

function renderIndexPage() {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;
  grid.innerHTML = '';

  FRUITS.forEach(fruit => {
    const card = document.createElement('a');
    card.href = fruit.page;
    card.className = `fruit-card catalog-card ${fruit.theme}`;
    card.innerHTML = `
      <div class="card-bg"></div>
      <img class="fruit-thumb" src="${fruit.image}" alt="${fruit.name}">
      <div class="card-content card-compact">
        <div class="card-title">${fruit.name}</div>
        <button class="card-cta">Get one now</button>
      </div>`;
    grid.appendChild(card);
  });
}

function renderFruitPage(key) {
  currentFruit = FRUITS.find(x => x.key === key);
  if (!currentFruit) return;

  const pageTitle = document.querySelector('.page-title');
  const pageSubtitle = document.querySelector('.page-subtitle');
  const fruitImage = document.getElementById('fruitImage');
  const stockInput = document.getElementById('stockInput');
  const generateBtn = document.getElementById('generateButton');
  const copyBtn = document.getElementById('copyButton');
  const fruitDetailName = document.getElementById('fruitDetailName');
  const fruitDetailCategory = document.getElementById('fruitDetailCategory');

  const statusLabel = document.getElementById('stockStatus');

  const fruitHeader = document.querySelector('.fruit-page-header');

  if (pageTitle) pageTitle.textContent = currentFruit.name;
  if (fruitImage) {
    fruitImage.src = currentFruit.image;
    fruitImage.alt = currentFruit.name;
  }
  if (fruitDetailName) fruitDetailName.textContent = currentFruit.name;
  if (fruitDetailCategory) fruitDetailCategory.textContent = currentFruit.category;
  if (generateBtn) {
    generateBtn.textContent = 'Get one now';
    generateBtn.addEventListener('click', generate);
    generateBtn.disabled = currentFruit.stock <= 0;
  }
  if (copyBtn) copyBtn.addEventListener('click', copyJSON);
  if (statusLabel) {
    statusLabel.textContent = currentFruit.stock <= 0 ? 'OUT OF STOCK' : 'AVAILABLE';
    statusLabel.className = `status-pill ${currentFruit.stock <= 0 ? 'status-out' : 'status-ok'}`;
  }
  if (fruitHeader) {
    fruitHeader.classList.toggle('out-stock', currentFruit.stock <= 0);
  }

  renderFruitResult(null);
}

function updateStock(key, val) {
  const fruit = FRUITS.find(x => x.key === key);
  if (!fruit) return;
  fruit.stock = parseInt(val, 10) || 0;
  const badge = document.getElementById('stockBadge');
  if (badge) {
    badge.className = `stock-badge ${fruit.stock > 0 ? 'ok' : 'out'}`;
    badge.textContent = fruit.stock > 0 ? 'In basket' : 'Empty basket';
  }
  if (document.body.dataset.fruitKey === key) {
    const generateBtn = document.getElementById('generateButton');
    if (generateBtn) {
      generateBtn.disabled = fruit.stock <= 0;
    }
    setPageNote();
    renderFruitResult(null);
  }
}

function updateStockBadge() {
  const badge = document.getElementById('stockBadge');
  if (!badge || !currentFruit) return;
  badge.className = `stock-badge ${currentFruit.stock > 0 ? 'ok' : 'out'}`;
  badge.textContent = currentFruit.stock > 0 ? 'In basket' : 'Empty basket';
}

function setPageNote() {
  const pageNote = document.getElementById('pageNote');
  if (!pageNote || !currentFruit) return;
  pageNote.textContent = currentFruit.stock > 0
    ? `Click Generate to pick a random ${currentFruit.name} variety.`
    : `This fruit is out of stock. Add more to the basket to generate a variety.`;
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generate() {
  if (!currentFruit) return;
  spawnConfetti();

  if (currentFruit.stock <= 0) {
    lastResult = { fruit: currentFruit, outOfStock: true };
    renderFruitResult(lastResult);
    renderJSON(lastResult);
    return;
  }

  const variety = pickRandom(currentFruit.varieties);
  lastResult = { fruit: currentFruit, variety, outOfStock: false };
  renderFruitResult(lastResult);
  renderJSON(lastResult);
  launchCardAnimation();
}

function renderFruitResult(result) {
  const container = document.getElementById('fruitResult');
  if (!container) return;
  container.innerHTML = '';
  container.style.display = 'none';
}

function renderJSON(result) {
  const section = document.getElementById('jsonSection');
  if (!section || !currentFruit) return;

  section.style.display = 'block';
  const data = result.outOfStock
    ? { name: currentFruit.name, pass: null }
    : { name: result.variety.name, pass: result.variety.pass };

  document.getElementById('jsonOut').innerHTML = syntaxHighlight(JSON.stringify(data, null, 2));
}

function syntaxHighlight(json) {
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, match => {
    if (/^"/.test(match)) {
      if (/:$/.test(match)) return `<span class="jk">${match}</span>`;
      return `<span class="js">${match}</span>`;
    }
    if (/true|false/.test(match)) return `<span class="jp">${match}</span>`;
    if (/null/.test(match)) return `<span class="jp">${match}</span>`;
    return `<span class="jn">${match}</span>`;
  });
}

function copyJSON() {
  if (!lastResult || !currentFruit) return;

  const text = JSON.stringify(
    lastResult.outOfStock
      ? { name: currentFruit.name, pass: null }
      : { name: lastResult.variety.name, pass: lastResult.variety.pass },
    null,
    2
  );

  navigator.clipboard.writeText(text);
  const btn = document.getElementById('copyButton');
  if (!btn) return;

  btn.textContent = '✅ Copied!';
  setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
}

const CONFETTI_COLORS = ['#ff4d6d', '#ff9f43', '#7bed9f', '#a29bfe', '#fff', '#fdcb6e'];

function spawnConfetti() {
  const container = document.getElementById('confetti');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 0; i < 50; i += 1) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = `${Math.random() * 100}vw`;
    p.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    p.style.width = `${6 + Math.random() * 8}px`;
    p.style.height = `${6 + Math.random() * 8}px`;
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    p.style.animationDuration = `${0.8 + Math.random() * 1.2}s`;
    p.style.animationDelay = `${Math.random() * 0.4}s`;
    container.appendChild(p);
  }

  setTimeout(() => { container.innerHTML = ''; }, 2500);
}

function launchCardAnimation() {
  const cards = document.querySelectorAll('.fruit-card');
  cards.forEach((c, i) => {
    c.style.animationName = 'none';
    c.offsetHeight;
    c.style.animationName = '';
    c.style.animationDelay = `${i * 0.1}s`;
  });
}

window.addEventListener('DOMContentLoaded', init);
