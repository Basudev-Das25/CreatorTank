import { useState, useEffect } from "react";

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
    const [linkLabel, setLinkLabel] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [outputPath, setOutputPath] = useState<string | null>(null);

    const loadAssets = async () => {
        try {
            const result = await window.api.getAssets(ideaId);
            if (result.success && result.data) {
                setAssets(result.data);
            }

            // Also load idea details for output_path
            const ideaResult = await window.api.getIdea(ideaId);
            if (ideaResult.success && ideaResult.data) {
                setOutputPath(ideaResult.data.output_path || null);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadAssets();

        // Listen for refresh events
        const refreshCleanup = window.api.onAssetRefresh(() => {
            loadAssets();
        });

        // Listen for "Add Link" trigger from context menu
        const linkTriggerCleanup = window.api.onTriggerAddLink(() => {
            setIsLinkDialogOpen(true);
        });

        return () => {
            refreshCleanup();
            linkTriggerCleanup();
        };
    }, [ideaId]);

    const handleContextMenu = async (e: React.MouseEvent) => {
        e.preventDefault();
        await window.api.showAssetContextMenu(ideaId);
    };

    const handleAddLink = async () => {
        if (!linkUrl) return;
        await window.api.addLinkAsset(ideaId, linkLabel || linkUrl, linkUrl);
        setLinkLabel("");
        setLinkUrl("");
        setIsLinkDialogOpen(false);
        loadAssets();
    };

    const handleDelete = async (asset: Asset) => {
        if (confirm("Delete asset?")) {
            await window.api.deleteAsset(asset.id, asset.path_or_url, asset.type);
            loadAssets();
        }
    };

    const handleOpen = async (asset: Asset) => {
        await window.api.openAsset(asset.path_or_url);
    };

    const handlePickOutputPath = async () => {
        const res = await window.api.pickOutputPath();
        if (res.success && res.path) {
            const updateRes = await window.api.updateIdea(ideaId, { output_path: res.path });
            if (updateRes.success) {
                setOutputPath(res.path);
                // Trigger a refresh in Case other panels need to know
                window.dispatchEvent(new CustomEvent('idea-updated', { detail: { ideaId, output_path: res.path } }));
            }
        }
    };

    const handleClearOutputPath = async () => {
        const updateRes = await window.api.updateIdea(ideaId, { output_path: null });
        if (updateRes.success) {
            setOutputPath(null);
            window.dispatchEvent(new CustomEvent('idea-updated', { detail: { ideaId, output_path: null } }));
        }
    };

    const handleOpenOutputPath = () => {
        if (outputPath) window.api.openAsset(outputPath);
    };

    return (
        <div
            style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                borderLeft: "1px solid var(--border)",
                background: "var(--sidebar-bg)",
                height: "100%",
                position: "relative"
            }}
            onContextMenu={handleContextMenu}
        >
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--sidebar-bg)" }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>Assets</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Right-click to add</span>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
                {/* Final Output Section */}
                <div style={{
                    marginBottom: "24px",
                    padding: "16px",
                    background: outputPath ? "var(--primary-light)" : "var(--bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    transition: "var(--transition)"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "1px" }}>
                            Final Output
                        </span>
                        {outputPath && (
                            <button
                                onClick={handleClearOutputPath}
                                style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.7rem", cursor: "pointer", fontWeight: 700 }}
                            >
                                CLEAR
                            </button>
                        )}
                    </div>

                    {outputPath ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{
                                fontSize: "0.85rem",
                                color: "var(--text-main)",
                                fontWeight: 600,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                            }} title={outputPath}>
                                🎬 {outputPath.split(/[\\/]/).pop()}
                            </div>
                            <button
                                onClick={handleOpenOutputPath}
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    background: "var(--primary)",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "0.8rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "6px"
                                }}
                            >
                                🚀 Launch Result
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handlePickOutputPath}
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: "2px dashed var(--border)",
                                background: "none",
                                borderRadius: "8px",
                                color: "var(--text-muted)",
                                fontSize: "0.8rem",
                                cursor: "pointer",
                                fontWeight: 700,
                                transition: "var(--transition)"
                            }}
                            className="pick-path-btn-panel"
                        >
                            + Link Final Export
                        </button>
                    )}
                </div>

                <div style={{ height: "1px", background: "var(--border)", margin: "0 0 24px 0", opacity: 0.5 }} />

                {assets.length === 0 ? (
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "100%",
                        color: "var(--text-muted)",
                        textAlign: "center",
                        padding: "20px"
                    }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: "16px", opacity: 0.3 }}>📁</div>
                        <p style={{ fontSize: "0.85rem", margin: 0 }}>No assets yet.</p>
                        <p style={{ fontSize: "0.75rem", marginTop: "8px" }}>Right-click anywhere here<br />to add files or links.</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {assets.map(asset => (
                            <div key={asset.id} style={{
                                padding: "12px",
                                background: "var(--card-bg)",
                                border: "1px solid var(--border)",
                                borderRadius: "10px",
                                fontSize: "0.9rem",
                                transition: "var(--transition)",
                                boxShadow: "var(--shadow)",
                                position: "relative"
                            }} className="asset-card">
                                <div style={{ display: "flex", alignItems: "center", marginBottom: asset.type === 'image' ? "10px" : "0" }}>
                                    <div
                                        onClick={() => handleOpen(asset)}
                                        style={{
                                            flex: 1,
                                            cursor: "pointer",
                                            color: "var(--text-main)",
                                            fontWeight: 600,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                            paddingRight: "20px"
                                        }}
                                        title={asset.path_or_url}
                                    >
                                        {asset.type === 'link' ? '🔗' : '📄'} {asset.label}
                                    </div>
                                    <button
                                        onClick={() => handleDelete(asset)}
                                        style={{
                                            color: "#94a3b8",
                                            border: "none",
                                            background: "none",
                                            cursor: "pointer",
                                            fontSize: "1.2rem",
                                            padding: "0 4px",
                                            display: "flex",
                                            alignItems: "center",
                                            opacity: 0.5
                                        }}
                                        className="delete-asset-btn"
                                    >
                                        &times;
                                    </button>
                                </div>

                                {asset.type === 'image' && (
                                    <div
                                        onClick={() => handleOpen(asset)}
                                        style={{
                                            height: "140px",
                                            background: "var(--bg)",
                                            backgroundImage: `url('${asset.url}')`,
                                            backgroundSize: "cover",
                                            backgroundPosition: "center",
                                            cursor: "pointer",
                                            borderRadius: "6px",
                                            border: "1px solid var(--border)"
                                        }}
                                    />
                                )}

                                {asset.type === 'link' && (
                                    <div style={{
                                        fontSize: "0.75rem",
                                        color: "var(--primary)",
                                        textDecoration: "underline",
                                        marginTop: "4px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        cursor: "pointer"
                                    }} onClick={() => handleOpen(asset)}>
                                        {asset.path_or_url}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Link Dialog */}
            {isLinkDialogOpen && (
                <div style={{
                    position: "absolute",
                    inset: 0,
                    background: "var(--sidebar-bg)",
                    zIndex: 10,
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    animation: "fadeIn 0.2s ease-out"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ margin: 0, fontSize: "1rem", color: "var(--text-main)" }}>Add Web Link</h3>
                        <button onClick={() => setIsLinkDialogOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#94a3b8" }}>&times;</button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div>
                            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Title / Label</label>
                            <input
                                autoFocus
                                value={linkLabel}
                                onChange={e => setLinkLabel(e.target.value)}
                                placeholder="My Reference"
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border)",
                                    background: "var(--card-bg)",
                                    color: "var(--text-main)",
                                    fontSize: "0.9rem",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>URL</label>
                            <input
                                value={linkUrl}
                                onChange={e => setLinkUrl(e.target.value)}
                                placeholder="https://..."
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border)",
                                    background: "var(--card-bg)",
                                    color: "var(--text-main)",
                                    fontSize: "0.9rem",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>
                        <div style={{ marginTop: "10px", display: "flex", gap: "8px" }}>
                            <button
                                onClick={handleAddLink}
                                disabled={!linkUrl}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    background: linkUrl ? "var(--primary)" : "#cbd5e1",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 700,
                                    cursor: "pointer"
                                }}
                            >
                                Add Asset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>
                {`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .asset-card:hover .delete-asset-btn { opacity: 1 !important; color: #ef4444 !important; }
                .pick-path-btn-panel:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
                `}
            </style>
        </div>
    );
}
