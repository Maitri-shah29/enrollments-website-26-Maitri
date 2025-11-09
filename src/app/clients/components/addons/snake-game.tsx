"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GRID_SIZE = 19;
const CELL_SIZE = 8;
const GAME_WIDTH = GRID_SIZE * CELL_SIZE;
const GAME_HEIGHT = GRID_SIZE * CELL_SIZE - 50;
const GRID_SIZE_Y = Math.floor(GAME_HEIGHT / CELL_SIZE);
const INITIAL_SNAKE = [{ x: 6, y: 6 }];
const INITIAL_DIRECTION = { x: 1, y: 0 };
const GAME_SPEED = 150;

type Position = { x: number; y: number };

export function NokiaSnakeGame() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Position>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Position>({ x: 3, y: 3 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const directionRef = useRef(direction);
  const ignoreEnterUntilRef = useRef<number>(0);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const startGame = useCallback(() => {
    setIsStarted(true);
  }, []);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE_Y),
      };
    } while (
      currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y,
      )
    );
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setFood(generateFood(INITIAL_SNAKE));
    setIsGameOver(false);
    setScore(0);
    setIsPaused(false);
  }, [generateFood]);

  const showStartScreen = useCallback(() => {
    setIsStarted(false);
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    showStartScreen();
    ignoreEnterUntilRef.current = Date.now() + 300;
  }, [showStartScreen]);

  useEffect(() => {
    const handleSnakeOpen = () => {
      showStartScreen();
      ignoreEnterUntilRef.current = Date.now() + 300;
    };
    window.addEventListener("snake:open", handleSnakeOpen as EventListener);
    return () => {
      window.removeEventListener(
        "snake:open",
        handleSnakeOpen as EventListener,
      );
    };
  }, [showStartScreen]);

  const changeDirection = useCallback((newDirection: Position) => {
    const currentDir = directionRef.current;

    if (
      (newDirection.x === -currentDir.x && currentDir.x !== 0) ||
      (newDirection.y === -currentDir.y && currentDir.y !== 0)
    ) {
      return;
    }

    setDirection(newDirection);
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isStarted && e.key === "Enter") {
        const now = Date.now();
        if (now < ignoreEnterUntilRef.current) {
          e.preventDefault();
          ignoreEnterUntilRef.current = 0;
          return;
        }
      }

      if (!isStarted) {
        if (e.key === "Enter") {
          startGame();
        }
        return;
      }

      if (isGameOver && e.key === "Enter") {
        resetGame();
        startGame();
        return;
      }

      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
        return;
      }

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          changeDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
        case "s":
        case "S":
          changeDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          changeDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
        case "d":
        case "D":
          changeDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isGameOver, isStarted, startGame, resetGame, changeDirection]);

  useEffect(() => {
    if (isGameOver || isPaused || !isStarted) return;

    const gameLoop = setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y,
        };

        if (
          prevSnake.some(
            (segment) => segment.x === newHead.x && segment.y === newHead.y,
          ) ||
          newHead.x >= GRID_SIZE ||
          newHead.x < 0 ||
          newHead.y > GRID_SIZE_Y ||
          newHead.y < 0
        ) {
          setIsGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((prev) => prev + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, GAME_SPEED);

    return () => clearInterval(gameLoop);
  }, [isGameOver, isPaused, food, isStarted, generateFood]);

  return (
    <div className=" flex flex-col h-full items-center justify-center select-none relative bg-[url('/images/acm-bg1.svg')] bg-top bg-[length:400px] bg-repeat bg-purple">
      <svg
        width="280"
        height="560"
        viewBox="0 0 240 480"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Nokia Snake Game"
        className="drop-shadow-2xl transition-transform  max-h-[80%] mt-4"
      >
        <title>Nokia Snake Game</title>
        <defs>
          <linearGradient
            id="phoneGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#3b3b3bff" stopOpacity="1" />
            <stop offset="50%" stopColor="#484848ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#484848ff" stopOpacity="1" />
          </linearGradient>

          <linearGradient id="screenGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop
              offset="0%"
              style={{ stopColor: "#d8e9aa", stopOpacity: 1 }}
            />
            <stop
              offset="100%"
              style={{ stopColor: "#b8c98a", stopOpacity: 1 }}
            />
          </linearGradient>

          <filter id="innerShadow">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="2" />
            <feComposite
              in2="SourceAlpha"
              operator="arithmetic"
              k2="-1"
              k3="1"
            />
            <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0" />
          </filter>
        </defs>

        <path
          d="M 30 0 L 210 0 Q 240 0 240 30 L 240 450 Q 240 480 210 480 L 30 480 Q 0 480 0 450 L 0 30 Q 0 0 30 0 Z"
          fill="url(#phoneGradient)"
          stroke="#3a4a6a"
          strokeWidth="2"
        />

        <path
          d="M 30 5 L 210 5 Q 235 5 235 30 L 235 60"
          fill="none"
          stroke="#aabbd8"
          strokeWidth="2"
          opacity="0.7"
        />
        <path
          d="M 5 30 Q 5 5 30 5 L 60 5"
          fill="none"
          stroke="#aabbd8"
          strokeWidth="2"
          opacity="0.7"
        />

        <circle cx="100" cy="22" r="1.5" fill="#3a4a6a" opacity="0.7" />
        <circle cx="108" cy="22" r="1.5" fill="#3a4a6a" opacity="0.7" />
        <circle cx="116" cy="22" r="1.5" fill="#3a4a6a" opacity="0.7" />
        <circle cx="124" cy="22" r="1.5" fill="#3a4a6a" opacity="0.7" />
        <circle cx="132" cy="22" r="1.5" fill="#3a4a6a" opacity="0.7" />
        <circle cx="140" cy="22" r="1.5" fill="#3a4a6a" opacity="0.7" />

        <text
          x="120"
          y="50"
          fontSize="12"
          fill="#e8f0ff"
          textAnchor="middle"
          fontFamily="Arial, sans-serif"
          fontWeight="bold"
          letterSpacing="3"
        >
          ACM
        </text>

        <rect x="25" y="65" width="190" height="130" rx="15" fill="#2a3a5a" />

        <rect
          x="30"
          y="70"
          width="180"
          height="120"
          rx="12"
          fill="url(#screenGlow)"
        />

        <rect
          x="30"
          y="70"
          width="180"
          height="120"
          rx="12"
          fill="none"
          stroke="#a8b97a"
          strokeWidth="1"
          opacity="0.6"
        />

        <rect
          x={40}
          y={80}
          width={GAME_WIDTH + 4}
          height={GAME_HEIGHT + 4}
          fill="#b8c98a"
          rx="2"
        />

        <rect
          x={42}
          y={82}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          fill="#d8e9aa"
        />

        {(isStarted || isGameOver) &&
          snake.map((segment) => {
            const isHead = snake[0].x === segment.x && snake[0].y === segment.y;
            return (
              <rect
                key={`${segment.x}-${segment.y}`}
                x={42 + segment.x * CELL_SIZE}
                y={82 + segment.y * CELL_SIZE}
                width={CELL_SIZE}
                height={CELL_SIZE}
                fill={isHead ? "#1a2a1a" : "#2a3a2a"}
                rx="1"
                opacity={isHead ? 1 : 0.9}
              />
            );
          })}

        {isStarted && !isGameOver && (
          <rect
            x={42 + food.x * CELL_SIZE}
            y={82 + food.y * CELL_SIZE}
            width={CELL_SIZE}
            height={CELL_SIZE}
            fill="#4a5a3a"
            rx="1"
          />
        )}

        {(isStarted || isGameOver) && (
          <text
            x="95"
            y="76"
            fontSize="7"
            fill="#1a2a1a"
            fontFamily="monospace"
            fontWeight="bold"
          ></text>
        )}

        {isGameOver && (
          <>
            <text
              x="120"
              y="135"
              fontSize="12"
              fill="#1a2a1a"
              textAnchor="middle"
              fontFamily="monospace"
              fontWeight="bold"
            >
              GAME OVER
            </text>
            <text
              x="120"
              y="150"
              fontSize="8"
              fill="#3a4a3a"
              textAnchor="middle"
              fontFamily="monospace"
            >
              Press ENTER
            </text>
            <text
              x="120"
              y="162"
              fontSize="7"
              fill="#4a5a4a"
              textAnchor="middle"
              fontFamily="monospace"
            >
              Final Score: {score}
            </text>
          </>
        )}

        {!isStarted && !isGameOver && (
          <>
            <text
              x="120"
              y="128"
              fontSize="12"
              fill="#1a2a1a"
              textAnchor="middle"
              fontFamily="monospace"
              fontWeight="bold"
            >
              START GAME
            </text>
            <text
              x="120"
              y="145"
              fontSize="8"
              fill="#3a4a3a"
              textAnchor="middle"
              fontFamily="monospace"
            >
              Press ENTER
            </text>
            <text
              x="120"
              y="158"
              fontSize="6"
              fill="#4a5a4a"
              textAnchor="middle"
              fontFamily="monospace"
            >
              Use Arrow Keys / WASD
            </text>
          </>
        )}

        {isPaused && !isGameOver && (
          <text
            x="120"
            y="140"
            fontSize="12"
            fill="#2a3a2a"
            textAnchor="middle"
            fontFamily="monospace"
            fontWeight="bold"
          >
            PAUSED
          </text>
        )}

        <ellipse
          cx="120"
          cy="250"
          rx="55"
          ry="50"
          fill="#4a5a7a"
          opacity="0.6"
        />
        <ellipse cx="120" cy="250" rx="50" ry="45" fill="#7a8aaa" />

        {/* Center Navigation Button */}
        <circle cx="120" cy="250" r="20" fill="#3a4a6a" />
        <circle cx="120" cy="250" r="17" fill="#6a7a9a" />
        {/* Overlay a semantic HTML button via foreignObject */}
        <foreignObject x={103} y={233} width={34} height={34}>
          <button
            type="button"
            aria-label="Start game"
            className="w-full h-full bg-transparent outline-none"
            onClick={() => {
              if (!isStarted) startGame();
            }}
          />
        </foreignObject>
        <text x="120" y="254" fontSize="10" fill="#e8f0ff" textAnchor="middle">
          OK
        </text>

        {/* Directional Buttons with Click Handlers */}
        <ellipse cx="120" cy="218" rx="16" ry="10" fill="#8a9aba" />
        <foreignObject x={104} y={208} width={32} height={20}>
          <button
            type="button"
            aria-label="Move up"
            className="w-full h-full bg-transparent outline-none"
            onClick={() =>
              isStarted && !isGameOver && changeDirection({ x: 0, y: -1 })
            }
          />
        </foreignObject>
        <path d="M 120 213 L 115 220 L 125 220 Z" fill="#5a6a8a" />

        <ellipse cx="120" cy="282" rx="16" ry="10" fill="#8a9aba" />
        <foreignObject x={104} y={272} width={32} height={20}>
          <button
            type="button"
            aria-label="Move down"
            className="w-full h-full bg-transparent outline-none"
            onClick={() =>
              isStarted && !isGameOver && changeDirection({ x: 0, y: 1 })
            }
          />
        </foreignObject>
        <path d="M 120 287 L 115 280 L 125 280 Z" fill="#5a6a8a" />

        <ellipse cx="85" cy="250" rx="12" ry="18" fill="#8a9aba" />
        <foreignObject x={73} y={232} width={24} height={36}>
          <button
            type="button"
            aria-label="Move left"
            className="w-full h-full bg-transparent outline-none"
            onClick={() =>
              isStarted && !isGameOver && changeDirection({ x: -1, y: 0 })
            }
          />
        </foreignObject>
        <path d="M 80 250 L 87 245 L 87 255 Z" fill="#5a6a8a" />

        <ellipse cx="155" cy="250" rx="12" ry="18" fill="#8a9aba" />
        <foreignObject x={143} y={232} width={24} height={36}>
          <button
            type="button"
            aria-label="Move right"
            className="w-full h-full bg-transparent outline-none"
            onClick={() =>
              isStarted && !isGameOver && changeDirection({ x: 1, y: 0 })
            }
          />
        </foreignObject>
        <path d="M 160 250 L 153 245 L 153 255 Z" fill="#5a6a8a" />

        <ellipse
          cx="45"
          cy="250"
          rx="8"
          ry="15"
          fill="#8a9aba"
          className="cursor-pointer"
        />
        <ellipse
          cx="195"
          cy="250"
          rx="8"
          ry="15"
          fill="#8a9aba"
          className="cursor-pointer"
        />

        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const row = Math.floor((num - 1) / 3);
          const col = (num - 1) % 3;
          const x = 60 + col * 60;
          const y = 325 + row * 35;
          const letters = [
            "",
            "ABC",
            "DEF",
            "GHI",
            "JKL",
            "MNO",
            "PQRS",
            "TUV",
            "WXYZ",
          ][num - 1];

          return (
            <g key={num}>
              <ellipse cx={x} cy={y} rx="22" ry="14" fill="#6a7a9a" />
              <ellipse
                cx={x}
                cy={y}
                rx="20"
                ry="12"
                fill="#8a9aba"
                className="cursor-pointer hover:fill-[#9aabca] transition-colors"
              />
              <text
                x={x}
                y={y + 4}
                fontSize="15"
                fill="#2a3a5a"
                textAnchor="middle"
                fontFamily="Arial, sans-serif"
                fontWeight="bold"
              >
                {num}
              </text>
              {letters && (
                <text
                  x={x}
                  y={y + 11}
                  fontSize="6"
                  fill="#4a5a7a"
                  textAnchor="middle"
                  fontFamily="Arial, sans-serif"
                >
                  {letters}
                </text>
              )}
            </g>
          );
        })}

        <g>
          <ellipse cx="60" cy="430" rx="22" ry="14" fill="#6a7a9a" />
          <ellipse
            cx="60"
            cy="430"
            rx="20"
            ry="12"
            fill="#8a9aba"
            className="cursor-pointer hover:fill-[#9aabca] transition-colors"
          />
          <text
            x="60"
            y="434"
            fontSize="18"
            fill="#2a3a5a"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
          >
            *
          </text>
          <text
            x="60"
            y="441"
            fontSize="6"
            fill="#4a5a7a"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
          >
            +
          </text>
        </g>

        <g>
          <ellipse cx="120" cy="430" rx="22" ry="14" fill="#6a7a9a" />
          <ellipse cx="120" cy="430" rx="20" ry="12" fill="#8a9aba" />
          <foreignObject x={100} y={418} width={40} height={24}>
            <button
              type="button"
              aria-label="Pause or resume game"
              className="w-full h-full bg-transparent outline-none"
              onClick={() => isStarted && setIsPaused((prev) => !prev)}
            />
          </foreignObject>
          <text
            x="120"
            y="434"
            fontSize="15"
            fill="#2a3a5a"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
          >
            0
          </text>
        </g>

        <g>
          <ellipse cx="180" cy="430" rx="22" ry="14" fill="#6a7a9a" />
          <ellipse
            cx="180"
            cy="430"
            rx="20"
            ry="12"
            fill="#8a9aba"
            className="cursor-pointer hover:fill-[#9aabca] transition-colors"
          />
          <text
            x="180"
            y="435"
            fontSize="18"
            fill="#2a3a5a"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontWeight="bold"
          >
            #
          </text>
        </g>

        <ellipse cx="60" cy="465" rx="20" ry="12" fill="#4a7a5a" />
        <ellipse cx="60" cy="465" rx="18" ry="10" fill="#5aaa6a" />
        <foreignObject x={42} y={455} width={36} height={20}>
          <button
            type="button"
            aria-label="Reset game"
            className="w-full h-full bg-transparent outline-none"
            onClick={resetGame}
          />
        </foreignObject>
        <text x="60" y="469" fontSize="14" fill="#e8ffe8" textAnchor="middle">
          ✆
        </text>

        <ellipse cx="180" cy="465" rx="20" ry="12" fill="#8a4a5a" />
        <ellipse
          cx="180"
          cy="465"
          rx="18"
          ry="10"
          fill="#aa5a6a"
          className="cursor-pointer hover:fill-[#ba6a7a] transition-colors"
        />
        <text x="180" y="469" fontSize="14" fill="#ffe8e8" textAnchor="middle">
          ✖
        </text>
      </svg>

      <div className="text-blue-300 text-sm mt-3 mb-[30px]">
        <p
          className={`font-semibold ${
            isStarted || isGameOver ? "visible" : "invisible"
          }`}
        >
          Score: <span className="text-2xl text-white">{score}</span>
        </p>
      </div>
    </div>
  );
}
