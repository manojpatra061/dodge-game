// ---Configuration---
const COL = 4;
const ROW = 6;
const CELL = 50; // cell size in px
const SPEED_OPTIONS = { normal: 500, slow: 800, fast: 250, ultraFast: 100 };

// ---Stats---
let SCORE: number;

// ---Setup---
const gridCellSize = { width: CELL - 10, height: CELL - 10 };
let playerPosition: {
  row: number;
  col: number;
};
let obstaclePosition: {
  row: number;
  col: number;
};

// ---Game state---
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
let isGameRunning = false;
let selectedSpeed = SPEED_OPTIONS.ultraFast;

// ---Board size---
canvas.width = COL * CELL;
canvas.height = ROW * CELL;

// ---DOM Elements---
const scoreEle = document.getElementById("score") as HTMLSpanElement;
const resultEle = document.getElementById("result") as HTMLDivElement;
const playBtn = document.getElementById("playBtn") as HTMLButtonElement;
const speedEle = document.getElementById("speed") as HTMLDivElement;

// ---Functions---
function resetGame() {
  playerPosition = { row: ROW, col: 3 };
  obstaclePosition = { row: 0, col: playerPosition.col };
  SCORE = 0;
}

function drawGrid() {
  // vertical lines
  for (let x = 0; x <= COL; x++) {
    ctx.strokeStyle = "black";
    ctx.beginPath();
    ctx.moveTo(x * CELL, 0);
    ctx.lineTo(x * CELL, canvas.height);
    ctx.stroke();
  }
  // horizonatal lines
  for (let y = 0; y <= ROW; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * CELL);
    ctx.lineTo(canvas.width, y * CELL);
    ctx.stroke();
  }
}

function movePlayerLR(dir: "LEFT" | "RIGHT") {
  clearPlayer();
  const deltaCol = dir === "RIGHT" ? 1 : dir === "LEFT" ? -1 : 0;
  playerPosition =
    getNewPosition(playerPosition.row, playerPosition.col + deltaCol) ||
    playerPosition;
  drawPlayer();
}

function fallObstacle() {
  // fall from row 1 to last row
  const { row, col } = obstaclePosition;
  clearObstacle();
  if (row === ROW) {
    if (checkCollision()) {
      gameOver();
      showScore();
      return;
    } else {
      SCORE += 10;
      showScore();
    }
  }
  obstaclePosition = getNewPosition(row + 1, col) || {
    row: 1,
    col: playerPosition.col,
  };
  drawObstacle();
}

function gameOver(gameId: number = gameLoopId) {
  window.clearInterval(gameId);
  showScoreResultOnScreen();
  resetGame();
  isGameRunning = false;
  playBtn.textContent = "Start";
}

function gameLoopFn(speed: number = selectedSpeed): number {
  if (isGameRunning) {
    playBtn.textContent = "Pause/Resume";
    return window.setInterval(() => {
      fallObstacle();
    }, speed);
  } else {
    return 0;
  }
}

function pauseResumeGame(isRunning: boolean) {
  if (isRunning === false) {
    window.clearInterval(gameLoopId);
  } else {
    gameLoopId = gameLoopFn(selectedSpeed);
    drawPlayer();
    showScoreResultOnScreen(false);
  }
}

function showScore(score: number = SCORE) {
  scoreEle.textContent = score.toString();
}

function showScoreResultOnScreen(show: boolean = true, score: number = SCORE) {
  resultEle.innerHTML = show
    ? `<div class="relative bg-secondry text-accent p-4 top-1 left-1 rounded-sm">
      <p>You scored = ${score}</p>
      <p>Press space to restart the game.</p>
    </div>`
    : "";
}

function showSpeedOptions(speedOptions = SPEED_OPTIONS) {
  speedEle.innerHTML = "<h2>Speed</h2>";
  type KeyType = keyof typeof speedOptions;
  for (const key in speedOptions) {
    const keyValue = speedOptions[key as KeyType];
    const activeStyle = keyValue === selectedSpeed ? "bg-red-400" : "";
    const speedButton = document.createElement("button");
    speedButton.textContent = key;
    speedButton.className = `${activeStyle} text-sm bg-accent px-2 rounded-sm w-24 text-center hover:cursor-pointer hover:underline ring`;
    speedButton.addEventListener("click", () => {
      setSelectedSpeed(keyValue);
    });
    speedEle.appendChild(speedButton);
  }
}

function setSelectedSpeed(speed: number) {
  selectedSpeed = speed;
  showSpeedOptions();
}

function start() {
  drawGrid();
  resetGame();
  showScore();
  showSpeedOptions();
}

// ---Helper functions---

function clearPlayer() {
  const { x, y } = get_X_Y_from_ROW_COL(playerPosition.row, playerPosition.col);
  const { width, height } = gridCellSize;
  ctx.clearRect(x, y, width, height);
}

function drawPlayer() {
  const { x, y } = get_X_Y_from_ROW_COL(playerPosition.row, playerPosition.col);
  const { width, height } = gridCellSize;
  ctx.fillStyle = "black";
  ctx.fillRect(x, y, width, height);
}

function clearObstacle(
  row: number = obstaclePosition.row,
  col: number = obstaclePosition.col
) {
  const { x, y } = get_X_Y_from_ROW_COL(row, col);
  const { width, height } = gridCellSize;
  ctx.clearRect(x, y, width, height);
}

function drawObstacle(
  row: number = obstaclePosition.row,
  col: number = obstaclePosition.col
) {
  const { x, y } = get_X_Y_from_ROW_COL(row, col);
  const { width, height } = gridCellSize;
  ctx.fillStyle = "black";
  ctx.fillRect(x, y, width, height);
}

function listenLR(e: KeyboardEvent) {
  e.preventDefault();
  const direction: Record<string, "LEFT" | "RIGHT"> = {
    ArrowLeft: "LEFT",
    ArrowRight: "RIGHT",
  };
  if (e.key) {
    movePlayerLR(direction[e.key]);
  }
}

function listenSpace(e: KeyboardEvent) {
  e.preventDefault();
  if (e.key === " ") {
    isGameRunning = !isGameRunning;
    pauseResumeGame(isGameRunning);
  }
}

function listenClickOnPlayBtn(e: MouseEvent) {
  e.preventDefault();
  isGameRunning = !isGameRunning;
  pauseResumeGame(isGameRunning);
}

function getNewPosition(row: number, col: number) {
  // prevent going outside the canvas
  if (row >= 1 && row <= ROW && col >= 1 && col <= COL) {
    return { row, col };
  }
}

function get_X_Y_from_ROW_COL(row: number, col: number, cell: number = CELL) {
  // 1 based indexing
  row -= 1;
  col -= 1;
  const x = col * cell + 5;
  const y = row * cell + 5;
  return { x, y };
}

function checkCollision() {
  return (
    obstaclePosition.col === playerPosition.col &&
    obstaclePosition.row === playerPosition.row
  );
}

// ---Events---
document.addEventListener("keydown", (e) => {
  if (isGameRunning) {
    listenLR(e);
  }
});
document.addEventListener("keydown", listenSpace);
playBtn.addEventListener("click", listenClickOnPlayBtn);

// ---Game loop---
let gameLoopId = gameLoopFn(selectedSpeed);

// ---Start---
start();

// ---Testing here---
