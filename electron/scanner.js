import fs from 'fs/promises';
import path from 'path';

// Max size of a preview (10KB)
const MAX_PREVIEW_SIZE = 10 * 1024;
// Supported lightweight extensions for preview
const PREVIEW_EXTENSIONS = new Set(['.txt', '.md', '.csv', '.json', '.js', '.py', '.ts', '.html', '.css']);

export async function scanDirectory(dirPath) {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
        throw new Error('Provided path is not a directory');
    }

    const results = [];
    await walkDir(dirPath, results);

    // Naive duplicate detection (size + name heuristic)
    const sizeNameMap = new Map();
    for (const file of results) {
        if (!file.error && !file.isDirectory) {
            const key = `${file.size}-${file.name}`;
            if (sizeNameMap.has(key)) {
                file.isDuplicate = true;
                const original = sizeNameMap.get(key);
                original.isDuplicate = true;
            } else {
                sizeNameMap.set(key, file);
            }
        }
    }

    return results;
}

async function walkDir(currentPath, results) {
    try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });

        const promises = entries.map(async (entry) => {
            const fullPath = path.join(currentPath, entry.name);

            if (entry.isDirectory()) {
                // Recursively walk subdirectories
                await walkDir(fullPath, results);
            } else if (entry.isFile()) {
                const fileInfo = await extractMetadata(fullPath, entry.name);
                results.push(fileInfo);
            }
        });

        await Promise.allSettled(promises);
    } catch (error) {
        console.error(`Error reading directory ${currentPath}:`, error);
    }
}

async function extractMetadata(filePath, fileName) {
    try {
        const stats = await fs.stat(filePath);
        const ext = path.extname(fileName).toLowerCase();

        let preview = null;
        if (PREVIEW_EXTENSIONS.has(ext) && stats.size > 0) {
            let fileHandle = null;
            try {
                const bytesToRead = Math.min(stats.size, MAX_PREVIEW_SIZE);
                const buffer = Buffer.alloc(bytesToRead);

                fileHandle = await fs.open(filePath, 'r');
                await fileHandle.read(buffer, 0, bytesToRead, 0);

                preview = buffer.toString('utf-8');
                if (stats.size > MAX_PREVIEW_SIZE) {
                    preview += '... [TRUNCATED]';
                }
            } catch (err) {
                console.warn(`Could not read preview for ${filePath}: ${err.message}`);
            } finally {
                if (fileHandle) await fileHandle.close();
            }
        }

        return {
            path: filePath,
            name: fileName,
            extension: ext,
            size: stats.size,
            created: stats.birthtimeMs,
            modified: stats.mtimeMs,
            accessed: stats.atimeMs,
            isDirectory: false,
            preview: preview
        };
    } catch (error) {
        console.error(`Error extracting metadata for ${filePath}:`, error);
        return {
            path: filePath,
            name: fileName,
            error: 'Failed to extract metadata'
        };
    }
}
