import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    MathJax?: {
      typesetPromise: (elements: (HTMLElement | null)[]) => Promise<void>;
    };
  }
}

interface Props {
  content: string;
  className?: string;
}

const MathMarkdown: React.FC<Props> = ({ content, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && window.MathJax) {
      window.MathJax.typesetPromise([containerRef.current])
        .catch((err: any) => console.log('MathJax processing error: ' + err.message));
    }
  }, [content]);

  return (
    <div
      ref={containerRef}
      className={`math-content ${className}`}
    >
      {content}
    </div>
  );
};

export default MathMarkdown;