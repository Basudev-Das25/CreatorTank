import { app, shell, BrowserWindow, ipcMain, dialog, Menu, MenuItem } from "electron";
import { join, basename } from "path";
import fs from "fs";
import {
    initDB, runAll, runRun, runGet,
    searchContent, rebuildSearchIndex
} from "./db";

let mainWindow: BrowserWindow | null = null;
// const ASSETS_DIR = join(app.getPath("userData"), "assets"); // This is now handled internally by ensureAssetDir

// Helper to ensure asset directory for an idea
function ensureAssetDir(ideaId: number): string {
    const assetRoot = join(app.getPath("userData"), "assets");
    if (!fs.existsSync(assetRoot)) fs.mkdirSync(assetRoot, { recursive: true });
    const ideaDir = join(assetRoot, ideaId.toString());
    if (!fs.existsSync(ideaDir)) fs.mkdirSync(ideaDir, { recursive: true });
    return ideaDir;
}

// Utility to copy directory recursively
function copyFolderSync(from: string, to: string) {
    if (!fs.existsSync(from)) return;
    if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
    fs.readdirSync(from).forEach(element => {
        if (fs.lstatSync(join(from, element)).isFile()) {
            fs.copyFileSync(join(from, element), join(to, element));
        } else {
            copyFolderSync(join(from, element), join(to, element));
        }
    });
}

function getIconPath(): string {
    if (app.isPackaged) {
        // In production, icon is in the resources directory
        return join(process.resourcesPath, "icon.png");
    }
    // In development, icon is in the project's resources folder
    return join(__dirname, "../../resources/icon.png");
}

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        icon: getIconPath(),
        webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            sandbox: false,
            contextIsolation: true, // Secure context isolation
            nodeIntegration: false, // Security best practice
        },
    });

    mainWindow.on("ready-to-show", () => {
        mainWindow?.show();
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: "deny" };
    });

    // HMR for renderer base.
    // We check process.env['ELECTRON_RENDERER_URL'] which electron-vite sets in dev
    if (process.env["ELECTRON_RENDERER_URL"]) {
        mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    } else {
        mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
    }
}

