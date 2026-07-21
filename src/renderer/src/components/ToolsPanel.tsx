import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Database, Monitor, Keyboard, Download, Upload,
  Search, X, FolderOutput, Table, ChevronRight, Sun, Moon, Laptop,
} from 'lucide-react';
import { Button } from './ui/Button';
import { SectionHeader } from './ui/SectionHeader';
import { GlassPanel } from './ui/GlassPanel';
import { panelSlideIn, overlayFade } from '../lib/animations';

interface ToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject?: any;
  settings: any;
  onSettingsUpdate: () => void;
}

type Tab = 'appearance' | 'shortcuts' | 'data';

export function ToolsPanel({ isOpen, onClose, currentProject, settings, onSettingsUpdate }: ToolsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  const [status, setStatus] = useState('');

  const handleBackup = async () => {
    setStatus('Creating backup...');
    const res = await (window as any).api.createBackup();
    if (res.success) setStatus('Backup created!');
    else if (!res.canceled) setStatus(`Error: ${res.error}`);
  };

  const handleRestore = async () => {
    const res = await (window as any).api.restoreBackup();
    if (!res.success && !res.canceled) setStatus(`Error: ${res.error}`);
  };

  const handleReindex = async () => {
    setStatus('Rebuilding index...');
    const res = await (window as any).api.reindexSearch();
    if (res.success) setStatus('Search index rebuilt!');
    else setStatus(`Error: ${res.error}`);
  };

  const handleExportProject = async (format: 'json' | 'csv') => {
    if (!currentProject) {
      setStatus('Select a project first');
      return;
    }
    setStatus('Exporting...');
    const ideasRes = await (window as any).api.getIdeasByProject(currentProject.id);
    if (ideasRes.success && ideasRes.data) {
      const res = await (window as any).api.exportMetadata(ideasRes.data, format, `export_${currentProject.name.toLowerCase().replace(/\s+/g, '_')}`);
      if (res.success) setStatus(`Exported to ${res.path}`);
      else if (!res.canceled) setStatus(`Error: ${res.error}`);
    }
  };

  const tabs = [
    { id: 'appearance', label: 'Theme', icon: <Monitor size={16} /> },
    { id: 'shortcuts', label: 'Hotkeys', icon: <Keyboard size={16} /> },
    { id: 'data', label: 'Data', icon: <Database size={16} /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={overlayFade.initial}
            animate={overlayFade.animate}
            exit={overlayFade.exit}
            transition={overlayFade.transition}
            style={{ position: 'fixed', inset: 0, background: 'var(--overlay-bg)', zIndex: 999, backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={panelSlideIn.initial}
            animate={panelSlideIn.animate}
            exit={panelSlideIn.exit}
            transition={panelSlideIn.transition}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: '440px',
              bottom: 0,
              background: 'var(--card-bg)',
              zIndex: 1000,
              boxShadow: 'var(--shadow-xl)',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid var(--border)',
            }}
          >
            {/* Header */}
            <div style={{ padding: 'var(--space-8) var(--space-8) var(--space-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ background: 'var(--primary)', color: 'var(--text-inverse)', padding: 'var(--space-2)', borderRadius: 'var(--radius-md)' }}>
                  <Settings size={20} />
                </div>
                <h2 style={{ margin: 0, fontWeight: 'var(--weight-extrabold)', fontSize: 'var(--text-2xl)', color: 'var(--text-main)' }}>Settings</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} icon={<X size={20} />} style={{ padding: 'var(--space-2)' }} />
            </div>

            {/* Tabs */}
            <div style={{ padding: '0 var(--space-8) var(--space-6)', display: 'flex', gap: 'var(--space-2)' }}>
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'primary' : 'ghost'}
                  size="md"
                  onClick={() => setActiveTab(tab.id as Tab)}
                  icon={tab.icon}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 var(--space-8) var(--space-8)' }}>
              {activeTab === 'appearance' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  <GlassPanel padding="var(--space-5)">
                    <SectionHeader style={{ marginBottom: 'var(--space-3)' }}>Theme Mode</SectionHeader>
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                      {[
                        { id: 'light', label: 'Light', icon: <Sun size={18} /> },
                        { id: 'dark', label: 'Dark', icon: <Moon size={18} /> },
                        { id: 'system', label: 'System', icon: <Laptop size={18} /> },
                      ].map((mode) => (
                        <Button
                          key={mode.id}
                          variant={settings.theme_mode === mode.id ? 'primary' : 'secondary'}
                          onClick={() => {
                            (window as any).api.updateSetting('theme_mode', mode.id);
                            onSettingsUpdate();
                          }}
                          icon={mode.icon}
                          style={{ flex: 1, flexDirection: 'column', padding: 'var(--space-5) var(--space-3)', gap: 'var(--space-2)' }}
                        >
                          {mode.label}
                        </Button>
                      ))}
                    </div>
                  </GlassPanel>
                  <GlassPanel padding="var(--space-5)">
                    <SectionHeader style={{ marginBottom: 'var(--space-3)' }}>App Information</SectionHeader>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', lineHeight: 'var(--leading-relaxed)' }}>
                      CreatorTank v1.0.0<br />
                      Local-first Data Engine: SQLite + SQL.js<br />
                      UI Infrastructure: React + Framer Motion
                    </div>
                  </GlassPanel>
                </motion.div>
              )}

              {activeTab === 'shortcuts' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {[
                    { key: 'shortcut_search', label: 'Global Search', desc: 'Find anything instantly' },
                    { key: 'shortcut_sidebar', label: 'Toggle Sidebar', desc: 'Expand/collapse navigation' },
                    { key: 'shortcut_schedule', label: 'Schedule Item', desc: 'Open date picker for items' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      style={{
                        padding: 'var(--space-4)',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-base)', color: 'var(--text-main)' }}>{item.label}</div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{item.desc}</div>
                      </div>
                      <input
                        value={settings[item.key] || ''}
                        onChange={async (e) => {
                          await (window as any).api.updateSetting(item.key, e.target.value);
                          onSettingsUpdate();
                        }}
                        placeholder="None"
                        style={{
                          width: '100px',
                          padding: 'var(--space-2)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          textAlign: 'center',
                          fontWeight: 'var(--weight-extrabold)',
                          background: 'var(--card-bg)',
                          color: 'var(--primary)',
                          fontSize: 'var(--text-sm)',
                        }}
                      />
                    </div>
                  ))}
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: '0 var(--space-2)' }}>
                    Combinations like <strong>Ctrl+Alt+S</strong> are supported.
                  </p>
                </motion.div>
              )}

              {activeTab === 'data' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  <GlassPanel padding="var(--space-5)">
                    <SectionHeader style={{ marginBottom: 'var(--space-3)' }}>Backup & Recovery</SectionHeader>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      <Button variant="secondary" onClick={handleBackup} icon={<Download size={16} />} style={{ width: '100%', justifyContent: 'space-between', padding: 'var(--space-4)' }}>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 'var(--weight-bold)' }}>Create Backup</div>
                          <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>Save all data to a .zip file</div>
                        </div>
                        <ChevronRight size={16} />
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleRestore}
                        icon={<Upload size={16} />}
                        style={{ width: '100%', justifyContent: 'space-between', padding: 'var(--space-4)', color: 'var(--danger)', borderColor: 'var(--danger-bg)' }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 'var(--weight-bold)' }}>Restore Data</div>
                          <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>Overwrite with previous backup</div>
                        </div>
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </GlassPanel>

                  <GlassPanel padding="var(--space-5)">
                    <SectionHeader style={{ marginBottom: 'var(--space-3)' }}>Export Metadata</SectionHeader>
                    {currentProject ? (
                      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                        <Button variant="secondary" onClick={() => handleExportProject('json')} icon={<FolderOutput size={14} />} style={{ flex: 1, justifyContent: 'center' }}>
                          JSON
                        </Button>
                        <Button variant="secondary" onClick={() => handleExportProject('csv')} icon={<Table size={14} />} style={{ flex: 1, justifyContent: 'center' }}>
                          CSV
                        </Button>
                      </div>
                    ) : (
                      <div style={{ padding: 'var(--space-3)', background: 'var(--bg)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Select a project to export its metadata
                      </div>
                    )}
                  </GlassPanel>

                  <GlassPanel padding="var(--space-5)">
                    <SectionHeader style={{ marginBottom: 'var(--space-3)' }}>Maintenance</SectionHeader>
                    <Button variant="secondary" onClick={handleReindex} icon={<Search size={16} />} style={{ width: '100%', justifyContent: 'flex-start', padding: 'var(--space-4)', borderStyle: 'dashed' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 'var(--weight-bold)' }}>Rebuild Search Index</div>
                        <div style={{ fontSize: 'var(--text-xs)', opacity: 0.7 }}>Fix search visibility issues</div>
                      </div>
                    </Button>
                  </GlassPanel>
                </motion.div>
              )}
            </div>

            {/* Status Footer */}
            <AnimatePresence>
              {status && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  style={{
                    padding: 'var(--space-4) var(--space-8)',
                    background: 'var(--primary)',
                    color: 'var(--text-inverse)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--weight-semibold)',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {status}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
