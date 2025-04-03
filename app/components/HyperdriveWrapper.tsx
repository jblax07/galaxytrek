'use client';

import dynamic from 'next/dynamic';

// Dynamically import the HyperdriveBackground with no SSR since it uses browser APIs
const HyperdriveBackground = dynamic(() => import('./HyperdriveBackground'), {
  ssr: false,
});

interface HyperdriveWrapperProps {
  starCount?: number;
  speed?: number;
}

const HyperdriveWrapper = ({
  starCount = 300,
  speed = 1.5,
}: HyperdriveWrapperProps) => {
  return (
    <HyperdriveBackground
      starCount={starCount}
      speed={speed}
    />
  );
};

export default HyperdriveWrapper;
