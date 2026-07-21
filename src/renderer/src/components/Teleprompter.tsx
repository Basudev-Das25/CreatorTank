import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TeleprompterControls } from './TeleprompterControls';

interface TeleprompterProps {
  content: string;
  onClose: () => void;
}

type Theme = 'dark' | 'light' | 'high-contrast' | 'night';
type MirrorMode = 'none' | 'horizontal' | 'vertical' | 'both';

const WPM = 150; // Average reading speed

export function Teleprompter({ content, onClose }: TeleprompterProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fontSize, setFontSize] = useState(32);
  const [theme, setTheme] = useState<Theme>('dark');
  const [mirrorMode, setMirrorMode] = useState<MirrorMode>('none');
  const [focusMode, setFocusMode] = useState(true);
  const [readingGuide, setReadingGuide] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Calculate reading stats
  const words = content.trim().split(/\s+/).filter(w => w.length > 0);
  const totalWords = words.length;
  const wordsScrolled = Math.floor((scrollPosition / (textRef.current?.scrollHeight || 1)) * totalWords);
  const wordsRemaining = Math.max(0, totalWords - wordsScrolled);
  const minutesRemaining = Math.ceil(wordsRemaining / WPM);
  const timeRemaining = `${minutesRemaining} min remaining`;

  // Auto-scroll logic
  const scroll = useCallback((timestamp: number) => {
    if (!containerRef.current || !isPlaying) return;

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    // Pixels per millisecond based on speed and font size
    const baseSpeed = fontSize * 0.15; // Base pixels per ms
    const pixelsToScroll = baseSpeed * speed * (delta / 16); // Normalize to ~60fps

    const container = containerRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;

    if (container.scrollTop < maxScroll) {
      container.scrollTop += pixelsToScroll;
      setScrollPosition(container.scrollTop);
      animationRef.current = requestAnimationFrame(scroll);
    } else {
      setIsPlaying(false);
    }
  }, [isPlaying, speed, fontSize]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(scroll);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, scroll]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case '+':
        case '=':
          setSpeed(prev => Math.min(3, prev + 0.25));
          break;
        case '-':
          setSpeed(prev => Math.max(0.25, prev - 0.25));
          break;
        case 'Home':
          if (containerRef.current) {
            containerRef.current.scrollTop = 0;
            setScrollPosition(0);
          }
          break;
        case 'End':
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
            setScrollPosition(containerRef.current.scrollHeight);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Pause on manual scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = () => {
      if (isPlaying) {
        setIsPlaying(false);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: true });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [isPlaying]);

  // Theme styles
  const themeStyles: Record<Theme, { bg: string; text: string; guide: string }> = {
    dark: { bg: '#0a0f14', text: '#e8edf4', guide: 'rgba(74, 222, 128, 0.3)' },
    light: { bg: '#f5f7f3', text: '#1a2e05', guide: 'rgba(22, 163, 74, 0.2)' },
    'high-contrast': { bg: '#000000', text: '#ffffff', guide: 'rgba(255, 255, 0, 0.4)' },
    night: { bg: '#1a0a00', text: '#ff9500', guide: 'rgba(255, 149, 0, 0.3)' },
  };

  const currentTheme = themeStyles[theme];

  // Mirror transform
  const getMirrorTransform = (): string => {
    switch (mirrorMode) {
      case 'horizontal': return 'scaleX(-1)';
      case 'vertical': return 'scaleY(-1)';
      case 'both': return 'scale(-1, -1)';
      default: return 'none';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: currentTheme.bg,
        display: 'flex',
        flexDirection: 'column',
        transform: getMirrorTransform(),
      }}
    >
      {/* Reading area with focus mode gradient */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflow: 'auto',
          scrollBehavior: 'auto',
          position: 'relative',
        }}
      >
        {/* Focus mode gradients */}
        {focusMode && (
          <>
            <div
              style={{
                position: 'sticky',
                top: 0,
                height: '30vh',
                background: `linear-gradient(to bottom, ${currentTheme.bg}, transparent)`,
                zIndex: 10,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'sticky',
                bottom: 0,
                height: '30vh',
                background: `linear-gradient(to top, ${currentTheme.bg}, transparent)`,
                zIndex: 10,
                pointerEvents: 'none',
                marginTop: '-30vh',
              }}
            />
          </>
        )}

        {/* Reading guide line */}
        {readingGuide && (
          <div
            style={{
              position: 'sticky',
              top: '50%',
              left: 0,
              right: 0,
              height: '3px',
              background: currentTheme.guide,
              zIndex: 5,
              pointerEvents: 'none',
              boxShadow: `0 0 20px ${currentTheme.guide}`,
            }}
          />
        )}

        {/* Script content */}
        <div
          ref={textRef}
          style={{
            padding: '40vh var(--space-16)',
            maxWidth: '900px',
            margin: '0 auto',
            fontSize: `${fontSize}px`,
            lineHeight: 1.8,
            color: currentTheme.text,
            fontWeight: 'var(--weight-medium)',
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word',
          }}
        >
          {content || 'No script content loaded...'}
        </div>
      </div>

      {/* Controls */}
      <AnimatePresence>
        <TeleprompterControls
          isPlaying={isPlaying}
          speed={speed}
          fontSize={fontSize}
          theme={theme}
          mirrorMode={mirrorMode}
          focusMode={focusMode}
          readingGuide={readingGuide}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          onRestart={() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = 0;
              setScrollPosition(0);
              setIsPlaying(false);
            }
          }}
          onJumpToStart={() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = 0;
              setScrollPosition(0);
            }
          }}
          onJumpToEnd={() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = containerRef.current.scrollHeight;
              setScrollPosition(containerRef.current.scrollHeight);
            }
          }}
          onSpeedChange={setSpeed}
          onFontSizeChange={setFontSize}
          onThemeChange={setTheme}
          onMirrorModeChange={setMirrorMode}
          onToggleFocusMode={() => setFocusMode(!focusMode)}
          onToggleReadingGuide={() => setReadingGuide(!readingGuide)}
          onExit={onClose}
          timeRemaining={timeRemaining}
          wordsRemaining={wordsRemaining}
        />
      </AnimatePresence>
    </motion.div>
  );
}
