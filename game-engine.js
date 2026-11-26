export const ROWS = 20;
export const COLS = 10;

export const PIECES = [
  { name: "I", color: "#4de3ff", shape: [[1, 1, 1, 1]] },
  { name: "J", color: "#7192ff", shape: [[1, 0, 0], [1, 1, 1]] },
  { name: "L", color: "#ffae5d", shape: [[0, 0, 1], [1, 1, 1]] },
  { name: "O", color: "#ffe066", shape: [[1, 1], [1, 1]] },
  { name: "S", color: "#64e6a3", shape: [[0, 1, 1], [1, 1, 0]] },
  { name: "T", color: "#c78cff", shape: [[0, 1, 0], [1, 1, 1]] },
  { name: "Z", color: "#ff7189", shape: [[1, 1, 0], [0, 1, 1]] }
];

export function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function cloneShape(shape) {
  return shape.map((row) => [...row]);
}

export function rotateClockwise(shape) {
  return shape[0].map((_, column) => shape.map((row) => row[column]).reverse());
}

export function createPiece(template) {
  const shape = cloneShape(template.shape);
  return {
    name: template.name,
    color: template.color,
    shape,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0
  };
}

export function collides(board, piece, offsetX = 0, offsetY = 0, shape = piece.shape) {
  return shape.some((row, y) =>
    row.some((cell, x) => {
      if (!cell) return false;
      const boardX = piece.x + x + offsetX;
      const boardY = piece.y + y + offsetY;
      return boardX < 0 || boardX >= COLS || boardY >= ROWS || (boardY >= 0 && board[boardY][boardX]);
    })
  );
}

export function mergePiece(board, piece) {
  piece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell && piece.y + y >= 0) board[piece.y + y][piece.x + x] = piece.color;
    });
  });
}

export function clearCompletedLines(board) {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (board[y].every(Boolean)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(null));
      cleared += 1;
      y += 1;
    }
  }
  return cleared;
}

export function scoreForLines(lines, level) {
  const points = [0, 100, 300, 500, 800];
  return points[lines] * level;
}
