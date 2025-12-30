/* File Manager - Handles File API operations and file tree management */

// Global file tree structure
let fileTree = {};
let fileCache = {}; // Cache for read files (text, JSON, images)
let rootFolderName = ''; // The root folder name (stripped from paths)

/**
 * Build a file tree structure from FileList
 * @param {FileList} files - FileList from input or drag-drop
 * @returns {Object} File tree structure
 */
function buildFileTree(files) {
    fileTree = {};
    fileCache = {};
    rootFolderName = '';
    
    if (files.length === 0) {
        return fileTree;
    }
    
    // Detect root folder name from first file's path
    const firstFile = files[0];
    const firstPath = firstFile.webkitRelativePath || firstFile.name;
    const firstParts = firstPath.split('/').filter(p => p);
    
    // If we have webkitRelativePath, the first part is the root folder name
    // We'll strip it so paths like "task_123/SFT/..." become "SFT/..."
    if (firstFile.webkitRelativePath && firstParts.length > 1) {
        rootFolderName = firstParts[0];
    }
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let path = file.webkitRelativePath || file.name;
        let parts = path.split('/').filter(p => p);
        
        // Strip root folder name if present
        if (rootFolderName && parts[0] === rootFolderName) {
            parts = parts.slice(1);
        }
        
        // Build nested structure
        let current = fileTree;
        for (let j = 0; j < parts.length - 1; j++) {
            const part = parts[j];
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }
        
        // Add file to final location
        const fileName = parts[parts.length - 1];
        current[fileName] = file;
    }
    
    return fileTree;
}

/**
 * Get a file from the file tree by path
 * @param {string} path - File path (e.g., "SFT/Trajectory and Screenshot/trajectory.jsonl")
 * @returns {File|null} File object or null if not found
 */
function getFileFromTree(path) {
    const parts = path.split('/').filter(p => p);
    let current = fileTree;
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!current[part]) {
            return null;
        }
        current = current[part];
    }
    
    return current instanceof File ? current : null;
}

/**
 * Find files matching a pattern in a directory
 * @param {string} dirPath - Directory path
 * @param {string} pattern - Filename pattern (e.g., "*.json", "trajectory.jsonl")
 * @returns {Array<File>} Array of matching files
 */
function findFilesInTree(dirPath, pattern) {
    const results = [];
    const parts = dirPath ? dirPath.split('/').filter(p => p) : [];
    let current = fileTree;
    
    // Navigate to directory
    for (const part of parts) {
        if (!current[part] || current[part] instanceof File) {
            return results; // Directory doesn't exist
        }
        current = current[part];
    }
    
    // Recursively search
    function searchDir(dir, prefix = '') {
        for (const [name, item] of Object.entries(dir)) {
            if (item instanceof File) {
                const fullPath = prefix ? `${prefix}/${name}` : name;
                if (matchesPattern(name, pattern)) {
                    results.push({ file: item, path: fullPath });
                }
            } else if (typeof item === 'object') {
                const newPrefix = prefix ? `${prefix}/${name}` : name;
                searchDir(item, newPrefix);
            }
        }
    }
    
    searchDir(current, dirPath);
    return results.map(r => r.file);
}

/**
 * Check if filename matches pattern
 * @param {string} filename - Filename to check
 * @param {string} pattern - Pattern (supports * wildcard)
 * @returns {boolean}
 */
function matchesPattern(filename, pattern) {
    if (pattern === filename) return true;
    if (pattern.startsWith('*.')) {
        const ext = pattern.substring(1);
        return filename.endsWith(ext);
    }
    if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(filename);
    }
    return false;
}

/**
 * Read file as text
 * @param {File} file - File to read
 * @returns {Promise<string>} File content as text
 */
function readFileAsText(file) {
    if (!file) return Promise.resolve(null);
    
    const cacheKey = `text:${file.name}:${file.size}:${file.lastModified}`;
    if (fileCache[cacheKey]) {
        return Promise.resolve(fileCache[cacheKey]);
    }
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            fileCache[cacheKey] = content;
            resolve(content);
        };
        reader.onerror = reject;
        reader.readAsText(file, 'utf-8');
    });
}

/**
 * Read file as JSON
 * @param {File} file - File to read
 * @returns {Promise<Object>} Parsed JSON object
 */
async function readFileAsJSON(file) {
    const text = await readFileAsText(file);
    if (!text) return null;
    
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error('Error parsing JSON:', e);
        return null;
    }
}

/**
 * Read JSONL file (one JSON object per line)
 * @param {File} file - File to read
 * @returns {Promise<Array>} Array of JSON objects
 */
