"use client";

import { debounce } from "lodash";
import type Matter from "matter-js";
import {
  Bodies,
  Body,
  Common,
  Engine,
  Events,
  Mouse,
  MouseConstraint,
  Query,
  Render,
  Runner,
  World,
} from "matter-js";
import {
  createContext,
  forwardRef,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import { calculatePosition } from "./calculate-position";
import { parsePathToVertices } from "./svg-path-to-vertices";

type GravityProps = {
  children: ReactNode;
  debug?: boolean;
  gravity?: { x: number; y: number };
  resetOnResize?: boolean;
  grabCursor?: boolean;
  addTopWall?: boolean;
  autoStart?: boolean;
  className?: string;
};

type PhysicsBody = {
  element: HTMLElement;
  body: Matter.Body;
  props: MatterBodyProps;
};

type MatterBodyProps = {
  children: ReactNode;
  matterBodyOptions?: Matter.IBodyDefinition;
  isDraggable?: boolean;
  bodyType?: "rectangle" | "circle" | "svg";
  sampleLength?: number;
  x?: number | string;
  y?: number | string;
  angle?: number;
  className?: string;
  onClick?: () => void;
};

export type GravityRef = {
  start: () => void;
  stop: () => void;
  reset: () => void;
};

const GravityContext = createContext<{
  registerElement: (
    id: string,
    element: HTMLElement,
    props: MatterBodyProps,
  ) => void;
  unregisterElement: (id: string) => void;
} | null>(null);

export const MatterBody = ({
  children,
  className,
  matterBodyOptions = {
    friction: 0.1,
    restitution: 0.1,
    density: 0.001,
    isStatic: false,
  },
  onClick,
  bodyType = "rectangle",
  isDraggable = true,
  sampleLength = 15,
  x = 0,
  y = 0,
  angle = 0,
  ...props
}: MatterBodyProps) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(Math.random().toString(36).substring(7));
  const context = useContext(GravityContext);

  useEffect(() => {
    if (!elementRef.current || !context) return;
    context.registerElement(idRef.current, elementRef.current, {
      children,
      matterBodyOptions,
      bodyType,
      sampleLength,
      isDraggable,
      x,
      y,
      angle,
      onClick,
      ...props,
    });

    return () => context.unregisterElement(idRef.current);
  }, [props, children, matterBodyOptions, isDraggable, onClick]);

  return (
    <div
      ref={elementRef}
      className={cn(
        "absolute",
        className,
        isDraggable && "pointer-events-none",
      )}
    >
      {children}
    </div>
  );
};

