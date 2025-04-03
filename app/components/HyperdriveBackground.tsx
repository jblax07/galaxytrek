'use client';

import { useEffect, useState } from 'react';

interface HyperdriveBackgroundProps {
  starCount?: number;
  speed?: number;
}

const HyperdriveBackground = ({
  starCount = 200,
  speed = 1,
}: HyperdriveBackgroundProps) => {
  const [stars, setStars] = useState<
    Array<{ x: number; y: number; z: number; size: number }>
  >([]);

  useEffect(() => {
    // Generate random stars
    const newStars = Array.from({ length: starCount }, () => ({
      x: Math.random() * 2000 - 1000,
      y: Math.random() * 2000 - 1000,
      z: Math.random() * 1000,
      size: Math.random() * 1.2 + 0.3, // Smaller stars overall
    }));
    setStars(newStars);

    // Animation loop
    let frameId: number;
    let prevTime = 0;

    const animate = (time: number) => {
      const delta = (time - prevTime) * 0.1 * speed;
      prevTime = time;

      setStars((prevStars) =>
        prevStars.map((star) => {
          // Move stars towards viewer (increase z)
          let z = star.z - delta;

          // Reset star position when it gets too close
          if (z < 1) {
            return {
              x: Math.random() * 2000 - 1000,
              y: Math.random() * 2000 - 1000,
              z: 1000,
              size: Math.random() * 1.2 + 0.3, // Keep consistent with initial generation
            };
          }

          return { ...star, z };
        })
      );

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [starCount, speed]);

  return (
    <div className='fixed inset-0 bg-black overflow-hidden'>
      {stars.map((star, i) => {
        // Calculate perspective
        const scale = 1000 / Math.max(1, star.z);
        const x = star.x * scale + window.innerWidth / 2;
        const y = star.y * scale + window.innerHeight / 2;

        // Calculate opacity and length based on z-position
        const opacity = Math.min(1, (1000 - star.z) / 500);

        // Reduce length of star trails - more subtle effect
        const length = Math.min(12, (1000 - star.z) / 50);

        // Thinner height for stars
        const height = Math.max(0.5, star.size * 0.7);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              width: `${length}px`,
              height: `${height}px`,
              opacity,
              backgroundColor: 'white',
              borderRadius: '40% 0 0 40%', // Softer edge
              transform: 'translateZ(0)',
              boxShadow: `0 0 ${star.size}px rgba(255, 255, 255, 0.5)`, // Reduced glow
              transition: 'opacity 0.1s ease',
            }}
          />
        );
      })}
    </div>
  );
};

export default HyperdriveBackground;
