import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, Link, FileText, X, Trash2, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { SectionHeader } from './ui/SectionHeader';
import { EmptyState } from './ui/EmptyState';
import { listItem } from '../lib/animations';

interface Asset {
  id: number;
  type: 'image' | 'file' | 'link';
  label: string;
  path_or_url: string;
  url?: string;
}

interface AssetPanelProps {
  ideaId: number;
}

export function AssetPanel({ ideaId }: AssetPanelProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [outputPath, setOutputPath] = useState<string | null>(null);

  const loadAssets = async () => {
    try {
      const result = await (window as any).api.getAssets(ideaId);
      if (result.success && result.data) {
        setAssets(result.data);
      }
      const ideaResult = await (window as any).api.getIdea(ideaId);
      if (ideaResult.success && ideaResult.data) {
        setOutputPath(ideaResult.data.output_path || null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAssets();
    const refreshCleanup = (window as any).api.onAssetRefresh(() => loadAssets());
    const linkTriggerCleanup = (window as any).api.onTriggerAddLink(() => setIsLinkDialogOpen(true));
    return () => {
      refreshCleanup();
      linkTriggerCleanup();
    };
  }, [ideaId]);

  const handleContextMenu = async (e: React.MouseEvent) => {
    e.preventDefault();
    await (window as any).api.showAssetContextMenu(ideaId);
  };

  const handleAddLink = async () => {
    if (!linkUrl) return;
    await (window as any).api.addLinkAsset(ideaId, linkLabel || linkUrl, linkUrl);
    setLinkLabel('');
    setLinkUrl('');
    setIsLinkDialogOpen(false);
    loadAssets();
  };

  const handleDelete = async (asset: Asset) => {
    if (confirm('Delete asset?')) {
      await (window as any).api.deleteAsset(asset.id, asset.path_or_url, asset.type);
      loadAssets();
    }
  };

  const handleOpen = async (asset: Asset) => {
    await (window as any).api.openAsset(asset.path_or_url);
  };

  const handlePickOutputPath = async () => {
    const res = await (window as any).api.pickOutputPath();
    if (res.success && res.path) {
      const updateRes = await (window as any).api.updateIdea(ideaId, { output_path: res.path });
      if (updateRes.success) {
        setOutputPath(res.path);
        window.dispatchEvent(new CustomEvent('idea-updated', { detail: { ideaId, output_path: res.path } }));
      }
    }
  };

  const handleClearOutputPath = async () => {
    const updateRes = await (window as any).api.updateIdea(ideaId, { output_path: null });
    if (updateRes.success) {
      setOutputPath(null);
      window.dispatchEvent(new CustomEvent('idea-updated', { detail: { ideaId, output_path: null } }));
    }
  };

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--border)',
        background: 'var(--sidebar-bg)',
        height: '100%',
        position: 'relative',
      }}
      onContextMenu={handleContextMenu}
    >
      {/* Header */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontWeight: 'var(--weight-bold)', fontSize: 'var(--text-base)', color: 'var(--text-main)' }}>
          Assets
        </span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Right-click to add</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)' }}>
        {/* Final Output */}
        <div
          style={{
            marginBottom: 'var(--space-5)',
            padding: 'var(--space-4)',
            background: outputPath ? 'var(--primary-light)' : 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            transition: 'var(--transition-fast)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
            <SectionHeader>Final Output</SectionHeader>
            {outputPath && (
              <Button variant="ghost" size="sm" onClick={handleClearOutputPath} style={{ color: 'var(--danger)', fontSize: 'var(--text-xs)' }}>
                CLEAR
              </Button>
            )}
          </div>

          {outputPath ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-main)',
                  fontWeight: 'var(--weight-semibold)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                }}
                title={outputPath}
              >
                <FileText size={14} />
                {outputPath.split(/[\\/]/).pop()}
              </div>
              <Button variant="primary" size="sm" onClick={() => (window as any).api.openAsset(outputPath)} icon={<ExternalLink size={14} />} style={{ width: '100%' }}>
                Launch Result
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePickOutputPath}
              style={{ width: '100%', border: '2px dashed var(--border)', color: 'var(--text-muted)' }}
            >
              + Link Final Export
            </Button>
          )}
        </div>

        <div style={{ height: '1px', background: 'var(--border)', margin: '0 0 var(--space-5)' }} />

        {/* Assets List */}
        {assets.length === 0 ? (
          <EmptyState
            icon={<FolderOpen size={24} />}
            title="No assets yet"
            description="Right-click anywhere here to add files or links"
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <AnimatePresence>
              {assets.map((asset) => (
                <motion.div
                  key={asset.id}
                  layout
                  initial={listItem.initial}
                  animate={listItem.animate}
                  exit={{ opacity: 0, x: -16 }}
                  whileHover={{ backgroundColor: 'var(--card-bg-hover)' }}
                  style={{
                    padding: 'var(--space-3)',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    transition: 'var(--transition-fast)',
                    position: 'relative',
                  }}
                  className="asset-card"
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: asset.type === 'image' ? 'var(--space-3)' : '0' }}>
                    <div
                      onClick={() => handleOpen(asset)}
                      style={{
                        flex: 1,
                        cursor: 'pointer',
                        color: 'var(--text-main)',
                        fontWeight: 'var(--weight-semibold)',
                        fontSize: 'var(--text-base)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        paddingRight: 'var(--space-5)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                      }}
                      title={asset.path_or_url}
                    >
                      {asset.type === 'link' ? <Link size={14} /> : <FileText size={14} />}
                      {asset.label}
                    </div>
                    <button
                      onClick={() => handleDelete(asset)}
                      className="delete-asset-btn"
                      style={{
                        color: 'var(--text-muted)',
                        border: 'none',
                        background: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        opacity: 0.5,
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {asset.type === 'image' && (
                    <div
                      onClick={() => handleOpen(asset)}
                      style={{
                        height: '120px',
                        background: 'var(--bg)',
                        backgroundImage: `url('${asset.url}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                      }}
                    />
                  )}

                  {asset.type === 'link' && (
                    <div
                      style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--primary)',
                        textDecoration: 'underline',
                        marginTop: 'var(--space-1)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleOpen(asset)}
                    >
                      {asset.path_or_url}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Link Dialog */}
      <AnimatePresence>
        {isLinkDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--sidebar-bg)',
              zIndex: 10,
              padding: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--text-md)', color: 'var(--text-main)', fontWeight: 'var(--weight-semibold)' }}>
                Add Web Link
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setIsLinkDialogOpen(false)} icon={<X size={16} />} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--text-muted)', display: 'block', marginBottom: 'var(--space-2)' }}>
                  Title / Label
                </label>
                <Input
                  autoFocus
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="My Reference"
                />
              </div>
              <div>
                <label style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-bold)', color: 'var(--text-muted)', display: 'block', marginBottom: 'var(--space-2)' }}>
                  URL
                </label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div style={{ marginTop: 'var(--space-2)' }}>
                <Button variant="primary" onClick={handleAddLink} disabled={!linkUrl} style={{ width: '100%', opacity: linkUrl ? 1 : 0.5 }}>
                  Add Asset
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .asset-card:hover .delete-asset-btn { opacity: 1 !important; color: var(--danger) !important; }
      `}</style>
    </div>
  );
}
