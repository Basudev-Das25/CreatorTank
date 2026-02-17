/// <reference types="vite/client" />

interface Window {
    api: {
        // Projects
        createProject: (name: string, platform?: string) => Promise<{ success: boolean; id?: number; error?: string }>;
        updateProject: (id: number, updates: any) => Promise<{ success: boolean; error?: string }>;
        getAllProjects: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
        deleteProject: (id: number) => Promise<{ success: boolean; error?: string }>;

        // Ideas
        createIdea: (projectId: number, title: string, description?: string, priority?: string) => Promise<{ success: boolean; id?: number; error?: string }>;
        getIdeasByProject: (projectId: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
        updateIdea: (id: number, data: any) => Promise<{ success: boolean; error?: string }>;
        deleteIdea: (id: number) => Promise<{ success: boolean; error?: string }>;
        pickOutputPath: () => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
        getIdea: (id: number) => Promise<{ success: boolean; data?: any; error?: string }>;
        // Scripts
        getScript: (ideaId: number) => Promise<{ success: boolean; data?: any; error?: string }>;
        saveScript: (ideaId: number, content: string, notes: string | null, wordCount: number) => Promise<{ success: boolean; error?: string }>;

        // Assets
        addFileAsset: (ideaId: number) => Promise<{ success: boolean; id?: number; path?: string; type?: string; canceled?: boolean; error?: string }>;
        addLinkAsset: (ideaId: number, label: string, url: string) => Promise<{ success: boolean; id?: number; error?: string }>;
        getAssets: (ideaId: number) => Promise<{ success: boolean; data?: any[]; error?: string }>;
        deleteAsset: (id: number, path: string, type: string) => Promise<{ success: boolean; error?: string }>;
        openAsset: (path: string) => Promise<{ success: boolean; error?: string }>;
        showAssetContextMenu: (ideaId: number) => Promise<{ success: boolean }>;
        onAssetRefresh: (callback: () => void) => () => void;
        onTriggerAddLink: (callback: () => void) => () => void;

        // --- PHASE 4: BACKUP, RESTORE, EXPORT, SEARCH ---
        searchAll: (query: string) => Promise<{ success: boolean; data?: any[]; error?: string }>;
        reindexSearch: () => Promise<{ success: boolean; error?: string }>;
        createBackup: () => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
        restoreBackup: () => Promise<{ success: boolean; canceled?: boolean; error?: string }>;
        exportScript: (title: string, content: string, format: 'txt' | 'md') => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;
        exportMetadata: (data: any[], format: 'json' | 'csv', filename: string) => Promise<{ success: boolean; path?: string; canceled?: boolean; error?: string }>;

        // --- PHASE 5: CALENDAR & WORKFLOW ---
        getScheduledIdeas: () => Promise<{ success: boolean; data?: any[]; error?: string }>;

        // Settings
        getSettings: () => Promise<{ success: boolean; data?: any; error?: string }>;
        updateSetting: (key: string, value: string) => Promise<{ success: boolean; error?: string }>;
    };
}
