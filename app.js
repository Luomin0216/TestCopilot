import {
  COLS,
  ROWS,
  PIECES,
  clearCompletedLines,
  collides,
  createBoard,
  createPiece,
  mergePiece,
  rotateClockwise,
  scoreForLines
} from "./game-engine.js";

const CELL = 30;
const PREVIEW_CELL = 24;
const boardCanvas = document.querySelector("#board");
const boardContext = boardCanvas.getContext("2d");
const nextCanvas = document.querySelector("#next-piece");
const nextContext = nextCanvas.getContext("2d");
const scoreElement = document.querySelector("#score");
const levelElement = document.querySelector("#level");
const linesElement = document.querySelector("#lines");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayMessage = document.querySelector("#overlay-message");
const startButton = document.querySelector("#start-button");
const restartButton = document.querySelector("#restart-button");

let board;
let current;
let next;
let score;
let lines;
let level;
let running = false;
let paused = false;
let lastDrop = 0;
let animationFrame;

function randomTemplate() {
  return PIECES[Math.floor(Math.random() * PIECES.length)];
}

function dropDelay() {
  return Math.max(100, 850 - (level - 1) * 70);
}

function updateStats() {
  scoreElement.textContent = score;
  levelElement.textContent = level;
  linesElement.textContent = lines;
}

function drawCell(context, x, y, color, size) {
  context.fillStyle = color;
  context.fillRect(x * size, y * size, size, size);
  context.fillStyle = "rgba(255,255,255,.2)";
  context.fillRect(x * size + 2, y * size + 2, size - 4, 3);
  context.strokeStyle = "rgba(5, 14, 35, .55)";
  context.lineWidth = 1;
  context.strokeRect(x * size + 0.5, y * size + 0.5, size - 1, size - 1);
}

function drawBoard() {
  boardContext.clearRect(0, 0, boardCanvas.width, boardCanvas.height);
  boardContext.fillStyle = "#0a1835";
  boardContext.fillRect(0, 0, boardCanvas.width, boardCanvas.height);
  boardContext.strokeStyle = "rgba(164, 196, 255, .09)";
  for (let x = 0; x <= COLS; x += 1) {
    boardContext.beginPath();
    boardContext.moveTo(x * CELL, 0);
    boardContext.lineTo(x * CELL, ROWS * CELL);
    boardContext.stroke();
  }
  for (let y = 0; y <= ROWS; y += 1) {
    boardContext.beginPath();
    boardContext.moveTo(0, y * CELL);
    boardContext.lineTo(COLS * CELL, y * CELL);
    boardContext.stroke();
  }
  board.forEach((row, y) => row.forEach((color, x) => color && drawCell(boardContext, x, y, color, CELL)));
  current.shape.forEach((row, y) =>
    row.forEach((cell, x) => cell && drawCell(boardContext, current.x + x, current.y + y, current.color, CELL))
  );
}

function drawNext() {
  nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const width = next.shape[0].length * PREVIEW_CELL;
  const height = next.shape.length * PREVIEW_CELL;
  const startX = (nextCanvas.width - width) / 2;
  const startY = (nextCanvas.height - height) / 2;
  next.shape.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (!cell) return;
      nextContext.save();
      nextContext.translate(startX, startY);
      drawCell(nextContext, x, y, next.color, PREVIEW_CELL);
      nextContext.restore();
    })
  );
}

function render() {
  drawBoard();
  drawNext();
  updateStats();
}

function showOverlay(title, message, buttonText) {
  overlayTitle.textContent = title;
  overlayMessage.textContent = message;
  startButton.textContent = buttonText;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function spawnPiece() {
  current = next;
  current.x = Math.floor((COLS - current.shape[0].length) / 2);
  current.y = 0;
  next = createPiece(randomTemplate());
  if (collides(board, current)) endGame();
}

function lockPiece() {
  mergePiece(board, current);
  const cleared = clearCompletedLines(board);
  if (cleared) {
    lines += cleared;
    score += scoreForLines(cleared, level);
    level = Math.floor(lines / 10) + 1;
  }
  spawnPiece();
  lastDrop = performance.now();
}

function move(dx) {
  if (!running || paused || collides(board, current, dx)) return;
  current.x += dx;
  render();
}

function softDrop() {
  if (!running || paused) return;
  let locked = false;
  if (!collides(board, current, 0, 1)) {
    current.y += 1;
  } else {
    lockPiece();
    locked = true;
  }
  render();
  return locked;
}

function hardDrop() {
  if (!running || paused) return;
  let distance = 0;
  while (!collides(board, current, 0, 1)) {
    current.y += 1;
    distance += 1;
  }
  score += distance * 2;
  lockPiece();
  render();
}

function rotate() {
  if (!running || paused) return;
  const rotated = rotateClockwise(current.shape);
  for (const kick of [0, -1, 1, -2, 2]) {
    if (!collides(board, current, kick, 0, rotated)) {
      current.shape = rotated;
      current.x += kick;
      render();
      return;
    }
  }
}

function endGame() {
  running = false;
  cancelAnimationFrame(animationFrame);
  render();
  showOverlay("游戏结束", `最终得分：${score}，已消除 ${lines} 行。`, "再玩一次");
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  if (paused) showOverlay("游戏暂停", "按 P 或点击继续游戏。", "继续游戏");
  else {
    hideOverlay();
    lastDrop = performance.now();
  }
}

function tick(timestamp) {
  if (!running) return;
  if (!paused && timestamp - lastDrop >= dropDelay()) {
    if (!softDrop()) lastDrop = timestamp;
  }
  animationFrame = requestAnimationFrame(tick);
}

function startGame() {
  cancelAnimationFrame(animationFrame);
  board = createBoard();
  score = 0;
  lines = 0;
  level = 1;
  next = createPiece(randomTemplate());
  spawnPiece();
  running = true;
  paused = false;
  lastDrop = performance.now();
  hideOverlay();
  render();
  animationFrame = requestAnimationFrame(tick);
}

function handleAction(action) {
  if (action === "left") move(-1);
  if (action === "right") move(1);
  if (action === "down") softDrop();
  if (action === "rotate") rotate();
  if (action === "drop") hardDrop();
}

document.addEventListener("keydown", (event) => {
  const actionByKey = {
    ArrowLeft: "left",
    ArrowRight: "right",
    ArrowDown: "down",
    ArrowUp: "rotate",
    " ": "drop"
  };
  if (event.key.toLowerCase() === "p") {
    event.preventDefault();
    togglePause();
    return;
  }
  const action = actionByKey[event.key];
  if (action) {
    event.preventDefault();
    handleAction(action);
  }
});

document.querySelector(".touch-controls").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (button) handleAction(button.dataset.action);
});

startButton.addEventListener("click", () => {
  if (paused) togglePause();
  else startGame();
});
restartButton.addEventListener("click", startGame);

board = createBoard();
current = createPiece(PIECES[0]);
next = createPiece(PIECES[1]);
render();
