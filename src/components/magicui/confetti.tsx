"use client";

import React, { createRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

import confetti from "canvas-confetti";

export interface ConfettiRef {
  fire: (options?: confetti.Options) => void;
}

interface ConfettiProps {
  particleCount?: number;
  angle?: number;
  spread?: number;
  startVelocity?: number;
  decay?: number;
  gravity?: number;
  drift?: number;
  flat?: boolean;
  ticks?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  shapes?: ("square" | "circle" | "star")[];
  zIndex?: number;
  disableForReducedMotion?: boolean;
  useWorker?: boolean;
  resize?: boolean;
  canvas?: HTMLCanvasElement;
  scalar?: number;
}

export const Confetti = React.forwardRef<ConfettiRef, ConfettiProps>(
  (
    {
      particleCount = 50,
      angle = 90,
      spread = 45,
      startVelocity = 45,
      decay = 0.9,
      gravity = 1,
      drift = 0,
      flat = false,
      ticks = 200,
      origin = { x: 0.5, y: 0.5 },
      colors = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
      shapes = ['square', 'circle'],
      zIndex = 100,
      disableForReducedMotion = false,
      useWorker = true,
      resize = true,
      canvas,
      scalar = 1,
    },
    ref,
  ) => {
    const refConfetti = useRef<confetti.CreateTypes | null>(null);

    const getInstance = useCallback(() => {
      if (refConfetti.current) return refConfetti.current;

      const canvasEl = canvas || document.createElement("canvas");
      canvasEl.style.position = "fixed";
      canvasEl.style.top = "0";
      canvasEl.style.left = "0";
      canvasEl.style.width = "100%";
      canvasEl.style.height = "100%";
      canvasEl.style.pointerEvents = "none";
      canvasEl.style.zIndex = zIndex.toString();

      if (!canvas) {
        document.body.appendChild(canvasEl);
      }

      refConfetti.current = confetti.create(canvasEl, {
        resize,
        useWorker,
        disableForReducedMotion,
      });

      return refConfetti.current;
    }, [canvas, resize, useWorker, disableForReducedMotion, zIndex]);

    const fire = useCallback(
      (options?: confetti.Options) => {
        const confettiInstance = getInstance();
        const opts: confetti.Options = {
          particleCount,
          angle,
          spread,
          startVelocity,
          decay,
          gravity,
          drift,
          flat,
          ticks,
          origin,
          colors,
          shapes,
          scalar,
          ...options,
        };

        confettiInstance(opts);
      },
      [
        getInstance,
        particleCount,
        angle,
        spread,
        startVelocity,
        decay,
        gravity,
        drift,
        flat,
        ticks,
        origin,
        colors,
        shapes,
        scalar,
      ],
    );

    useImperativeHandle(ref, () => ({
      fire,
    }), [fire]);

    useEffect(() => {
      return () => {
        if (refConfetti.current) {
          refConfetti.current.reset();
        }
      };
    }, []);

    return null;
  },
);

Confetti.displayName = "Confetti";

export interface ConfettiButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  options?: confetti.Options;
  children?: React.ReactNode;
}

export const ConfettiButton = React.forwardRef<HTMLButtonElement, ConfettiButtonProps>(
  ({ children, options, ...props }, ref) => {
    const confettiRef = createRef<ConfettiRef>();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;

      confettiRef.current?.fire({
        origin: { x, y },
        ...options,
      });

      props.onClick?.(event);
    };

    return (
      <>
        <Confetti ref={confettiRef} />
        <button ref={ref} {...props} onClick={handleClick}>
          {children}
        </button>
      </>
    );
  },
);

ConfettiButton.displayName = "ConfettiButton";
