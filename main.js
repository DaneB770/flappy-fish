// Flappy Fish Game main.js

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const gameOverScreen = document.getElementById('game-over-screen');
const retryButton = document.getElementById('retry-button');
const muteButton = document.getElementById('mute-button');
const scoreDisplay = document.getElementById('score');
const finalScoreDisplay = document.getElementById('final-score');
const offlineWarning = document.getElementById('offline-warning');
const installButton = document.getElementById('install-button');

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

let fishImg = new Image();
fishImg.src = 'images/fish.png';

let obstacleImg = new Image();
obstacleImg.src = 'images/obstacle.png';

let bgImg = new Image();
bgImg.src = 'images/bg.jpg';

let bgMusic = new Audio('sounds/bgmusic.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.3;

let tapSound = new Audio('sounds/tap.wav');
tapSound.volume = 0.3;
let collisionSound = new Audio('sounds/collision.mp3');
collisionSound.volume = 0.3;
let gameOverSound = new Audio('sounds/game-over.wav');
gameOverSound.volume = 0.3;
let scoreSound = new Audio('sounds/score.mp3');
scoreSound.volume = 0.3;

let fish = {
  x: 80,
  y: CANVAS_HEIGHT / 2,
  width: 50,
  height: 40,
  gravity: 0.5,
  lift: -8,
  velocity: 0,
  rotation: 0
};

let obstacles = [];
let obstacleWidth = 60;
let obstacleGap = 180;
let obstacleSpeed = 2.5;
let frameCount = 0;
let score = 0;
let highScore = 0;
let gameRunning = false;
let muted = false;
let deferredPrompt = null;

// Hide install button by default
if (installButton) installButton.style.display = 'none';

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installButton) installButton.style.display = 'block';
});

if (installButton) {
  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      deferredPrompt = null;
      installButton.style.display = 'none';
    }
  });
}

// Functions

// Initialize highScore from localStorage
if (localStorage.getItem('flappyFishHighScore')) {
  highScore = parseInt(localStorage.getItem('flappyFishHighScore'), 10);
}

function resetGame() {
  fish.y = CANVAS_HEIGHT / 2;
  fish.velocity = 0;
  obstacles = [];
  score = 0;
  frameCount = 0;
  gameRunning = true;
  scoreDisplay.textContent = score;
  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  offlineWarning.style.display = navigator.onLine ? 'none' : 'block';
  if (!muted) {
    bgMusic.play();
  }
}

function drawBackground() {
  ctx.drawImage(bgImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function drawFish() {
  ctx.save();
  ctx.translate(fish.x + fish.width / 2, fish.y + fish.height / 2);
  ctx.rotate(fish.rotation);
  ctx.drawImage(fishImg, -fish.width / 2, -fish.height / 2, fish.width, fish.height);
  ctx.restore();
}

function drawObstacles() {
  obstacles.forEach(obs => {
    ctx.drawImage(obstacleImg, obs.x, obs.y, obstacleWidth, obs.height);
    ctx.drawImage(obstacleImg, obs.x, obs.y + obs.height + obstacleGap, obstacleWidth, CANVAS_HEIGHT - obs.height - obstacleGap);
  });
}

function updateFish() {
  fish.velocity += fish.gravity;
  fish.y += fish.velocity;

  // Rotate fish based on velocity
  fish.rotation = Math.min(Math.max(fish.velocity / 10, -0.5), 0.5);

  // Prevent fish from going off screen vertically
  if (fish.y + fish.height > CANVAS_HEIGHT) {
    fish.y = CANVAS_HEIGHT - fish.height;
    fish.velocity = 0;
  }
  if (fish.y < 0) {
    fish.y = 0;
    fish.velocity = 0;
  }
}

function updateObstacles() {
  if (frameCount % 110 === 0) {
    let height = Math.floor(Math.random() * (CANVAS_HEIGHT - obstacleGap - 100)) + 50;
    obstacles.push({ x: CANVAS_WIDTH, y: 0, height: height });
  }
  obstacles.forEach(obs => {
    obs.x -= obstacleSpeed;
  });
  // Remove off-screen obstacles
  obstacles = obstacles.filter(obs => obs.x + obstacleWidth > 0);
}

function checkCollision() {
  for (let obs of obstacles) {
    // Check collision with top obstacle
    if (
      fish.x + fish.width > obs.x &&
      fish.x < obs.x + obstacleWidth &&
      fish.y < obs.height
    ) {
      return true;
    }
    // Check collision with bottom obstacle
    if (
      fish.x + fish.width > obs.x &&
      fish.x < obs.x + obstacleWidth &&
      fish.y + fish.height > obs.height + obstacleGap
    ) {
      return true;
    }
  }
  return false;
}

function updateScore() {
  obstacles.forEach(obs => {
    if (!obs.passed && obs.x + obstacleWidth < fish.x) {
      score++;
      obs.passed = true;
      if (!muted) scoreSound.play();
      scoreDisplay.textContent = score;
    }
  });
}

function gameOver() {
  gameRunning = false;
  bgMusic.pause();
  if (!muted) {
    gameOverSound.play();
  }
  finalScoreDisplay.textContent = score;

  // Update highScore if current score is higher
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('flappyFishHighScore', highScore);
  }
  document.getElementById('high-score').textContent = highScore;

  gameOverScreen.style.display = 'flex';
}

function toggleMute() {
  muted = !muted;
  if (muted) {
    bgMusic.pause();
    muteButton.textContent = '🔇';
  } else {
    if (gameRunning) bgMusic.play();
    muteButton.textContent = '🔊';
  }
}

function handleInput() {
  if (!gameRunning) return;
  fish.velocity = fish.lift;
  if (!muted) tapSound.play();
}

function draw() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawBackground();
  drawFish();
  drawObstacles();
}

function update() {
  if (!gameRunning) return;
  updateFish();
  updateObstacles();
  if (checkCollision()) {
    gameOver();
  }
  updateScore();
  frameCount++;
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

// Event Listeners

startButton.addEventListener('click', () => {
  resetGame();
});

retryButton.addEventListener('click', () => {
  resetGame();
});

muteButton.addEventListener('click', () => {
  toggleMute();
});

window.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    handleInput();
  }
});

canvas.addEventListener('click', () => {
  handleInput();
});

// Offline detection
window.addEventListener('online', () => {
  offlineWarning.style.display = 'none';
});
window.addEventListener('offline', () => {
  offlineWarning.style.display = 'block';
});

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.log('Service Worker registration failed', err));
  });
}

// Start game loop
gameLoop();
