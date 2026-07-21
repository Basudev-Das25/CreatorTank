import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, X, Check, Trash } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { GlassPanel } from './ui/GlassPanel';
import { SectionHeader } from './ui/SectionHeader';
import { modalPop, overlayFade } from '../lib/animations';

interface ScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onScheduled: () => void;
}

export function ScheduleDialog({ isOpen, onClose, item, onScheduled }: ScheduleDialogProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (item) {
      setDate(item.scheduled_date || '');
      setTime(item.scheduled_time || '');
    }
  }, [item, isOpen]);

  if (!item) return null;

  const handleSave = async () => {
    const updates = { scheduled_date: date || null, scheduled_time: time || null };
    let res;
    if (item.type === 'project' || (!item.project_id && item.id)) {
      res = await (window as any).api.updateProject(item.id, updates);
    } else {
      res = await (window as any).api.updateIdea(item.id, updates);
    }
    if (res.success) {
      onScheduled();
      onClose();
    }
  };

  const handleClear = async () => {
    const updates = { scheduled_date: null, scheduled_time: null };
    let res;
    if (item.type === 'project' || (!item.project_id && item.id)) {
      res = await (window as any).api.updateProject(item.id, updates);
    } else {
      res = await (window as any).api.updateIdea(item.id, updates);
    }
    if (res.success) {
      onScheduled();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={overlayFade.initial}
          animate={overlayFade.animate}
          exit={overlayFade.exit}
          transition={overlayFade.transition}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'var(--overlay-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={modalPop.initial}
            animate={modalPop.animate}
            exit={modalPop.exit}
            transition={modalPop.transition}
            style={{
              background: 'var(--card-bg)',
              padding: 'var(--space-6)',
              borderRadius: 'var(--radius-2xl)',
              width: 'min(420px, calc(100vw - 32px))',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ background: 'var(--primary-light)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
                  <Calendar size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-extrabold)', color: 'var(--text-main)' }}>
                  Schedule {item.type === 'project' ? 'Project' : 'Idea'}
                </h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} icon={<X size={20} />} />
            </div>

            {/* Target Item */}
            <GlassPanel variant="sunken" padding="var(--space-4)" style={{ marginBottom: 'var(--space-6)' }}>
              <SectionHeader style={{ marginBottom: 'var(--space-1)' }}>Target Item</SectionHeader>
              <div style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-main)' }}>{item.title || item.name}</div>
            </GlassPanel>

            {/* Date Input */}
            <div style={{ marginBottom: 'var(--space-5)' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                <Calendar size={14} style={{ marginRight: 'var(--space-2)' }} />
                Publication Date
              </label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            {/* Time Input */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--text-muted)', marginBottom: 'var(--space-3)' }}>
                <Clock size={14} style={{ marginRight: 'var(--space-2)' }} />
                Preferred Time (Optional)
              </label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <Button variant="primary" onClick={handleSave} icon={<Check size={18} />} style={{ flex: 1, padding: 'var(--space-4)' }}>
                Save Schedule
              </Button>
              {(item.scheduled_date || item.scheduled_time) && (
                <Button variant="danger" onClick={handleClear} icon={<Trash size={18} />} style={{ padding: 'var(--space-4)' }} />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
