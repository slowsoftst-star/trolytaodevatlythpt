import React, { useEffect, useRef } from 'react';

// Extend Window interface for MathJax
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
      // Clear previous typesetting if necessary, though simpler to just process newly
      // Using typesetPromise is the modern MathJax 3 way
      window.MathJax.typesetPromise([containerRef.current])
        .catch((err: any) => console.log('MathJax processing error: ' + err.message));
    }
  }, [content]);

  // Basic formatting: convert newlines to <br> for non-latex parts
  // Note: This is a simple renderer. For complex markdown, a library is better,
  // but this suffices for the requirement of showing text + math.
  // We use a dangerousSetInnerHTML approach carefully or split string.
  
  // To keep it safe and simple, we rely on MathJax to find delimiters $...$ and $$...$$
  // inside the text. We just wrap paragraphs.
  
  return (
    <div 
      ref={containerRef} 
      className={`prose prose-teal max-w-none text-slate-800 ${className} leading-relaxed`}
      style={{ whiteSpace: 'pre-wrap' }} // Preserve newlines
    >
      {content}
    </div>
  );
};

export default MathMarkdown;