// Database IPC Handlers
function setupIPC() {
    // Projects
    ipcMain.handle("projects:create", async (_, { name, platform }) => {
        try {
            const result = runRun("INSERT INTO projects (name, platform) VALUES (?, ?)", [name, platform || 'Custom']);
            return { success: true, id: result.id };
        } catch (error) {
            console.error("Failed to create project:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("projects:get-all", () => {
        try {
            const rows = runAll(`
                SELECT p.*,
    (SELECT COUNT(*) FROM ideas i WHERE i.project_id = p.id) as idea_count,
        (SELECT MAX(COALESCE(s.updated_at, i.created_at, p.created_at)) 
                 FROM ideas i 
                 LEFT JOIN scripts s ON s.idea_id = i.id 
                 WHERE i.project_id = p.id) as last_activity
                FROM projects p 
                ORDER BY created_at DESC
            `);
            const enriched = rows.map((r: any) => ({
                ...r,
                last_activity: r.last_activity || r.created_at
            }));
            return { success: true, data: enriched };
        } catch (error) {
            console.error("Failed to get projects:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("projects:delete", async (_, id) => {
        try {
            runRun("DELETE FROM projects WHERE id = ?", [id]);
            return { success: true };
        } catch (error) {
            console.error("Failed to delete project:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("projects:update", async (_, { id, ...updates }) => {
        try {
            const keys = Object.keys(updates);
            if (keys.length === 0) return { success: true };

            const setClause = keys.map(k => `${k} = ?`).join(", ");
            const values = keys.map(k => updates[k]);

            runRun(
                `UPDATE projects SET ${setClause} WHERE id = ? `,
                [...values, id]
            );
            return { success: true };
        } catch (error) {
            console.error("Failed to update project:", error);
            return { success: false, error: String(error) };
        }
    });

    // Ideas
    ipcMain.handle("ideas:create", async (_, { projectId, title, description, priority }) => {
        try {
            const result = runRun(
                "INSERT INTO ideas (project_id, title, description, priority) VALUES (?, ?, ?, ?)",
                [projectId, title, description, priority || 'medium']
            );
            return { success: true, id: result.id };
        } catch (error) {
            console.error("Failed to create idea:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("ideas:get-by-project", (_, projectId) => {
        try {
            const rows = runAll("SELECT * FROM ideas WHERE project_id = ? ORDER BY created_at DESC", [projectId]);
            return { success: true, data: rows };
        } catch (error) {
            console.error("Failed to get ideas:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("ideas:get", (_, id) => {
        try {
            const row = runGet("SELECT * FROM ideas WHERE id = ?", [id]);
            return { success: true, data: row };
        } catch (error) {
            console.error("Failed to get idea:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("ideas:update", async (_, { id, ...updates }) => {
        try {
            const keys = Object.keys(updates);
            if (keys.length === 0) return { success: true };

            const setClause = keys.map(k => `${k} = ?`).join(", ");
            const values = keys.map(k => updates[k]);

            runRun(
                `UPDATE ideas SET ${setClause} WHERE id = ? `,
                [...values, id]
            );
            return { success: true };
        } catch (error) {
            console.error("Failed to update idea:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("ideas:get-scheduled", () => {
        try {
            // Get ideas and projects that are scheduled
            const rows = runAll(`
                SELECT
'idea' as type,
    i.id,
    i.project_id,
    i.title,
    i.scheduled_date,
    i.scheduled_time,
    i.workflow_stage,
    p.name as project_name,
    p.platform as project_platform 
                FROM ideas i 
                JOIN projects p ON i.project_id = p.id 
                WHERE i.scheduled_date IS NOT NULL 
                
                UNION ALL

SELECT
'project' as type,
    p.id,
    p.id as project_id,
    p.name as title,
    p.scheduled_date,
    p.scheduled_time,
    'project' as workflow_stage,
    p.name as project_name,
    p.platform as project_platform
                FROM projects p
                WHERE p.scheduled_date IS NOT NULL
                
                ORDER BY scheduled_date ASC, scheduled_time ASC
            `);
            return { success: true, data: rows };
        } catch (error) {
            console.error("Failed to get scheduled items:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("ideas:delete", async (_, id) => {
        try {
            runRun("DELETE FROM ideas WHERE id = ?", [id]);
            return { success: true };
        } catch (error) {
            console.error("Failed to delete idea:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("ideas:pick-output-path", async () => {
        try {
            const { canceled, filePaths } = await dialog.showOpenDialog({
                properties: ["openFile"],
                title: "Select Final Output File"
            });
            if (canceled || filePaths.length === 0) return { success: false, canceled: true };
            return { success: true, path: filePaths[0] };
        } catch (error) {
            console.error("Failed to pick output path:", error);
            return { success: false, error: String(error) };
        }
    });

    // Scripts
    ipcMain.handle("scripts:save", async (_, { ideaId, content, notes, wordCount }) => {
        try {
            const existing = runGet("SELECT id FROM scripts WHERE idea_id = ?", [ideaId]);
            if (existing) {
                runRun("UPDATE scripts SET content = ?, notes = ?, word_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [content, notes, wordCount, existing.id]);
            } else {
                runRun("INSERT INTO scripts (idea_id, content, notes, word_count) VALUES (?, ?, ?, ?)", [ideaId, content, notes, wordCount]);
            }
            return { success: true };
        } catch (error) {
            console.error("Failed to save script:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("scripts:get", async (_, ideaId) => {
        try {
            const script = runGet("SELECT * FROM scripts WHERE idea_id = ?", [ideaId]);
            return { success: true, data: script };
        } catch (error) {
            console.error("Failed to get script:", error);
            return { success: false, error: String(error) };
        }
    });

    // Assets
    ipcMain.handle("assets:add-file", async (_, ideaId) => {
        try {
            const { canceled, filePaths } = await dialog.showOpenDialog({
                properties: ["openFile"],
            });
            if (canceled || filePaths.length === 0) return { success: false, canceled: true };

            const filePath = filePaths[0];
            const fileName = basename(filePath);
            const destDir = ensureAssetDir(ideaId);
            const destPath = join(destDir, fileName);

            // Copy file
            fs.copyFileSync(filePath, destPath);

            // Determine type
            const ext = fileName.split('.').pop()?.toLowerCase();
            const type = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '') ? 'image' : 'file';

            const result = runRun("INSERT INTO assets (idea_id, type, label, path_or_url) VALUES (?, ?, ?, ?)",
                [ideaId, type, fileName, destPath]);

            return { success: true, id: result.id, path: destPath, type };
        } catch (error) {
            console.error("Failed to add file asset:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("assets:add-link", async (_, { ideaId, label, url }) => {
        try {
            const result = runRun("INSERT INTO assets (idea_id, type, label, path_or_url) VALUES (?, 'link', ?, ?)",
                [ideaId, label, url]);
            return { success: true, id: result.id };
        } catch (error) {
            console.error("Failed to add link asset:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("assets:get-by-idea", (_, ideaId) => {
        try {
            const rows = runAll("SELECT * FROM assets WHERE idea_id = ? ORDER BY created_at DESC", [ideaId]);
            // Normalize paths for valid file:// URLs if needed, but renderer handles local access with caveats. 
            // Actually, Electron Security Policy might block local file access from renderer directly.
            // We often need a custom protocol or just use the IPC to read/open.
            // For images, we can convert path to file:// protocol in renderer if webSecurity is false (not recommended) or use a protocol handler.
            // For now, allowing file:// access in dev via security policy (Phase 1 had it loose).
            const assets = rows.map((r: any) => ({
                ...r,
                url: r.type === 'link' ? r.path_or_url : `file://${r.path_or_url.replace(/\\/g, '/')}`
            }));
            return { success: true, data: assets };
        } catch (error) {
            console.error("Failed to get assets:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("assets:delete", (_, { id, path, type }) => {
        try {
            runRun("DELETE FROM assets WHERE id = ?", [id]);
            if (type !== 'link' && path) {
                try {
                    const p = path.startsWith('file://') ? path.replace('file://', '') : path;
                    if (fs.existsSync(p)) fs.unlinkSync(p);
                } catch (e) { console.warn("Could not delete file:", e); }
            }
            return { success: true };
        } catch (error) {
            console.error("Failed to delete asset:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("assets:open", (_, path) => {
        shell.openPath(path);
        return { success: true };
    });

    ipcMain.handle("assets:context-menu", async (_, ideaId) => {
        const menu = new Menu();
        menu.append(new MenuItem({
            label: 'Add File / Image',
            click: async () => {
                try {
                    const { canceled, filePaths } = await dialog.showOpenDialog({
                        properties: ["openFile"],
                    });
                    if (canceled || filePaths.length === 0) return;

                    const filePath = filePaths[0];
                    const fileName = basename(filePath);
                    const destDir = ensureAssetDir(ideaId);
                    const destPath = join(destDir, fileName);

                    fs.copyFileSync(filePath, destPath);

                    const ext = fileName.split('.').pop()?.toLowerCase();
                    const type = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '') ? 'image' : 'file';

                    runRun("INSERT INTO assets (idea_id, type, label, path_or_url) VALUES (?, ?, ?, ?)",
                        [ideaId, type, fileName, destPath]);

                    mainWindow?.webContents.send("assets:refresh");
                } catch (e) {
                    console.error("Context menu add file error:", e);
                }
            }
        }));

        menu.append(new MenuItem({
            label: 'Add Web Link',
            click: () => {
                mainWindow?.webContents.send("assets:trigger-add-link");
            }
        }));
        menu.popup();
        return { success: true };
    });

    // --- PHASE 4: BACKUP, RESTORE, EXPORT, SEARCH ---

    ipcMain.handle("search:all", async (_, query) => {
        try {
            const results = searchContent(query);
            return { success: true, data: results };
        } catch (error) {
            console.error("Search error:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("search:reindex", async () => {
        try {
            rebuildSearchIndex();
            return { success: true };
        } catch (error) {
            console.error("Reindex error:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("backup:create", async () => {
        try {
            const { canceled, filePaths } = await dialog.showOpenDialog({
                properties: ["openDirectory", "createDirectory"],
                title: "Select Backup Location"
            });
            if (canceled || filePaths.length === 0) return { success: false, canceled: true };

            const baseDir = filePaths[0];
            const dateStr = new Date().toISOString().split('T')[0];
            const backupName = `CreatorVault_Backup_${dateStr}_${Date.now()}`;
            const backupPath = join(baseDir, backupName);

            if (!fs.existsSync(backupPath)) fs.mkdirSync(backupPath, { recursive: true });

            const dbPath = join(app.getPath("userData"), "database.sqlite");
            const assetPath = join(app.getPath("userData"), "assets");

            // Copy Database
            if (fs.existsSync(dbPath)) {
                fs.copyFileSync(dbPath, join(backupPath, "database.sqlite"));
            }

            // Copy Assets
            if (fs.existsSync(assetPath)) {
                copyFolderSync(assetPath, join(backupPath, "assets"));
            }

            // Metadata
            const meta = {
                version: app.getVersion(),
                timestamp: new Date().toISOString(),
                type: "CreatorTank_Backup"
            };
            fs.writeFileSync(join(backupPath, "metadata.json"), JSON.stringify(meta, null, 2));

            return { success: true, path: backupPath };
        } catch (error) {
            console.error("Backup failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("backup:restore", async () => {
        try {
            const { canceled, filePaths } = await dialog.showOpenDialog({
                properties: ["openDirectory"],
                title: "Select Backup Folder to Restore from"
            });
            if (canceled || filePaths.length === 0) return { success: false, canceled: true };

            const backupPath = filePaths[0];
            const dbBackup = join(backupPath, "database.sqlite");
            const assetBackup = join(backupPath, "assets");

            // Validation
            if (!fs.existsSync(dbBackup)) {
                return { success: false, error: "Invalid backup folder: database.sqlite not found." };
            }

            const confirm = await dialog.showMessageBox({
                type: "warning",
                buttons: ["Cancel", "Overwrite and Restore"],
                title: "Confirm Restore",
                message: "This will OVERWRITE all current data. Are you sure?",
                detail: "The application will restart after restoration."
            });

            if (confirm.response === 0) return { success: false, canceled: true };

            const userData = app.getPath("userData");

            // Clean current assets? Maybe safer to just overwrite
            // Overwrite DB
            fs.copyFileSync(dbBackup, join(userData, "database.sqlite"));

            // Overwrite Assets
            if (fs.existsSync(assetBackup)) {
                copyFolderSync(assetBackup, join(userData, "assets"));
            }

            // Restart
            app.relaunch();
            app.exit();

            return { success: true };
        } catch (error) {
            console.error("Restore failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("export:script", async (_, { title, content, format }) => {
        try {
            const { canceled, filePath } = await dialog.showSaveDialog({
                defaultPath: `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}`,
                filters: [
                    { name: format.toUpperCase(), extensions: [format] }
                ]
            });
            if (canceled || !filePath) return { success: false, canceled: true };

            fs.writeFileSync(filePath, content);
            return { success: true, path: filePath };
        } catch (error) {
            console.error("Export script failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("export:metadata", async (_, { data, format, filename }) => {
        try {
            const { canceled, filePath } = await dialog.showSaveDialog({
                defaultPath: `${filename}.${format}`,
                filters: [
                    { name: format.toUpperCase(), extensions: [format] }
                ]
            });
            if (canceled || !filePath) return { success: false, canceled: true };

            let output = "";
            if (format === 'json') {
                output = JSON.stringify(data, null, 2);
            } else if (format === 'csv') {
                if (data.length > 0) {
                    const headers = Object.keys(data[0]).join(",");
                    const rows = data.map((row: any) =>
                        Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
                    ).join("\n");
                    output = `${headers}\n${rows}`;
                }
            }

            fs.writeFileSync(filePath, output);
            return { success: true, path: filePath };
        } catch (error) {
            console.error("Export metadata failed:", error);
            return { success: false, error: String(error) };
        }
    });

    // --- INBOX ---
    ipcMain.handle("inbox:create", (_, { title, note }) => {
        try {
            const result = runRun("INSERT INTO inbox_items (title, note) VALUES (?, ?)", [title, note || null]);
            return { success: true, id: result.id };
        } catch (error) {
            console.error("Failed to create inbox item:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("inbox:get-all", () => {
        try {
            const rows = runAll("SELECT * FROM inbox_items ORDER BY created_at DESC");
            return { success: true, data: rows };
        } catch (error) {
            console.error("Failed to get inbox items:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("inbox:update", (_, { id, ...updates }) => {
        try {
            const keys = Object.keys(updates);
            if (keys.length === 0) return { success: true };
            const setClause = keys.map(k => `${k} = ?`).join(", ");
            const values = keys.map(k => updates[k]);
            runRun(`UPDATE inbox_items SET ${setClause} WHERE id = ?`, [...values, id]);
            return { success: true };
        } catch (error) {
            console.error("Failed to update inbox item:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("inbox:delete", (_, id) => {
        try {
            runRun("DELETE FROM inbox_items WHERE id = ?", [id]);
            return { success: true };
        } catch (error) {
            console.error("Failed to delete inbox item:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("inbox:convert", async (_, { id, projectId }) => {
        try {
            const item = runGet("SELECT * FROM inbox_items WHERE id = ?", [id]);
            if (!item) return { success: false, error: "Inbox item not found" };
            const ideaResult = runRun(
                "INSERT INTO ideas (project_id, title, description, priority) VALUES (?, ?, ?, ?)",
                [projectId, item.title, item.note || '', 'medium']
            );
            runRun("DELETE FROM inbox_items WHERE id = ?", [id]);
            return { success: true, ideaId: ideaResult.id };
        } catch (error) {
            console.error("Failed to convert inbox item:", error);
            return { success: false, error: String(error) };
        }
    });

    // --- CHECKLISTS ---
    ipcMain.handle("checklists:get-by-idea", (_, ideaId) => {
        try {
            const rows = runAll("SELECT * FROM checklists WHERE idea_id = ? ORDER BY position ASC", [ideaId]);
            return { success: true, data: rows };
        } catch (error) {
            console.error("Failed to get checklists:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("checklists:create", (_, { ideaId, label, position }) => {
        try {
            const result = runRun(
                "INSERT INTO checklists (idea_id, label, position) VALUES (?, ?, ?)",
                [ideaId, label, position || 0]
            );
            return { success: true, id: result.id };
        } catch (error) {
            console.error("Failed to create checklist item:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("checklists:update", (_, { id, ...updates }) => {
        try {
            const keys = Object.keys(updates);
            if (keys.length === 0) return { success: true };
            const setClause = keys.map(k => `${k} = ?`).join(", ");
            const values = keys.map(k => updates[k]);
            runRun(`UPDATE checklists SET ${setClause} WHERE id = ?`, [...values, id]);
            return { success: true };
        } catch (error) {
            console.error("Failed to update checklist item:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("checklists:delete", (_, id) => {
        try {
            runRun("DELETE FROM checklists WHERE id = ?", [id]);
            return { success: true };
        } catch (error) {
            console.error("Failed to delete checklist item:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("checklists:init-defaults", (_, ideaId) => {
        try {
            const existing = runAll("SELECT id FROM checklists WHERE idea_id = ?", [ideaId]);
            if (existing.length > 0) return { success: true };
            const defaults = [
                'Research', 'Script', 'Thumbnail', 'Recording', 'Editing',
                'Review', 'Upload', 'SEO', 'Publish', 'Social Promotion'
            ];
            defaults.forEach((label, i) => {
                runRun("INSERT INTO checklists (idea_id, label, position) VALUES (?, ?, ?)", [ideaId, label, i]);
            });
            return { success: true };
        } catch (error) {
            console.error("Failed to init default checklists:", error);
            return { success: false, error: String(error) };
        }
    });

    // --- WORKSPACE NOTES ---
    ipcMain.handle("workspace-notes:get", (_, { ideaId, tabType }) => {
        try {
            const row = runGet("SELECT * FROM workspace_notes WHERE idea_id = ? AND tab_type = ?", [ideaId, tabType]);
            return { success: true, data: row };
        } catch (error) {
            console.error("Failed to get workspace notes:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("workspace-notes:save", (_, { ideaId, tabType, content }) => {
        try {
            runRun(
                "INSERT OR REPLACE INTO workspace_notes (idea_id, tab_type, content, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)",
                [ideaId, tabType, content]
            );
            return { success: true };
        } catch (error) {
            console.error("Failed to save workspace notes:", error);
            return { success: false, error: String(error) };
        }
    });

    // --- DASHBOARD ---
    ipcMain.handle("dashboard:stats", () => {
        try {
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const today = now.toISOString().split('T')[0];

            const totalProjects = runGet("SELECT COUNT(*) as count FROM projects");
            const activeProjects = runGet("SELECT COUNT(DISTINCT project_id) as count FROM ideas WHERE workflow_stage != 'published'");
            const ideasThisWeek = runGet("SELECT COUNT(*) as count FROM ideas WHERE created_at >= ?", [weekAgo]);
            const scriptsWritten = runGet("SELECT COUNT(*) as count FROM scripts");
            const wordsWritten = runGet("SELECT COALESCE(SUM(word_count), 0) as total FROM scripts");
            const publishedCount = runGet("SELECT COUNT(*) as count FROM ideas WHERE workflow_stage = 'published'");

            const overdueItems = runAll(`
                SELECT i.id, i.title, i.workflow_stage, p.name as project_name
                FROM ideas i
                JOIN projects p ON i.project_id = p.id
                WHERE i.scheduled_date < ? AND i.workflow_stage NOT IN ('ready', 'published')
                ORDER BY i.scheduled_date ASC
                LIMIT 10
            `, [today]);

            const todayItems = runAll(`
                SELECT i.id, i.title, i.workflow_stage, i.scheduled_time, p.name as project_name
                FROM ideas i
                JOIN projects p ON i.project_id = p.id
                WHERE i.scheduled_date = ?
                ORDER BY i.scheduled_time ASC
            `, [today]);

            const inProgressItems = runAll(`
                SELECT i.id, i.title, i.workflow_stage, p.name as project_name
                FROM ideas i
                JOIN projects p ON i.project_id = p.id
                WHERE i.workflow_stage IN ('writing', 'recording', 'editing')
                ORDER BY i.updated_at DESC
                LIMIT 10
            `);

            const upcomingSchedule = runAll(`
                SELECT i.id, i.title, i.scheduled_date, i.scheduled_time, p.name as project_name, 'idea' as type
                FROM ideas i
                JOIN projects p ON i.project_id = p.id
                WHERE i.scheduled_date >= ? AND i.scheduled_date <= date(?, '+7 days')
                UNION ALL
                SELECT p.id, p.name as title, p.scheduled_date, p.scheduled_time, p.name as project_name, 'project' as type
                FROM projects p
                WHERE p.scheduled_date >= ? AND p.scheduled_date <= date(?, '+7 days')
                ORDER BY scheduled_date ASC, scheduled_time ASC
                LIMIT 10
            `, [today, today, today, today]);

            const recentProjects = runAll(`
                SELECT p.*,
                    (SELECT COUNT(*) FROM ideas i WHERE i.project_id = p.id) as idea_count,
                    (SELECT MAX(COALESCE(s.updated_at, i.created_at, p.created_at))
                     FROM ideas i LEFT JOIN scripts s ON s.idea_id = i.id
                     WHERE i.project_id = p.id) as last_activity
                FROM projects p
                ORDER BY last_activity DESC
                LIMIT 5
            `);

            const recentlyEdited = runAll(`
                SELECT i.id, i.title, i.updated_at, p.name as project_name, 'idea' as type
                FROM ideas i
                JOIN projects p ON i.project_id = p.id
                WHERE i.updated_at >= ?
                UNION ALL
                SELECT s.id, i.title, s.updated_at, p.name as project_name, 'script' as type
                FROM scripts s
                JOIN ideas i ON s.idea_id = i.id
                JOIN projects p ON i.project_id = p.id
                WHERE s.updated_at >= ?
                ORDER BY updated_at DESC
                LIMIT 10
            `, [weekAgo, weekAgo]);

            return {
                success: true,
                data: {
                    totalProjects: totalProjects?.count || 0,
                    activeProjects: activeProjects?.count || 0,
                    ideasThisWeek: ideasThisWeek?.count || 0,
                    scriptsWritten: scriptsWritten?.count || 0,
                    wordsWritten: wordsWritten?.total || 0,
                    publishedCount: publishedCount?.count || 0,
                    overdueItems,
                    todayItems,
                    inProgressItems,
                    upcomingSchedule,
                    recentProjects,
                    recentlyEdited
                }
            };
        } catch (error) {
            console.error("Failed to get dashboard stats:", error);
            return { success: false, error: String(error) };
        }
    });

    // Settings
    ipcMain.handle("settings:get-all", () => {
        try {
            const rows = runAll("SELECT * FROM settings");
            const settings = rows.reduce((acc: any, row: any) => {
                acc[row.key] = row.value;
                return acc;
            }, {});
            return { success: true, data: settings };
        } catch (error) {
            console.error("Failed to get settings:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle("settings:update", (_, { key, value }) => {
        try {
            runRun("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
            return { success: true };
        } catch (error) {
            console.error("Failed to update setting:", error);
            return { success: false, error: String(error) };
        }
    });
}

app.whenReady().then(async () => {
    // Set app user model id for windows
    if (process.platform === 'win32') {
        app.setAppUserModelId("com.creator-tank");
    }

    // Initialize DB asynchronously
    try {
        await initDB();
        console.log("DB Initialized");
    } catch (e) {
        console.error("Failed to initialize DB:", e);
    }

    // Setup IPC
    setupIPC();

    createWindow();

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});
