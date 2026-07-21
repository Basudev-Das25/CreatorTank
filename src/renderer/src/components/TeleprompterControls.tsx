import { motion } from 'framer-motion';
import {
  Play, Pause, RotateCcw, ChevronLeft, ChevronRight,
  Sun, Moon, Contrast, Eye, Type,
  Minus, Plus, X, Timer,
} from 'lucide-react';
import { Button } from './ui/Button';

interface TeleprompterControlsProps {
  isPlaying: boolean;
  speed: number;
  fontSize: number;
  theme: 'dark' | 'light' | 'high-contrast' | 'night';
  mirrorMode: 'none' | 'horizontal' | 'vertical' | 'both';
  focusMode: boolean;
  readingGuide: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  onSpeedChange: (speed: number) => void;
  onFontSizeChange: (size: number) => void;
  onThemeChange: (theme: 'dark' | 'light' | 'high-contrast' | 'night') => void;
  onMirrorModeChange: (mode: 'none' | 'horizontal' | 'vertical' | 'both') => void;
  onToggleFocusMode: () => void;
  onToggleReadingGuide: () => void;
  onExit: () => void;
  timeRemaining: string;
  wordsRemaining: number;
}

const SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const THEME_OPTIONS = [
  { id: 'dark' as const, icon: <Moon size={16} />, label: 'Dark' },
  { id: 'light' as const, icon: <Sun size={16} />, label: 'Light' },
  { id: 'high-contrast' as const, icon: <Contrast size={16} />, label: 'High Contrast' },
  { id: 'night' as const, icon: <Eye size={16} />, label: 'Night' },
];

const MIRROR_OPTIONS = [
  { id: 'none' as const, label: 'None' },
  { id: 'horizontal' as const, label: 'Horizontal' },
  { id: 'vertical' as const, label: 'Vertical' },
  { id: 'both' as const, label: 'Both' },
];

export function TeleprompterControls({
  isPlaying,
  speed,
  fontSize,
  theme,
  mirrorMode,
  focusMode,
  readingGuide,
  onTogglePlay,
  onRestart,
  onJumpToStart,
  onJumpToEnd,
  onSpeedChange,
  onFontSizeChange,
  onThemeChange,
  onMirrorModeChange,
  onToggleFocusMode,
  onToggleReadingGuide,
  onExit,
  timeRemaining,
  wordsRemaining,
}: TeleprompterControlsProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        borderTop: '1px solid var(--glass-border)',
        padding: 'var(--space-4) var(--space-6)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Left: Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Button variant="ghost" size="sm" onClick={onJumpToStart} icon={<ChevronLeft size={16} />} title="Jump to start" />
          <Button variant={isPlaying ? 'primary' : 'secondary'} size="md" onClick={onTogglePlay} icon={isPlaying ? <Pause size={18} /> : <Play size={18} />} />
          <Button variant="ghost" size="sm" onClick={onRestart} icon={<RotateCcw size={16} />} title="Restart" />
          <Button variant="ghost" size="sm" onClick={onJumpToEnd} icon={<ChevronRight size={16} />} title="Jump to end" />
        </div>

        {/* Center: Speed Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Speed</span>
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            {SPEED_PRESETS.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: speed === s ? 'var(--primary)' : 'transparent',
                  color: speed === s ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  fontWeight: speed === s ? 'var(--weight-bold)' : 'var(--weight-medium)',
                  transition: 'var(--transition-fast)',
                }}
              >
                {s}x
              </button>
            ))}
          </div>
          <input
            type="range"
            min="0.25"
            max="3"
            step="0.25"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            style={{ width: '80px', accentColor: 'var(--primary)' }}
          />
        </div>

        {/* Center Right: Font & Theme */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
            <Button variant="ghost" size="sm" onClick={() => onFontSizeChange(Math.max(16, fontSize - 4))} icon={<Minus size={14} />} />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', minWidth: '40px', textAlign: 'center' }}>{fontSize}px</span>
            <Button variant="ghost" size="sm" onClick={() => onFontSizeChange(Math.min(72, fontSize + 4))} icon={<Plus size={14} />} />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => onThemeChange(t.id)}
                title={t.label}
                style={{
                  padding: '6px',
                  borderRadius: 'var(--radius-sm)',
                  background: theme === t.id ? 'var(--primary)' : 'transparent',
                  color: theme === t.id ? 'var(--text-inverse)' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)',
                }}
              >
                {t.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Mode Toggles & Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
            <select
              value={mirrorMode}
              onChange={(e) => onMirrorModeChange(e.target.value as any)}
              style={{
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg)',
                color: 'var(--text-main)',
                border: '1px solid var(--border)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
              }}
            >
              {MIRROR_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <Button variant={focusMode ? 'primary' : 'ghost'} size="sm" onClick={onToggleFocusMode} icon={<Eye size={14} />} title="Focus mode" />
          <Button variant={readingGuide ? 'primary' : 'ghost'} size="sm" onClick={onToggleReadingGuide} icon={<Type size={14} />} title="Reading guide" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              <Timer size={10} style={{ marginRight: '4px' }} />
              {timeRemaining}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              {wordsRemaining} words left
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onExit} icon={<X size={18} />} title="Exit teleprompter (Esc)" />
        </div>
      </div>
    </motion.div>
  );
}
