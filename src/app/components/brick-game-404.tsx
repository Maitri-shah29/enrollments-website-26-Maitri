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

interface BrickGame404Props {
  onExit?: () => void;
}

export default function BrickGame404({ onExit }: BrickGame404Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 700;

    const PADDLE_SPEED = 8;
    const BALL_SPEED = 4;

    const brickWidth = 35;
    const brickHeight = 35;
    const brickPadding = 4;
    const brickOffsetTop = 50;
    const brickOffsetLeft = 200;

    const pattern404 = [
      "1   1  000  1   1",
      "1   1 0   0 1   1",
      "1   1 0   0 1   1",
      "1   1 0   0 1   1",
      "11111 0   0 11111",
      "    1 0   0     1",
      "    1 0   0     1",
      "    1 0   0     1",
      "    1  000      1",
    ];

    const bricks: Brick[] = [];
    for (let row = 0; row < pattern404.length; row++) {
      for (let col = 0; col < pattern404[row].length; col++) {
        const char = pattern404[row][col];
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

    const paddle: Paddle = {
      x: canvas.width / 2 - 60,
      y: canvas.height - 30,
      width: 120,
      height: 15,
    };

    const ball: Ball = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      dx: BALL_SPEED,
      dy: -BALL_SPEED,
      radius: 8,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        keysPressed.current.add("left");
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        keysPressed.current.add("right");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        keysPressed.current.delete("left");
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        keysPressed.current.delete("right");
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);

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

    const update = () => {
      if (keysPressed.current.has("left")) {
        paddle.x = Math.max(0, paddle.x - PADDLE_SPEED);
      }
      if (keysPressed.current.has("right")) {
        paddle.x = Math.min(
          canvas.width - paddle.width,
          paddle.x + PADDLE_SPEED,
        );
      }

      ball.x += ball.dx;
      ball.y += ball.dy;

      if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.dx = -ball.dx;
      }
      if (ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
      }

      if (
        ball.y + ball.radius > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
      ) {
        ball.dy = -ball.dy;
        const hitPos = (ball.x - paddle.x) / paddle.width;
        ball.dx = (hitPos - 0.5) * BALL_SPEED * 2;
      }

      if (ball.y - ball.radius > canvas.height) {
        setGameOver(true);
        return false;
      }

      detectBrickCollision();

      if (bricks.every((brick) => !brick.visible)) {
        setGameWon(true);
        return false;
      }

      return true;
    };

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

    void gameKey;

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [gameKey]);

  const handleRestart = () => {
    setGameOver(false);
    setGameWon(false);
    setGameKey((prev) => prev + 1);
  };

  const handleExit = () => {
    if (onExit) {
      onExit();
    }
  };

  return (
    <div className="flex items-center justify-between h-full w-full bg-[#1a1a1a] text-white overflow-hidden pl-16 pr-16">
      <div className="text-left space-y-4 max-w-md flex-shrink-0">
        <h1 className="text-7xl font-black mb-3 font-mono text-white">404</h1>
        <p className="text-2xl font-semibold text-white">
          Oops! Page Not Found
        </p>
        <p className="text-sm text-gray-400">
          The page you're looking for doesn't exist. But hey, break some bricks
          while you're here!
        </p>
        <div className="flex items-center gap-3 pt-2">
          <kbd className="px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-sm font-mono text-white">
            ←
          </kbd>
          <span className="text-gray-400 text-sm">and</span>
          <kbd className="px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-sm font-mono text-white">
            →
          </kbd>
          <span className="text-gray-400 text-sm">to move</span>
        </div>
      </div>

      <div className="relative flex-shrink-0">
        <canvas
          ref={canvasRef}
          className="border-2 border-gray-700 rounded-lg"
        />

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a]/95 rounded-lg backdrop-blur-sm border border-gray-700">
            <div className="text-center space-y-6">
              <h2 className="text-6xl font-black font-mono text-white">
                GAME OVER
              </h2>
              <p className="text-gray-400 text-lg">
                The ball escaped! Try again?
              </p>
              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-8 py-3 bg-white text-[#1a1a1a] font-bold rounded-lg hover:bg-gray-200 transition-all"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={handleExit}
                  className="px-8 py-3 bg-[#2a2a2a] text-white font-semibold rounded-lg hover:bg-[#3a3a3a] transition-all border border-gray-700"
                >
                  Exit to Browser
                </button>
              </div>
            </div>
          </div>
        )}

        {gameWon && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a]/95 rounded-lg backdrop-blur-sm border border-gray-700">
            <div className="text-center space-y-6">
              <h2 className="text-6xl font-black font-mono text-white">
                YOU WIN!
              </h2>
              <p className="text-gray-400 text-lg max-w-sm">
                Congratulations! You broke all the bricks!
                <br />
                <span className="text-sm text-gray-500">
                  (But the page is still not found...)
                </span>
              </p>
              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleRestart}
                  className="px-8 py-3 bg-white text-[#1a1a1a] font-bold rounded-lg hover:bg-gray-200 transition-all"
                >
                  Play Again
                </button>
                <button
                  type="button"
                  onClick={handleExit}
                  className="px-8 py-3 bg-[#2a2a2a] text-white font-semibold rounded-lg hover:bg-[#3a3a3a] transition-all border border-gray-700"
                >
                  Exit to Browser
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
