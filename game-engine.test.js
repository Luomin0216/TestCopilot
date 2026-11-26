import assert from "node:assert/strict";
import test from "node:test";
import {
  COLS,
  ROWS,
  clearCompletedLines,
  collides,
  createBoard,
  createPiece,
  PIECES,
  rotateClockwise,
  scoreForLines
} from "./game-engine.js";

test("creates a correctly sized empty board", () => {
  const board = createBoard();
  assert.equal(board.length, ROWS);
  assert.equal(board[0].length, COLS);
  assert.ok(board.flat().every((cell) => cell === null));
});

test("detects board edges and occupied cells", () => {
  const board = createBoard();
  const piece = createPiece(PIECES[3]);
  piece.x = 0;
  assert.equal(collides(board, piece, -1), true);
  board[piece.y][piece.x] = "#fff";
  assert.equal(collides(board, piece), true);
});

test("rotates matrices clockwise", () => {
  assert.deepEqual(rotateClockwise([[1, 0], [1, 1]]), [[1, 1], [1, 0]]);
});

test("clears complete lines and shifts the board down", () => {
  const board = createBoard();
  board[ROWS - 1].fill("#fff");
  board[ROWS - 2][0] = "#f00";
  assert.equal(clearCompletedLines(board), 1);
  assert.equal(board[ROWS - 1][0], "#f00");
  assert.ok(board[0].every((cell) => cell === null));
});

test("awards classic score values by level", () => {
  assert.equal(scoreForLines(1, 1), 100);
  assert.equal(scoreForLines(4, 3), 2400);
});
