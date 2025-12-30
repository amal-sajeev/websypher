/* Utility functions - Ported from backend/utils.py */

/**
 * Parse a pyautogui action string into structured data
 * @param {string} actionStr - Action string
 * @returns {Object} Parsed action data
 */
function parsePyautoguiAction(actionStr) {
    const result = {
        action_type: "unknown",
        x: null,
        y: null,
        keys: [],
        text: null,
        scroll_amount: null,
        sleep_duration: null,
        raw: actionStr
    };
    
    if (!actionStr) {
        return result;
    }
    
    // Click actions with optional button parameter
    const clickPattern = /(?:pg|pyautogui)\.(click|doubleClick|tripleClick|rightClick)\((\d+)\s*,\s*(\d+)(?:\s*,\s*button\s*=\s*['"](\w+)['"])?\)/;
    const clickMatch = actionStr.match(clickPattern);
    if (clickMatch) {
        const actionName = clickMatch[1];
        const x = parseInt(clickMatch[2]);
        const y = parseInt(clickMatch[3]);
        const buttonParam = clickMatch[4] || null;
        
        if (actionName === 'click') {
            result.action_type = buttonParam === 'right' ? 'rightClick' : 'click';
        } else {
            result.action_type = actionName;
        }
        
        result.x = x;
        result.y = y;
        return result;
    }
    
    // Mouse down
    const mouseDownMatch = actionStr.match(/(?:pg|pyautogui)\.mouseDown\((\d+)\s*,\s*(\d+)\)/);
    if (mouseDownMatch) {
        result.action_type = "mouseDown";
        result.x = parseInt(mouseDownMatch[1]);
        result.y = parseInt(mouseDownMatch[2]);
        return result;
    }
    
    // Mouse move
    const moveToMatch = actionStr.match(/(?:pg|pyautogui)\.moveTo\((\d+)\s*,\s*(\d+)\)/);
    if (moveToMatch) {
        result.action_type = "moveTo";
        result.x = parseInt(moveToMatch[1]);
        result.y = parseInt(moveToMatch[2]);
        return result;
    }
    
    // Mouse up
    if (/(?:pg|pyautogui)\.mouseUp\(\)/.test(actionStr)) {
        result.action_type = "mouseUp";
        return result;
    }
    
    // Key press
    const pressMatch = actionStr.match(/(?:pg|pyautogui)\.press\(['"](.+?)['"]\)/);
    if (pressMatch) {
        result.action_type = "press";
        result.keys = [pressMatch[1]];
        return result;
    }
    
    // Hotkey
    const hotkeyMatch = actionStr.match(/(?:pg|pyautogui)\.hotkey\((.+?)\)/);
    if (hotkeyMatch) {
        result.action_type = "hotkey";
        const keysStr = hotkeyMatch[1];
        const keys = keysStr.match(/['"]([^'"]+)['"]/g) || [];
        result.keys = keys.map(k => k.replace(/['"]/g, ''));
        return result;
    }
    
    // Write text
    const writeMatch = actionStr.match(/(?:pg|pyautogui)\.write\((['"])(.+?)\1(?:\s*,\s*.*?)?\)/s);
    if (writeMatch) {
        result.action_type = "write";
        result.text = writeMatch[2];
        return result;
    }
    
    // Typewrite text
    const typewriteMatch = actionStr.match(/(?:pg|pyautogui)\.typewrite\((['"])(.+?)\1(?:\s*,\s*.*?)?\)/s);
    if (typewriteMatch) {
        result.action_type = "write";
        result.text = typewriteMatch[2];
        return result;
    }
    
    // Scroll
    const scrollMatch = actionStr.match(/(?:pg|pyautogui)\.scroll\((-?\d+)\)/);
    if (scrollMatch) {
        result.action_type = "scroll";
        result.scroll_amount = parseInt(scrollMatch[1]);
        return result;
    }
    
    // Time sleep
    const sleepMatch = actionStr.match(/time\.sleep\(([\d.]+)\)/);
    if (sleepMatch) {
        result.action_type = "sleep";
        try {
            result.sleep_duration = parseFloat(sleepMatch[1]);
        } catch (e) {
            result.sleep_duration = 0.0;
        }
        return result;
    }
    
    return result;
}

/**
 * Find task JSON file in file tree
 * @param {string} rootPath - Root path (usually empty for root)
 * @returns {Object|null} {file: File, taskId: string} or null
 */
async function findTaskJSON(rootPath = '') {
    // Look for JSON files in root
    const jsonFiles = fileManager.findFilesInTree(rootPath, '*.json');
    
    // Filter out schema files
    const filtered = jsonFiles.filter(f => !f.name.toLowerCase().includes('schema'));
    
    if (filtered.length === 1) {
        const file = filtered[0];
        const taskId = file.name.replace(/\.json$/i, '');
        return { file, taskId };
    } else if (filtered.length > 1) {
        // Try to find one that matches folder name (we don't have folder name, so return first)
        return { file: filtered[0], taskId: filtered[0].name.replace(/\.json$/i, '') };
    }
    
    return null;
}

/**
 * Get model name from task JSON
 * @param {File} jsonFile - Task JSON file
 * @returns {Promise<string|null>} Model name or null
 */
async function getModelNameFromJSON(jsonFile) {
    const data = await fileManager.readFileAsJSON(jsonFile);
    if (!data) return null;
    
    const modelPassRate = data.model_pass_rate || {};
    if (typeof modelPassRate === 'object' && Object.keys(modelPassRate).length > 0) {
        return Object.keys(modelPassRate)[0];
    }
    
    return null;
}

/**
 * Find trajectory file (trajectory.jsonl or traj.jsonl)
 * @param {string} dirPath - Directory path
 * @returns {File|null} Trajectory file or null
 */
function findTrajectoryFile(dirPath) {
    // Try trajectory.jsonl first
    let files = fileManager.findFilesInTree(dirPath, 'trajectory.jsonl');
    if (files.length > 0) {
        return files[0];
    }
    
    // Try traj.jsonl
    files = fileManager.findFilesInTree(dirPath, 'traj.jsonl');
    if (files.length > 0) {
        return files[0];
    }
    
    return null;
}

/**
 * Find evaluation score file
 * @param {string} dirPath - Directory path
 * @param {string} taskId - Optional task ID
 * @returns {File|null} Evaluation score file or null
 */
function findEvaluationScore(dirPath, taskId = null) {
    // Try common locations
    const candidates = [
        `${dirPath}/evaluation_score.txt`.replace(/\/+/g, '/'),
        taskId ? `${dirPath}/${taskId}/evaluation_score.txt`.replace(/\/+/g, '/') : null
    ].filter(Boolean);
    
    for (const candidate of candidates) {
        const file = fileManager.getFileFromTree(candidate);
        if (file) {
            return file;
        }
    }
    
    // Search recursively
    const files = fileManager.findFilesInTree(dirPath, 'evaluation_score.txt');
    if (files.length > 0) {
        return files[0];
    }
    
    return null;
}

/**
 * Count PNG and XML files in a directory
 * @param {string} dirPath - Directory path
 * @returns {Object} {png: number, xml: number}
 */
function countPNGXMLFiles(dirPath) {
    return {
        png: fileManager.countFilesByExtension(dirPath, '.png'),
        xml: fileManager.countFilesByExtension(dirPath, '.xml')
    };
}

/**
 * Parse evaluation score from text
 * @param {string} scoreText - Score text
 * @returns {number|null} Parsed score or null
 */
function parseEvaluationScore(scoreText) {
    if (!scoreText) return null;
    
    try {
        return parseFloat(scoreText.trim());
    } catch (e) {
        return null;
    }
}

/**
 * Get task info from task JSON
 * @param {File} jsonFile - Task JSON file
 * @returns {Promise<Object>} Task info object
 */
async function getTaskInfo(jsonFile) {
    const data = await fileManager.readFileAsJSON(jsonFile);
    if (!data) {
        return {
            error: "Failed to parse task JSON",
            instruction: "",
            snapshot: "",
            related_apps: [],
            config: {},
            evaluator: {},
            model_pass_rate: {}
        };
    }
    
    return {
        error: null,
        task_id: jsonFile.name.replace(/\.json$/i, ''),
        instruction: data.instruction || "",
        snapshot: data.snapshot || "",
        related_apps: data.related_apps || [],
        config: data.config || {},
        evaluator: data.evaluator || {},
        model_pass_rate: data.model_pass_rate || {}
    };
}

// Export functions
window.utils = {
    parsePyautoguiAction,
    findTaskJSON,
    getModelNameFromJSON,
    findTrajectoryFile,
    findEvaluationScore,
    countPNGXMLFiles,
    parseEvaluationScore,
    getTaskInfo
};


