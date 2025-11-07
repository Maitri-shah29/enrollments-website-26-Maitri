"use client";

import { useEffect, useRef, useState } from "react";

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  char: string;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function NotFound() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Game constants
    const PADDLE_SPEED = 8;
    const BALL_SPEED = 4;

    // Create "404" bricks
    const brickRows = 7;
    const brickCols = 15;
    const brickWidth = 50;
    const brickHeight = 20;
    const brickPadding = 5;
    const brickOffsetTop = 60;
    const brickOffsetLeft = 35;

    // Define "404" pattern (7 rows x 15 cols)
    const pattern404 = [
      "111 000 111 000",
      "1 0 0 0 1 0 0 0",
      "1 0 0 0 1 0 0 0",
      "111 000 111 000",
      "  1 0 0   1 0 0",
      "  1 0 0   1 0 0",
      "  1 000   1 000",
    ];

    const bricks: Brick[] = [];
    for (let row = 0; row < brickRows; row++) {
      for (let col = 0; col < brickCols; col++) {
        const char = pattern404[row]?.[col] || " ";
        if (char === "1" || char === "0") {
          bricks.push({
            x: col * (brickWidth + brickPadding) + brickOffsetLeft,
            y: row * (brickHeight + brickPadding) + brickOffsetTop,
            width: brickWidth,
            height: brickHeight,
            visible: true,
            char: char,
          });
        }
      }
    }

    // Paddle
    const paddle: Paddle = {
      x: canvas.width / 2 - 60,
      y: canvas.height - 30,
      width: 120,
      height: 15,
    };

    // Ball
    const ball: Ball = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      dx: BALL_SPEED,
      dy: -BALL_SPEED,
      radius: 8,
    };

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A") keysPressed.current.add("a");
      if (e.key === "d" || e.key === "D") keysPressed.current.add("d");
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "a" || e.key === "A") keysPressed.current.delete("a");
      if (e.key === "d" || e.key === "D") keysPressed.current.delete("d");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Draw functions
    const drawBricks = () => {
      bricks.forEach((brick) => {
        if (brick.visible) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        }
      });
    };

    const drawPaddle = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    };

    const drawBall = () => {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const _drawText = (text: string, y: number, size: number = 48) => {
      ctx.fillStyle = "#ffffff";
      ctx.font = `${size}px monospace`;
      ctx.textAlign = "center";
      ctx.fillText(text, canvas.width / 2, y);
    };

    // Collision detection
    const detectBrickCollision = () => {
      bricks.forEach((brick) => {
        if (
          brick.visible &&
          ball.x + ball.radius > brick.x &&
          ball.x - ball.radius < brick.x + brick.width &&
          ball.y + ball.radius > brick.y &&
          ball.y - ball.radius < brick.y + brick.height
        ) {
          ball.dy = -ball.dy;
          brick.visible = false;
        }
      });
    };

    // Update game state
    const update = () => {
      // Move paddle
      if (keysPressed.current.has("a")) {
        paddle.x = Math.max(0, paddle.x - PADDLE_SPEED);
      }
      if (keysPressed.current.has("d")) {
        paddle.x = Math.min(
          canvas.width - paddle.width,
          paddle.x + PADDLE_SPEED,
        );
      }

      // Move ball
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Ball collision with walls
      if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
      }
      if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
      }

      // Ball collision with paddle
      if (
        ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
      ) {
        ball.dy = -ball.dy;
        // Add some angle based on where it hits the paddle
        const hitPos = (ball.x - paddle.x) / paddle.width;
        ball.dx = (hitPos - 0.5) * BALL_SPEED * 2;
      }

      // Ball falls below paddle
      if (ball.y - ball.radius > canvas.height) {
        setGameOver(true);
        return false;
      }

      // Check brick collisions
      detectBrickCollision();

      // Check win condition
      if (bricks.every((brick) => !brick.visible)) {
        setGameWon(true);
        return false;
      }

      return true;
    };

    // Game loop
    let animationId: number;
    const gameLoop = () => {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawBricks();
      drawPaddle();
      drawBall();

      if (update()) {
        animationId = requestAnimationFrame(gameLoop);
      }
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleRestart = () => {
    setGameOver(false);
    setGameWon(false);
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] text-white">
      <div className="mb-6 text-center">
        <h1 className="text-6xl font-bold mb-2 font-mono">404</h1>
        <p className="text-xl text-gray-400 mb-4">Page Not Found</p>
        <p className="text-sm text-gray-500">
          Use <kbd className="px-2 py-1 bg-gray-800 rounded">A</kbd> and{" "}
          <kbd className="px-2 py-1 bg-gray-800 rounded">D</kbd> to control the
          paddle
        </p>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border-2 border-gray-700 rounded-lg shadow-2xl"
        />

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h2 className="text-5xl font-bold mb-4 font-mono">GAME OVER</h2>
            <button
              type="button"
              onClick={handleRestart}
              className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {gameWon && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg">
            <h2 className="text-5xl font-bold mb-4 font-mono">YOU WIN!</h2>
            <p className="text-xl mb-6">But the page is still not found...</p>
            <button
              type="button"
              onClick={handleRestart}
              className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <a
          href="/"
          className="px-6 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition inline-block"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