async function readFileAsJSONL(file) {
    const text = await readFileAsText(file);
    if (!text) return [];
    
    const lines = text.split('\n');
    const results = [];
    
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        
        try {
            results.push(JSON.parse(trimmed));
        } catch (e) {
            // Skip invalid JSON lines
            continue;
        }
    }
    
    return results;
}

/**
 * Read file as data URL (for images)
 * @param {File} file - File to read
 * @returns {Promise<string>} Data URL
 */
function readFileAsDataURL(file) {
    if (!file) return Promise.resolve(null);
    
    const cacheKey = `dataurl:${file.name}:${file.size}:${file.lastModified}`;
    if (fileCache[cacheKey]) {
        return Promise.resolve(fileCache[cacheKey]);
    }
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target.result;
            fileCache[cacheKey] = dataUrl;
            resolve(dataUrl);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Count files by extension in a directory
 * @param {string} dirPath - Directory path
 * @param {string} extension - File extension (e.g., ".png", ".xml")
 * @returns {number} Count of files
 */
function countFilesByExtension(dirPath, extension) {
    const parts = dirPath ? dirPath.split('/').filter(p => p) : [];
    let current = fileTree;
    
    // Navigate to directory
    for (const part of parts) {
        if (!current[part] || current[part] instanceof File) {
            return 0;
        }
        current = current[part];
    }
    
    let count = 0;
    function countInDir(dir) {
        for (const [name, item] of Object.entries(dir)) {
            if (item instanceof File) {
                if (name.toLowerCase().endsWith(extension.toLowerCase())) {
                    count++;
                }
            } else if (typeof item === 'object') {
                countInDir(item);
            }
        }
    }
    
    countInDir(current);
    return count;
}

/**
 * Get all files in a directory recursively
 * @param {string} dirPath - Directory path
 * @returns {Array<File>} Array of files
 */
function getAllFilesInDir(dirPath) {
    const parts = dirPath ? dirPath.split('/').filter(p => p) : [];
    let current = fileTree;
    
    // Navigate to directory
    for (const part of parts) {
        if (!current[part] || current[part] instanceof File) {
            return [];
        }
        current = current[part];
    }
    
    const files = [];
    function collectFiles(dir) {
        for (const [name, item] of Object.entries(dir)) {
            if (item instanceof File) {
                files.push(item);
            } else if (typeof item === 'object') {
                collectFiles(item);
            }
        }
    }
    
    collectFiles(current);
    return files;
}

/**
 * Check if a directory exists in the file tree
 * @param {string} dirPath - Directory path
 * @returns {boolean}
 */
function directoryExists(dirPath) {
    const parts = dirPath ? dirPath.split('/').filter(p => p) : [];
    let current = fileTree;
    
    for (const part of parts) {
        if (!current[part]) {
            return false;
        }
        if (current[part] instanceof File) {
            return false; // Path points to a file, not a directory
        }
        current = current[part];
    }
    
    return true;
}

/**
 * Get subdirectories in a directory
 * @param {string} dirPath - Directory path
 * @returns {Array<string>} Array of subdirectory names
 */
function getSubdirectories(dirPath) {
    const parts = dirPath ? dirPath.split('/').filter(p => p) : [];
    let current = fileTree;
    
    // Navigate to directory
    for (const part of parts) {
        if (!current[part] || current[part] instanceof File) {
            return [];
        }
        current = current[part];
    }
    
    const dirs = [];
    for (const [name, item] of Object.entries(current)) {
        if (!(item instanceof File) && typeof item === 'object') {
            dirs.push(name);
        }
    }
    
    return dirs;
}

/**
 * Get all files from the entire file tree with their relative paths
 * @returns {Array<Object>} Array of {file: File, path: string} objects
 */
function getAllFilesWithPaths() {
    const files = [];
    
    function traverseTree(tree, currentPath = '') {
        for (const [name, item] of Object.entries(tree)) {
            const itemPath = currentPath ? `${currentPath}/${name}` : name;
            
            if (item instanceof File) {
                files.push({ file: item, path: itemPath });
            } else if (typeof item === 'object' && item !== null) {
                traverseTree(item, itemPath);
            }
        }
    }
    
    traverseTree(fileTree);
    return files;
}

// Export functions
window.fileManager = {
    buildFileTree,
    getFileFromTree,
    findFilesInTree,
    readFileAsText,
    readFileAsJSON,
    readFileAsJSONL,
    readFileAsDataURL,
    countFilesByExtension,
    getAllFilesInDir,
    getAllFilesWithPaths,
    directoryExists,
    getSubdirectories,
    getFileTree: () => fileTree,
    getRootFolderName: () => rootFolderName,
    clearCache: () => { fileCache = {}; }
};


