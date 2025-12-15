"use client";

import { useEffect, useRef, useState } from "react";

import { publicAssetUrl } from "@/lib/public-asset-url";

const PintooRun = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [_score, setScore] = useState(0); // renamed to _score for biome unused var rule
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const SCALE = 1.7;

  const gameStateRef = useRef({
    pintoo: {
      x: 50 * SCALE,
      y: 0,
      width: 70 * SCALE,
      height: 70 * SCALE,
      velocityY: 0,
      jumping: false,
      frame: 0,
    },
    obstacles: [] as { x: number; width: number; height: number }[],
    score: 0,
    frameCount: 0,
    gameOver: false,
    gameSpeed: 0,
    lastTime: 0,
    animationTimer: 0,
    gameTime: 0,
    jumpBuffer: 0,
  });

  const assetsRef = useRef({
    pintooSprite: null as HTMLImageElement | null,
    bg: null as HTMLImageElement | null,
  });

  // Load high score
  useEffect(() => {
    const savedHighScore = localStorage.getItem("pintooHighScore");
    if (savedHighScore) setHighScore(parseInt(savedHighScore, 10)); // ✅ radix added
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const GRAVITY = 0.6 * SCALE;
    const JUMP_STRENGTH = -12 * SCALE;
    const FRAME_RATE = 8;
    const TOTAL_FRAMES = 3;

    let animationId: number;

    // Responsive sizing
    const resizeCanvas = () => {
      canvas.width = window.innerWidth * 0.75;
      canvas.height = window.innerHeight * 0.75;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Load sprite
    const pintooImg = new Image();
    pintooImg.src = publicAssetUrl("/images/addons/pintoo_sprite.png");
    assetsRef.current.pintooSprite = pintooImg;

    // Load background
    const bgImg = new Image();
    bgImg.src = publicAssetUrl("/images/addons/bgpintoorun.png");
    assetsRef.current.bg = bgImg;

    const getFloorY = () => canvas.height - 25 * SCALE;
    gameStateRef.current.pintoo.y = getFloorY();

    const JUMP_BUFFER_TIME = 50;

    // Jump
    const jump = () => {
      const pintoo = gameStateRef.current.pintoo;
      if (!pintoo.jumping && !gameStateRef.current.gameOver) {
        pintoo.velocityY = JUMP_STRENGTH;
        pintoo.jumping = true;
        gameStateRef.current.jumpBuffer = 0;
      } else if (!gameStateRef.current.gameOver) {
        gameStateRef.current.jumpBuffer = JUMP_BUFFER_TIME;
      }
    };

    // Input handlers
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (gameStateRef.current.gameOver) resetGame();
        else jump();
      }
    };
    const handleClick = () => {
      if (gameStateRef.current.gameOver) resetGame();
      else jump();
    };

    // Reset game
    const resetGame = () => {
      cancelAnimationFrame(animationId);
      const floor = getFloorY();
      gameStateRef.current = {
        pintoo: {
          x: 50 * SCALE,
          y: floor,
          width: 70 * SCALE,
          height: 70 * SCALE,
          velocityY: 0,
          jumping: false,
          frame: 0,
        },
        obstacles: [],
        score: 0,
        frameCount: 0,
        gameOver: false,
        gameSpeed: 0,
        lastTime: performance.now(),
        animationTimer: 0,
        gameTime: 0,
        jumpBuffer: 0,
      };
      setScore(0);
      setGameOver(false);
      animationId = requestAnimationFrame(gameLoop);
    };

    // Spawn obstacle
    const spawnObstacle = () => {
      const height = (Math.random() > 0.5 ? 45 : 60) * SCALE;
      gameStateRef.current.obstacles.push({
        x: canvas.width,
        width: 30 * SCALE,
        height,
      });
    };

    // Update Pintoo
    const updatePintoo = (deltaTime: number) => {
      const pintoo = gameStateRef.current.pintoo;
      const floor = getFloorY();

      pintoo.velocityY += GRAVITY * deltaTime;
      pintoo.y += pintoo.velocityY * deltaTime;

      if (pintoo.y >= floor) {
        pintoo.y = floor;
        pintoo.velocityY = 0;
        const wasJumping = pintoo.jumping;
        pintoo.jumping = false;

        if (wasJumping && gameStateRef.current.jumpBuffer > 0) {
          pintoo.velocityY = JUMP_STRENGTH;
          pintoo.jumping = true;
          gameStateRef.current.jumpBuffer = 0;
        }
      }

      if (gameStateRef.current.jumpBuffer > 0) {
        gameStateRef.current.jumpBuffer -= deltaTime * 16.67;
      }

      if (!pintoo.jumping) {
        gameStateRef.current.animationTimer += deltaTime;
        if (gameStateRef.current.animationTimer >= FRAME_RATE) {
          pintoo.frame = (pintoo.frame + 1) % 2;
          gameStateRef.current.animationTimer = 0;
        }
      } else {
        pintoo.frame = 2;
      }
    };

    const updateObstacles = (deltaTime: number) => {
      const { gameSpeed } = gameStateRef.current;
      gameStateRef.current.obstacles = gameStateRef.current.obstacles.filter(
        (o) => o.x + o.width > 0,
      );
      gameStateRef.current.obstacles.forEach((o) => {
        o.x -= gameSpeed * deltaTime;
      });

      if (
        gameStateRef.current.frameCount % 100 === 0 &&
        gameStateRef.current.obstacles.length < 2
      )
        spawnObstacle();
    };

    // Collision detection
    const checkCollision = () => {
      const pintoo = gameStateRef.current.pintoo;
      const floor = getFloorY();
      const isFlying = pintoo.jumping;

      const hitbox = {
        left: pintoo.x + 10 * SCALE,
        right: pintoo.x + pintoo.width - (isFlying ? 15 * SCALE : 2.5 * SCALE),
        top: pintoo.y - pintoo.height + (isFlying ? 25 * SCALE : 20 * SCALE),
        bottom: pintoo.y - 5 * SCALE,
      };

      for (const o of gameStateRef.current.obstacles) {
        const obstacleTop = floor - o.height - 11.7 * SCALE;
        const obstacleBottom = floor + 10 * SCALE;
        const obstacleLeft = o.x - 1 * SCALE;
        const obstacleRight = o.x + o.width - 12 * SCALE;

        const collision =
          hitbox.right > obstacleLeft &&
          hitbox.left < obstacleRight &&
          hitbox.bottom > obstacleTop &&
          hitbox.top < obstacleBottom;

        if (collision) {
          gameStateRef.current.gameOver = true;
          setGameOver(true);

          if (gameStateRef.current.score > highScore) {
            setHighScore(gameStateRef.current.score);
            localStorage.setItem(
              "pintooHighScore",
              gameStateRef.current.score.toString(),
            );
          }

          cancelAnimationFrame(animationId);
          return true;
        }
      }
      return false;
    };

    // Draw Pintoo
    const drawPintoo = (
      ctx: CanvasRenderingContext2D,
      img: HTMLImageElement,
    ) => {
      const pintoo = gameStateRef.current.pintoo;
      const frameWidth = img.width / TOTAL_FRAMES;
      const sx = pintoo.frame * frameWidth;
      ctx.drawImage(
        img,
        sx,
        0,
        frameWidth,
        img.height,
        pintoo.x,
        pintoo.y - pintoo.height + 15 * SCALE,
        pintoo.width,
        pintoo.height,
      );
    };

    // Draw everything
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ✅ optional chaining for background
      if (assetsRef.current.bg?.complete)
        ctx.drawImage(assetsRef.current.bg, 0, 0, canvas.width, canvas.height);

      const floor = getFloorY();

      ctx.fillStyle = "#444";
      ctx.fillRect(0, floor + 10 * SCALE, canvas.width, 2 * SCALE);

      ctx.fillStyle = "#222";
      gameStateRef.current.obstacles.forEach((o) => {
        ctx.fillRect(o.x, floor - o.height + 10 * SCALE, o.width, o.height);
      });

      // ✅ optional chaining for sprite
      if (assetsRef.current.pintooSprite?.complete)
        drawPintoo(ctx, assetsRef.current.pintooSprite);

      ctx.fillStyle = "#fff";
      ctx.font = `${22 * SCALE}px Arial`;
      ctx.textAlign = "left";
      const liveScore = gameStateRef.current.score;
      ctx.fillText(`Score: ${liveScore}`, 30 * SCALE, 40 * SCALE);
      ctx.fillText(`High: ${highScore}`, 180 * SCALE, 40 * SCALE);

      if (gameStateRef.current.gameOver) {
        ctx.save();
        ctx.textAlign = "center";
        const topY = canvas.height * 0.2;

        ctx.font = `${60 * SCALE}px Arial Black`;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 15;
        ctx.fillText("GAME OVER", canvas.width / 2, topY);

        ctx.font = `${24 * SCALE}px Arial`;
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#fff";
        ctx.fillText(
          "Press SPACE or Click to Restart",
          canvas.width / 2,
          topY + 50 * SCALE,
        );

        ctx.restore();
      }
    };

    // Main loop
    const gameLoop = (currentTime: number) => {
      const state = gameStateRef.current;

      if (!state.lastTime) state.lastTime = currentTime;
      const deltaMs = currentTime - state.lastTime;
      const deltaTime = deltaMs / 16.67;
      state.lastTime = currentTime;

      if (!state.gameOver) {
        state.gameTime += deltaMs;
        state.score = Math.floor(state.gameTime / 166.7);
        setScore(state.score);

        const BASE_SPEED = 5 * SCALE;
        const SPEED_FACTOR = 0.02 * SCALE;
        const MAX_SPEED = 15 * SCALE;

        state.gameSpeed = Math.min(
          BASE_SPEED + state.score * SPEED_FACTOR,
          MAX_SPEED,
        );

        updatePintoo(deltaTime);
        updateObstacles(deltaTime);
        checkCollision();
      }

      draw();
      animationId = requestAnimationFrame(gameLoop);
    };

    // Listeners
    window.addEventListener("keydown", handleKeyPress);
    canvas.addEventListener("click", handleClick);
    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", handleKeyPress);
      canvas.removeEventListener("click", handleClick);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [highScore]);

  return (
    <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};

export default PintooRun;