const Gravity = forwardRef<GravityRef, GravityProps>(
  (
    {
      children,
      debug = false,
      gravity = { x: 0, y: 1 },
      grabCursor = true,
      resetOnResize = true,
      addTopWall = true,
      autoStart = true,
      className,
      ...props
    },
    ref,
  ) => {
    const canvas = useRef<HTMLDivElement>(null);
    const engine = useRef(Engine.create());
    const render = useRef<Render>(undefined);
    const runner = useRef<Runner>(undefined);
    const bodiesMap = useRef(new Map<string, PhysicsBody>());
    const bodyIdMap = useRef(new Map<number, string>());
    const frameId = useRef<number>(undefined);
    const mouseConstraint = useRef<Matter.MouseConstraint>(undefined);
    const mouseDownHandler = useRef<
      | ((
          event: Matter.IEvent<Matter.MouseConstraint> & {
            mouse: Matter.Mouse;
          },
        ) => void)
      | null
    >(null);
    const mouseUpHandler = useRef<
      | ((
          event: Matter.IEvent<Matter.MouseConstraint> & {
            mouse: Matter.Mouse;
          },
        ) => void)
      | null
    >(null);
    const lastPointerDown = useRef<{
      bodyId: string;
      position: Matter.Vector;
      time: number;
    } | null>(null);
    const mouseDown = useRef(false);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    const isRunning = useRef(false);

    // Register Matter.js body in the physics world
    const registerElement = useCallback(
      (id: string, element: HTMLElement, props: MatterBodyProps) => {
        if (!canvas.current) return;
        const width = element.offsetWidth;
        const height = element.offsetHeight;
        const canvasRect = canvas.current!.getBoundingClientRect();

        const angle = (props.angle || 0) * (Math.PI / 180);

        const x = calculatePosition(props.x, canvasRect.width, width);
        const y = calculatePosition(props.y, canvasRect.height, height);

        const { chamfer, ...restOptions } = props.matterBodyOptions ?? {};
        const safeOptions: Matter.IChamferableBodyDefinition = {
          ...restOptions,
          ...(chamfer !== null && chamfer !== undefined ? { chamfer } : {}),
        };

        let body;
        if (props.bodyType === "circle") {
          const radius = Math.max(width, height) / 2;
          body = Bodies.circle(x, y, radius, {
            ...safeOptions,
            angle: angle,
            render: {
              fillStyle: debug ? "#888888" : "#00000000",
              strokeStyle: debug ? "#333333" : "#00000000",
              lineWidth: debug ? 3 : 0,
            },
          });
        } else if (props.bodyType === "svg") {
          const paths = element.querySelectorAll("path");
          const vertexSets: Matter.Vector[][] = [];

          paths.forEach((path) => {
            const d = path.getAttribute("d");
            const p = parsePathToVertices(d!, props.sampleLength);
            vertexSets.push(p);
          });

          body = Bodies.fromVertices(x, y, vertexSets, {
            ...safeOptions,
            angle: angle,
            render: {
              fillStyle: debug ? "#888888" : "#00000000",
              strokeStyle: debug ? "#333333" : "#00000000",
              lineWidth: debug ? 3 : 0,
            },
          });
        } else {
          body = Bodies.rectangle(x, y, width, height, {
            ...safeOptions,
            angle: angle,
            render: {
              fillStyle: debug ? "#888888" : "#00000000",
              strokeStyle: debug ? "#333333" : "#00000000",
              lineWidth: debug ? 3 : 0,
            },
          });
        }

        if (body) {
          World.add(engine.current.world, [body]);
          bodyIdMap.current.set(body.id, id);
          bodiesMap.current.set(id, { element, body, props });
        }
      },
      [debug],
    );

    const unregisterElement = useCallback((id: string) => {
      const body = bodiesMap.current.get(id);
      if (body) {
        World.remove(engine.current.world, body.body);
        bodyIdMap.current.delete(body.body.id);
        bodiesMap.current.delete(id);
      }
    }, []);

    const updateElements = useCallback(() => {
      const canvasWidth = canvas.current?.offsetWidth ?? 0;
      const canvasHeight = canvas.current?.offsetHeight ?? 0;

      bodiesMap.current.forEach(({ element, body }) => {
        const { x, y } = body.position;
        const rotation = body.angle * (180 / Math.PI);

        const halfW = element.offsetWidth / 2;
        const halfH = element.offsetHeight / 2;

        const clampedX = Math.min(
          Math.max(x, halfW),
          Math.max(halfW, canvasWidth - halfW),
        );
        const clampedY = Math.min(
          Math.max(y, halfH),
          Math.max(halfH, canvasHeight - halfH),
        );

        if (clampedX !== x) {
          Body.setPosition(body, { x: clampedX, y: body.position.y });
          Body.setVelocity(body, {
            x: -body.velocity.x * 0.35,
            y: body.velocity.y,
          });
        }

        if (clampedY !== y) {
          Body.setPosition(body, { x: body.position.x, y: clampedY });
          Body.setVelocity(body, {
            x: body.velocity.x,
            y: -body.velocity.y * 0.35,
          });
        }

        element.style.transform = `translate(${body.position.x - halfW}px, ${
          body.position.y - halfH
        }px) rotate(${rotation}deg)`;
      });

      frameId.current = requestAnimationFrame(updateElements);
    }, []);

    const initializeRenderer = useCallback(() => {
      if (!canvas.current) return;

      const height = canvas.current.offsetHeight;
      const width = canvas.current.offsetWidth;

      Common.setDecomp(require("poly-decomp"));

      engine.current.gravity.x = gravity.x;
      engine.current.gravity.y = gravity.y;

      render.current = Render.create({
        element: canvas.current,
        engine: engine.current,
        options: {
          width,
          height,
          wireframes: false,
          background: "#00000000",
        },
      });

      if (render.current.canvas) {
        render.current.canvas.style.position = "absolute";
        render.current.canvas.style.inset = "0";
        render.current.canvas.style.width = "100%";
        render.current.canvas.style.height = "100%";
        render.current.canvas.style.zIndex = "1";
        render.current.canvas.style.pointerEvents = "auto";
      }

      const mouse = Mouse.create(render.current.canvas);
      mouseConstraint.current = MouseConstraint.create(engine.current, {
        mouse: mouse,
        constraint: {
          stiffness: 0.2,
          render: {
            visible: debug,
          },
        },
      });

      mouseDownHandler.current = (event) => {
        const targetBody = mouseConstraint.current?.body;
        const bodyId = targetBody
          ? bodyIdMap.current.get(targetBody.id)
          : undefined;

        if (!bodyId) {
          lastPointerDown.current = null;
          return;
        }

        lastPointerDown.current = {
          bodyId,
          position: { ...event.mouse.position },
          time: performance.now(),
        };
      };

      mouseUpHandler.current = (event) => {
        if (!lastPointerDown.current) return;

        const { bodyId, position: start, time } = lastPointerDown.current;
        lastPointerDown.current = null;

        const distance = Math.hypot(
          event.mouse.position.x - start.x,
          event.mouse.position.y - start.y,
        );
        const duration = performance.now() - time;

        if (distance > 8 || duration > 300) return;

        const bodyEntry = bodiesMap.current.get(bodyId);
        bodyEntry?.props.onClick?.();
      };

      if (mouseDownHandler.current) {
        Events.on(
          mouseConstraint.current,
          "mousedown",
          mouseDownHandler.current,
        );
      }
      if (mouseUpHandler.current) {
        Events.on(mouseConstraint.current, "mouseup", mouseUpHandler.current);
      }

      const walls = [
        Bodies.rectangle(width / 2, height + 10, width, 20, {
          isStatic: true,
          friction: 1,
          render: {
            visible: debug,
          },
        }),

        Bodies.rectangle(width + 10, height / 2, 20, height, {
          isStatic: true,
          friction: 1,
          render: {
            visible: debug,
          },
        }),

        Bodies.rectangle(-10, height / 2, 20, height, {
          isStatic: true,
          friction: 1,
          render: {
            visible: debug,
          },
        }),
      ];

      const topWall = addTopWall
        ? Bodies.rectangle(width / 2, -10, width, 20, {
            isStatic: true,
            friction: 1,
            render: {
              visible: debug,
            },
          })
        : null;

      if (topWall) {
        walls.push(topWall);
      }

      const touchingMouse = () =>
        Query.point(
          engine.current.world.bodies,
          mouseConstraint.current?.mouse.position || { x: 0, y: 0 },
        ).length > 0;

      if (grabCursor) {
        Events.on(engine.current, "beforeUpdate", (event) => {
          if (canvas.current) {
            if (!mouseDown.current && !touchingMouse()) {
              canvas.current.style.cursor = "default";
            } else if (touchingMouse()) {
              canvas.current.style.cursor = mouseDown.current
                ? "grabbing"
                : "grab";
            }
          }
        });

        canvas.current.addEventListener("mousedown", (event) => {
          mouseDown.current = true;

          if (canvas.current) {
            if (touchingMouse()) {
              canvas.current.style.cursor = "grabbing";
            } else {
              canvas.current.style.cursor = "default";
            }
          }
        });
        canvas.current.addEventListener("mouseup", (event) => {
          mouseDown.current = false;

          if (canvas.current) {
            if (touchingMouse()) {
              canvas.current.style.cursor = "grab";
            } else {
              canvas.current.style.cursor = "default";
            }
          }
        });
      }

      World.add(engine.current.world, [mouseConstraint.current, ...walls]);

      render.current.mouse = mouse;

      runner.current = Runner.create();
      Render.run(render.current);
      updateElements();
      runner.current.enabled = false;

      if (autoStart) {
        runner.current.enabled = true;
        startEngine();
      }
    }, [updateElements, debug, autoStart]);

    const clearRenderer = useCallback(() => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }

      if (mouseConstraint.current && mouseDownHandler.current) {
        Events.off(
          mouseConstraint.current,
          "mousedown",
          mouseDownHandler.current,
        );
      }

      if (mouseConstraint.current && mouseUpHandler.current) {
        Events.off(mouseConstraint.current, "mouseup", mouseUpHandler.current);
      }

      if (mouseConstraint.current) {
        World.remove(engine.current.world, mouseConstraint.current);
      }

      if (render.current) {
        Mouse.clearSourceEvents(render.current.mouse);
        Render.stop(render.current);
        render.current.canvas.remove();
      }

      if (runner.current) {
        Runner.stop(runner.current);
      }

      if (engine.current) {
        World.clear(engine.current.world, false);
        Engine.clear(engine.current);
      }

      bodyIdMap.current.clear();
      lastPointerDown.current = null;
      mouseDownHandler.current = null;
      mouseUpHandler.current = null;
      bodiesMap.current.clear();
    }, []);

    const handleResize = useCallback(() => {
      if (!canvas.current || !resetOnResize) return;

      const newWidth = canvas.current.offsetWidth;
      const newHeight = canvas.current.offsetHeight;

      setCanvasSize({ width: newWidth, height: newHeight });

      clearRenderer();
      initializeRenderer();
    }, [clearRenderer, initializeRenderer, resetOnResize]);

    const startEngine = useCallback(() => {
      if (runner.current) {
        runner.current.enabled = true;

        Runner.run(runner.current, engine.current);
      }
      if (render.current) {
        Render.run(render.current);
      }
      frameId.current = requestAnimationFrame(updateElements);
      isRunning.current = true;
    }, [updateElements, canvasSize]);

    const stopEngine = useCallback(() => {
      if (!isRunning.current) return;

      if (runner.current) {
        Runner.stop(runner.current);
      }
      if (render.current) {
        Render.stop(render.current);
      }
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
      isRunning.current = false;
    }, []);

    const reset = useCallback(() => {
      stopEngine();
      bodiesMap.current.forEach(({ element, body, props }) => {
        body.angle = props.angle || 0;

        const x = calculatePosition(
          props.x,
          canvasSize.width,
          element.offsetWidth,
        );
        const y = calculatePosition(
          props.y,
          canvasSize.height,
          element.offsetHeight,
        );
        body.position.x = x;
        body.position.y = y;
      });
      updateElements();
      handleResize();
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        start: startEngine,
        stop: stopEngine,
        reset,
      }),
      [startEngine, stopEngine],
    );

    useEffect(() => {
      if (!resetOnResize) return;

      const debouncedResize = debounce(handleResize, 500);
      window.addEventListener("resize", debouncedResize);

      return () => {
        window.removeEventListener("resize", debouncedResize);
        debouncedResize.cancel();
      };
    }, [handleResize, resetOnResize]);

    useEffect(() => {
      initializeRenderer();
      return clearRenderer;
    }, [initializeRenderer, clearRenderer]);

    return (
      <GravityContext.Provider value={{ registerElement, unregisterElement }}>
        <div
          ref={canvas}
          className={cn(className, "absolute top-0 left-0 w-full h-full")}
          {...props}
        >
          {children}
        </div>
      </GravityContext.Provider>
    );
  },
);

Gravity.displayName = "Gravity";
export default Gravity;
