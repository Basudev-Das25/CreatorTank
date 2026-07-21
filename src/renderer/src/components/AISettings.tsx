import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bot, Check, X, ChevronRight,
  Zap, Shield,
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { GlassPanel } from './ui/GlassPanel';
import { SectionHeader } from './ui/SectionHeader';
import { getAllProviderInfo } from '../features/ai/providers';
import type { ProviderInfo } from '../features/ai/types';

interface AISettingsProps {
  settings: any;
  onSettingsUpdate: () => void;
}

export function AISettings({ settings, onSettingsUpdate }: AISettingsProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [providerConfig, setProviderConfig] = useState<any>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    setProviders(getAllProviderInfo());
  }, [settings]);

  const loadProviderConfig = (providerId: string) => {
    setSelectedProvider(providerId);
    setProviderConfig({
      enabled: settings[`ai_provider_${providerId}_enabled`] === 'true',
      apiKey: settings[`ai_provider_${providerId}_api_key`] || '',
      model: settings[`ai_provider_${providerId}_model`] || '',
      temperature: parseFloat(settings[`ai_provider_${providerId}_temperature`] || '0.7'),
      maxTokens: parseInt(settings[`ai_provider_${providerId}_max_tokens`] || '2048'),
    });
    setTestResult(null);
  };

  const saveProviderConfig = async () => {
    if (!selectedProvider) return;

    const updates = [
      { key: `ai_provider_${selectedProvider}_enabled`, value: String(providerConfig.enabled) },
      { key: `ai_provider_${selectedProvider}_model`, value: providerConfig.model },
      { key: `ai_provider_${selectedProvider}_temperature`, value: String(providerConfig.temperature) },
      { key: `ai_provider_${selectedProvider}_max_tokens`, value: String(providerConfig.maxTokens) },
    ];

    // Only save API key if provided
    if (providerConfig.apiKey) {
      updates.push({ key: `ai_provider_${selectedProvider}_api_key`, value: providerConfig.apiKey });
    }

    for (const update of updates) {
      await (window as any).api.updateSetting(update.key, update.value);
    }

    onSettingsUpdate();
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Save config first
      await saveProviderConfig();

      // Test the provider
      const response = await (window as any).api.testAIProvider(selectedProvider);
      setTestResult(response.success ? 'success' : 'error');
    } catch (err) {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'configured':
        return <Badge variant="info" size="sm">Configured</Badge>;
      case 'disabled':
        return <Badge variant="muted" size="sm">Disabled</Badge>;
      default:
        return <Badge variant="warning" size="sm">Not Configured</Badge>;
    }
  };

  const getProviderIcon = (id: string) => {
    switch (id) {
      case 'native': return <Zap size={20} />;
      case 'openai': return <span style={{ fontWeight: 700 }}>AI</span>;
      case 'anthropic': return <span style={{ fontWeight: 700 }}>C</span>;
      case 'gemini': return <span style={{ fontWeight: 700 }}>G</span>;
      case 'grok': return <span style={{ fontWeight: 700 }}>X</span>;
      case 'openrouter': return <span style={{ fontWeight: 700 }}>OR</span>;
      default: return <Bot size={20} />;
    }
  };

  // Provider detail view
  if (selectedProvider) {
    const provider = providers.find(p => p.id === selectedProvider);
    if (!provider) return null;

    const providerModels: Record<string, string[]> = {
      native: ['local-model'],
      openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
      anthropic: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
      gemini: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      grok: ['grok-2', 'grok-2-mini'],
      openrouter: ['openai/gpt-4o', 'anthropic/claude-sonnet-4-20250514', 'google/gemini-2.0-flash-001'],
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <Button variant="ghost" size="sm" onClick={() => setSelectedProvider(null)} icon={<ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />} />
          <div style={{ color: 'var(--primary)' }}>{getProviderIcon(selectedProvider)}</div>
          <h3 style={{ margin: 0, fontSize: 'var(--text-xl)', fontWeight: 'var(--weight-bold)', color: 'var(--text-main)' }}>
            {provider.name}
          </h3>
          {getStatusBadge(provider.status)}
        </div>

        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-5)' }}>
          {provider.description}
        </p>

        <GlassPanel padding="var(--space-5)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* Enable/Disable */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-main)' }}>Enable Provider</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Turn this provider on or off</div>
              </div>
              <button
                onClick={() => setProviderConfig({ ...providerConfig, enabled: !providerConfig.enabled })}
                style={{
                  width: '48px',
                  height: '24px',
                  borderRadius: '12px',
                  background: providerConfig.enabled ? 'var(--primary)' : 'var(--border-strong)',
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'var(--transition-fast)',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: providerConfig.enabled ? '26px' : '2px',
                    transition: 'var(--transition-fast)',
                  }}
                />
              </button>
            </div>

            {/* API Key (if required) */}
            {provider.requiresApiKey && (
              <div>
                <SectionHeader style={{ marginBottom: 'var(--space-2)' }}>API Key</SectionHeader>
                <Input
                  type="password"
                  value={providerConfig.apiKey}
                  onChange={(e) => setProviderConfig({ ...providerConfig, apiKey: e.target.value })}
                  placeholder="Enter your API key..."
                />
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: 'var(--space-1)', display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                  <Shield size={10} /> Stored securely in your system's credential manager
                </div>
              </div>
            )}

            {/* Model Selection */}
            <div>
              <SectionHeader style={{ marginBottom: 'var(--space-2)' }}>Model</SectionHeader>
              <select
                value={providerConfig.model}
                onChange={(e) => setProviderConfig({ ...providerConfig, model: e.target.value })}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text-main)',
                  fontSize: 'var(--text-base)',
                  cursor: 'pointer',
                }}
              >
                {(providerModels[selectedProvider] || []).map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            {/* Temperature */}
            <div>
              <SectionHeader style={{ marginBottom: 'var(--space-2)' }}>Temperature</SectionHeader>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={providerConfig.temperature}
                  onChange={(e) => setProviderConfig({ ...providerConfig, temperature: parseFloat(e.target.value) })}
                  style={{ flex: 1, accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-main)', minWidth: '40px', textAlign: 'center' }}>
                  {providerConfig.temperature}
                </span>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Lower = more focused, Higher = more creative
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <SectionHeader style={{ marginBottom: 'var(--space-2)' }}>Max Tokens</SectionHeader>
              <Input
                type="number"
                value={providerConfig.maxTokens}
                onChange={(e) => setProviderConfig({ ...providerConfig, maxTokens: parseInt(e.target.value) || 2048 })}
                min="100"
                max="8192"
              />
            </div>

            {/* Test Connection */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <Button
                variant="secondary"
                onClick={handleTestConnection}
                disabled={testing || (provider.requiresApiKey && !providerConfig.apiKey)}
                icon={testing ? undefined : <Zap size={14} />}
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </Button>
              {testResult === 'success' && (
                <Badge variant="success" size="sm"><Check size={10} /> Connected</Badge>
              )}
              {testResult === 'error' && (
                <Badge variant="danger" size="sm"><X size={10} /> Failed</Badge>
              )}
            </div>

            {/* Save */}
            <Button variant="primary" onClick={saveProviderConfig} style={{ width: '100%' }}>
              Save Configuration
            </Button>
          </div>
        </GlassPanel>
      </motion.div>
    );
  }

  // Provider list view
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <GlassPanel padding="var(--space-5)">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div style={{ color: 'var(--primary)' }}><Bot size={20} /></div>
          <SectionHeader>AI Providers</SectionHeader>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
          Configure AI providers for assisted writing features. AI is optional — the app works perfectly without it.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {providers.map((provider) => (
            <motion.button
              key={provider.id}
              whileHover={{ backgroundColor: 'var(--card-bg-hover)' }}
              onClick={() => loadProviderConfig(provider.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: 'var(--space-4)',
                borderRadius: 'var(--radius-md)',
                background: 'transparent',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'var(--transition-fast)',
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                background: provider.status === 'active' ? 'var(--primary-light)' : 'var(--bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: provider.status === 'active' ? 'var(--primary)' : 'var(--text-muted)',
                flexShrink: 0,
              }}>
                {getProviderIcon(provider.id)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 'var(--weight-semibold)', color: 'var(--text-main)', fontSize: 'var(--text-base)' }}>
                  {provider.name}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {provider.description}
                </div>
              </div>
              {getStatusBadge(provider.status)}
              <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </motion.button>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
