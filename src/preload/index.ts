import { contextBridge, ipcRenderer } from "electron";

// Custom APIs for renderer
const api = {
    // Projects
    createProject: (name: string, platform?: string): Promise<any> =>
        ipcRenderer.invoke("projects:create", { name, platform }),
    updateProject: (id: number, updates: any): Promise<any> =>
        ipcRenderer.invoke("projects:update", { id, ...updates }),

    getAllProjects: (): Promise<any> =>
        ipcRenderer.invoke("projects:get-all"),

    deleteProject: (id: number): Promise<any> =>
        ipcRenderer.invoke("projects:delete", id),

    // Ideas
    createIdea: (projectId: number, title: string, description?: string, priority?: string): Promise<any> =>
        ipcRenderer.invoke("ideas:create", { projectId, title, description, priority }),

    getIdeasByProject: (projectId: number): Promise<any> =>
        ipcRenderer.invoke("ideas:get-by-project", projectId),

    updateIdea: (id: number, data: any): Promise<any> =>
        ipcRenderer.invoke("ideas:update", { id, ...data }),

    deleteIdea: (id: number): Promise<any> =>
        ipcRenderer.invoke("ideas:delete", id),

    pickOutputPath: (): Promise<any> =>
        ipcRenderer.invoke("ideas:pick-output-path"),

    getIdea: (id: number): Promise<any> =>
        ipcRenderer.invoke("ideas:get", id),

    // Scripts
    getScript: (ideaId: number): Promise<any> => ipcRenderer.invoke("scripts:get", ideaId),
    saveScript: (ideaId: number, content: string, notes: string | null, wordCount: number): Promise<any> => ipcRenderer.invoke("scripts:save", { ideaId, content, notes, wordCount }),

    // Assets
    addFileAsset: (ideaId: number): Promise<any> => ipcRenderer.invoke("assets:add-file", ideaId),
    addLinkAsset: (ideaId: number, label: string, url: string): Promise<any> => ipcRenderer.invoke("assets:add-link", { ideaId, label, url }),
    getAssets: (ideaId: number): Promise<any> => ipcRenderer.invoke("assets:get-by-idea", ideaId),
    deleteAsset: (id: number, path: string, type: string): Promise<any> => ipcRenderer.invoke("assets:delete", { id, path, type }),
    openAsset: (path: string): Promise<any> => ipcRenderer.invoke("assets:open", path),
    showAssetContextMenu: (ideaId: number): Promise<any> => ipcRenderer.invoke("assets:context-menu", ideaId),
    onAssetRefresh: (callback: () => void) => {
        const handler = () => callback();
        ipcRenderer.on("assets:refresh", handler);
        return () => ipcRenderer.off("assets:refresh", handler);
    },
    onTriggerAddLink: (callback: () => void) => {
        const handler = () => callback();
        ipcRenderer.on("assets:trigger-add-link", handler);
        return () => ipcRenderer.off("assets:trigger-add-link", handler);
    },

    // --- PHASE 4: BACKUP, RESTORE, EXPORT, SEARCH ---
    searchAll: (query: string): Promise<any> => ipcRenderer.invoke("search:all", query),
    createBackup: (): Promise<any> => ipcRenderer.invoke("backup:create"),
    restoreBackup: (): Promise<any> => ipcRenderer.invoke("backup:restore"),
    exportScript: (title: string, content: string, format: 'txt' | 'md'): Promise<any> =>
        ipcRenderer.invoke("export:script", { title, content, format }),
    exportMetadata: (data: any[], format: 'json' | 'csv', filename: string): Promise<any> =>
        ipcRenderer.invoke("export:metadata", { data, format, filename }),
    reindexSearch: (): Promise<any> =>
        ipcRenderer.invoke("search:reindex"),

    // --- PHASE 5: CALENDAR & WORKFLOW ---
    getScheduledIdeas: (): Promise<any> => ipcRenderer.invoke("ideas:get-scheduled"),

    // Settings
    getSettings: (): Promise<any> => ipcRenderer.invoke("settings:get-all"),
    updateSetting: (key: string, value: string): Promise<any> => ipcRenderer.invoke("settings:update", { key, value })
};

// Use contextBridge to expose the API to the renderer
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld("api", api);
    } catch (error) {
        console.error(error);
    }
} else {
    // Fallback for non-isolated contexts (not recommended for production)
    // @ts-ignore (define in d.ts)
    window.api = api;
}
