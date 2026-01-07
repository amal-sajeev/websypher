/* Analyzer - Ported from backend/analyzer.py */

/**
 * Hash trajectory actions using Web Crypto API (MD5 equivalent)
 * @param {Array} steps - Trajectory steps
 * @returns {Promise<string|null>} Hash string or null
 */
async function hashTrajectoryActions(steps) {
    if (!steps || steps.length === 0) return null;
    
    const actions = steps.map(step => String(step.action || '').trim()).filter(Boolean);
    const actionString = actions.join('\n');
    
    // Use Web Crypto API to create hash
    const encoder = new TextEncoder();
    const data = encoder.encode(actionString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Use first 32 chars as MD5-like hash
    return hashHex.substring(0, 32);
}

/**
 * Extract assistant cells from a Jupyter notebook
 * @param {File} notebookFile - Notebook file
 * @returns {Promise<Array>} Array of assistant cells
 */
async function extractNotebookAssistantCells(notebookFile) {
    const cells = [];
    try {
        const data = await fileManager.readFileAsJSON(notebookFile);
        if (!data) return cells;
        
        const notebookCells = data.cells || [];
        let stepNum = 0;
        
        for (let idx = 0; idx < notebookCells.length; idx++) {
            const cell = notebookCells[idx];
            const cellType = cell.cell_type || '';
            let source = cell.source || [];
            
            let text = '';
            if (Array.isArray(source)) {
                text = source.join('');
            } else if (typeof source === 'string') {
                text = source;
            }
            
            const stripped = text.trimStart();
            if (stripped.startsWith('**[assistant]')) {
                const content = text.replace('**[assistant]**', '').replace('**[assistant]', '').trim();
                cells.push({
                    step: stepNum,
                    cell_index: idx,
                    content: content,
                    full_text: text,
                    word_count: content.split(/\s+/).filter(w => w).length,
                    char_count: content.length
                });
                stepNum++;
            }
        }
    } catch (e) {
        console.error('Error extracting notebook cells:', e);
    }
    
    return cells;
}

/**
 * Criterion 1: Does SFT have the lowest number of steps among all SFT and Annotators with positive results?
 */
async function checkCriterion1SFTStepCount(modelName = null) {
    const result = {
        passed: false,
        sft_steps: 0,
        sft_score: null,
        annotator_steps: {},
        annotator_scores: {},
        positive_steps: {},
        message: ""
    };
    
    // Find task ID for score lookup
    const taskJSON = await utils.findTaskJSON();
    const taskId = taskJSON ? taskJSON.taskId : null;
    
    // Find SFT trajectory
    const sftTrajPath = 'SFT/Trajectory and Screenshot';
    const sftTrajFile = utils.findTrajectoryFile(sftTrajPath);
    
    if (!sftTrajFile) {
        result.message = "SFT trajectory.jsonl not found";
        return result;
    }
    
    const sftSteps = await fileManager.readFileAsJSONL(sftTrajFile);
    result.sft_steps = sftSteps.length;
    
    // Get SFT score
    const sftDir = 'SFT';
    const sftScoreFile = utils.findEvaluationScore(sftDir, taskId);
    if (sftScoreFile) {
        const scoreText = await fileManager.readFileAsText(sftScoreFile);
        result.sft_score = utils.parseEvaluationScore(scoreText);
    }
    
    // Find annotator trajectories and their scores
    let annotatorRoot = 'Annotator Trajectory';
    if (!fileManager.directoryExists(annotatorRoot)) {
        for (const altName of ['Annotator_trajectory', 'Annotator trajectory']) {
            if (fileManager.directoryExists(altName)) {
                annotatorRoot = altName;
                break;
            }
        }
    }
    
    const annotatorSteps = {};
    const annotatorScores = {};
    for (const idx of [1, 2, 3]) {
        for (const variant of [
            `annotator${idx}`,
            `annotator_${idx}`,
            `annotaor_${idx}`,
            `annotaor${idx}`,
            `annotator${idx.toString().padStart(2, '0')}`
        ]) {
            const annotDir = `${annotatorRoot}/${variant}`;
            if (fileManager.directoryExists(annotDir)) {
                const trajDir = `${annotDir}/Trajectory and Screenshot`;
                if (fileManager.directoryExists(trajDir)) {
                    const trajFile = utils.findTrajectoryFile(trajDir);
                    if (trajFile) {
                        const steps = await fileManager.readFileAsJSONL(trajFile);
                        annotatorSteps[`annotator_${idx}`] = steps.length;
                    }
                }
                
                // Get annotator score
                const scoreFile = fileManager.getFileFromTree(`${annotDir}/evaluation_score.txt`);
                if (scoreFile) {
                    const scoreText = await fileManager.readFileAsText(scoreFile);
                    annotatorScores[`annotator_${idx}`] = utils.parseEvaluationScore(scoreText);
                }
                break;
            }
        }
    }
    
    result.annotator_steps = annotatorSteps;
    result.annotator_scores = annotatorScores;
    
    // Collect step counts only from SFT and Annotators with positive results (score = 1.0)
    const positiveSteps = {};
    
    // Add SFT if it has positive result
    if (result.sft_score !== null && Math.abs(result.sft_score - 1.0) < 0.01) {
        positiveSteps['SFT'] = result.sft_steps;
    }
    
    // Add annotators with positive results
    for (const [annotatorKey, score] of Object.entries(annotatorScores)) {
        if (score !== null && Math.abs(score - 1.0) < 0.01) {
            const steps = annotatorSteps[annotatorKey];
            if (steps !== undefined) {
                positiveSteps[annotatorKey] = steps;
            }
        }
    }
    
    result.positive_steps = positiveSteps;
    
    // Check if SFT has the least steps among all positive results
    if (Object.keys(positiveSteps).length === 0) {
        result.message = "No SFT or Annotators with positive results (score = 1.0) found";
        return result;
    }
    
    // SFT must be in the positive results to pass
    if (!positiveSteps.hasOwnProperty('SFT')) {
        result.message = `SFT does not have a positive result (score = ${result.sft_score}). Only comparing among positive results.`;
        return result;
    }
    
    const allPositiveSteps = Object.values(positiveSteps);
    const minPositiveSteps = Math.min(...allPositiveSteps);
    result.passed = result.sft_steps <= minPositiveSteps;
    
    const comparisonDetails = [];
    for (const [key, steps] of Object.entries(positiveSteps)) {
        comparisonDetails.push(`${key}: ${steps} steps`);
    }
    
    result.message = `SFT has ${result.sft_steps} steps. Positive results: ${comparisonDetails.join(', ')}. ${result.passed ? 'PASS' : 'FAIL'}`;
    
    return result;
}

/**
 * Criterion 2: Is the evaluation score of SFT and at least one annotator 1.0?
 */
async function checkCriterion2EvaluationScores(taskId = '') {
    const result = {
        passed: false,
        sft_score: null,
        annotator_scores: {},
        message: ""
    };
    
    // Check SFT score
    const sftDir = 'SFT';
    const sftScoreFile = utils.findEvaluationScore(sftDir, taskId);
    if (sftScoreFile) {
        const scoreText = await fileManager.readFileAsText(sftScoreFile);
        result.sft_score = utils.parseEvaluationScore(scoreText);
    }
    
    // Check annotator scores
    let annotatorRoot = 'Annotator Trajectory';
    if (!fileManager.directoryExists(annotatorRoot)) {
        for (const altName of ['Annotator_trajectory', 'Annotator trajectory']) {
            if (fileManager.directoryExists(altName)) {
                annotatorRoot = altName;
                break;
            }
        }
    }
    
    for (const idx of [1, 2, 3]) {
        for (const variant of [
            `annotator${idx}`,
            `annotator_${idx}`,
            `annotaor_${idx}`,
            `annotaor${idx}`,
            `annotator${idx.toString().padStart(2, '0')}`
        ]) {
            const annotDir = `${annotatorRoot}/${variant}`;
            if (fileManager.directoryExists(annotDir)) {
                const scoreFile = fileManager.getFileFromTree(`${annotDir}/evaluation_score.txt`);
                if (scoreFile) {
                    const scoreText = await fileManager.readFileAsText(scoreFile);
                    const score = utils.parseEvaluationScore(scoreText);
                    result.annotator_scores[`annotator_${idx}`] = score;
                    break;
                }
            }
        }
    }
    
    const sftIs1 = result.sft_score !== null && Math.abs(result.sft_score - 1.0) < 0.01;
    const atLeastOneAnnotatorIs1 = Object.values(result.annotator_scores).some(
        score => score !== null && Math.abs(score - 1.0) < 0.01
    );
    
    result.passed = sftIs1 && atLeastOneAnnotatorIs1;
    result.message = `SFT score: ${result.sft_score}, Annotator scores: ${JSON.stringify(result.annotator_scores)}. ${result.passed ? 'PASS' : 'FAIL'}`;
    
    return result;
}

/**
 * Criterion 3: Is the evaluation score of either Annotator 2 or 3 equal to 0?
 */
async function checkCriterion3AnnotatorZeroScore() {
    const result = {
        passed: false,
        annotator_2_score: null,
        annotator_3_score: null,
        message: ""
    };
    
    let annotatorRoot = 'Annotator Trajectory';
    if (!fileManager.directoryExists(annotatorRoot)) {
        for (const altName of ['Annotator_trajectory', 'Annotator trajectory']) {
            if (fileManager.directoryExists(altName)) {
                annotatorRoot = altName;
                break;
            }
        }
    }
    
    for (const idx of [2, 3]) {
        for (const variant of [
            `annotator${idx}`,
            `annotator_${idx}`,
            `annotaor_${idx}`,
            `annotaor${idx}`,
            `annotator${idx.toString().padStart(2, '0')}`
        ]) {
            const annotDir = `${annotatorRoot}/${variant}`;
            if (fileManager.directoryExists(annotDir)) {
                const scoreFile = fileManager.getFileFromTree(`${annotDir}/evaluation_score.txt`);
                if (scoreFile) {
                    const scoreText = await fileManager.readFileAsText(scoreFile);
                    const score = utils.parseEvaluationScore(scoreText);
                    if (idx === 2) {
                        result.annotator_2_score = score;
                    } else {
                        result.annotator_3_score = score;
                    }
                    break;
                }
            }
        }
    }
    
    result.passed = (
        (result.annotator_2_score !== null && Math.abs(result.annotator_2_score) < 0.01) ||
        (result.annotator_3_score !== null && Math.abs(result.annotator_3_score) < 0.01)
    );
    result.message = `Annotator 2: ${result.annotator_2_score}, Annotator 3: ${result.annotator_3_score}. ${result.passed ? 'PASS' : 'FAIL'}`;
    
    return result;
}

/**
 * Criterion 4: Have assistant step descriptions been written properly?
 */
async function checkCriterion4NotebookAssistantCells() {
    const result = {
        passed: false,
        notebooks_found: {},
        cells: {},
        message: ""
    };
    
    // Find SFT notebook
    const sftColab = 'SFT/Colab';
    if (fileManager.directoryExists(sftColab)) {
        const notebooks = fileManager.findFilesInTree(sftColab, '*.ipynb');
        if (notebooks.length > 0) {
            const sftCells = await extractNotebookAssistantCells(notebooks[0]);
            result.cells.sft = sftCells;
            result.notebooks_found.sft = notebooks[0].name;
        }
    }
    
    // Find annotator notebooks
    let annotatorRoot = 'Annotator Trajectory';
    if (!fileManager.directoryExists(annotatorRoot)) {
        for (const altName of ['Annotator_trajectory', 'Annotator trajectory']) {
            if (fileManager.directoryExists(altName)) {
                annotatorRoot = altName;
                break;
            }
        }
    }
    
    for (const idx of [1, 2, 3]) {
        for (const variant of [
            `annotator${idx}`,
            `annotator_${idx}`,
            `annotaor_${idx}`,
            `annotaor${idx}`,
            `annotator${idx.toString().padStart(2, '0')}`
        ]) {
            const annotDir = `${annotatorRoot}/${variant}`;
            if (fileManager.directoryExists(annotDir)) {
                const colabDir = `${annotDir}/Colab`;
                if (fileManager.directoryExists(colabDir)) {
                    const notebooks = fileManager.findFilesInTree(colabDir, '*.ipynb');
                    if (notebooks.length > 0) {
                        const key = `annotator_${idx}`;
                        const cells = await extractNotebookAssistantCells(notebooks[0]);
                        result.cells[key] = cells;
                        result.notebooks_found[key] = notebooks[0].name;
                    }
                }
                break;
            }
        }
    }
    
    // Check if cells are properly written
    let allGood = true;
    for (const [key, cellsList] of Object.entries(result.cells)) {
        for (const cell of cellsList) {
            const contentLower = cell.content.toLowerCase();
            if (contentLower.includes('executing step') && cell.word_count < 20) {
                allGood = false;
                break;
            }
        }
        if (!allGood) break;
    }
    
    result.passed = allGood && Object.keys(result.cells).length > 0;
    result.message = `Found notebooks: ${Object.keys(result.notebooks_found).join(', ')}. ${result.passed ? 'PASS' : 'REVIEW NEEDED'}`;
    
    return result;
}

/**
 * Criterion 5: Are any of the SFT or Annotators copies of each other?
 */
async function checkCriterion5DuplicateDetection() {
    const result = {
        passed: true,
        trajectory_hashes: {},
        similarities: {},
        message: ""
    };
    
    const trajectories = {};
    
    // Get SFT trajectory
    const sftTrajDir = 'SFT/Trajectory and Screenshot';
    const sftTrajFile = utils.findTrajectoryFile(sftTrajDir);
    if (sftTrajFile) {
        const steps = await fileManager.readFileAsJSONL(sftTrajFile);
        const hashVal = await hashTrajectoryActions(steps);
        if (hashVal) {
            trajectories.sft = { hash: hashVal, file: sftTrajFile, steps: steps };
            result.trajectory_hashes.sft = hashVal;
        }
    }
    
    // Get annotator trajectories
    let annotatorRoot = 'Annotator Trajectory';
    if (!fileManager.directoryExists(annotatorRoot)) {
        for (const altName of ['Annotator_trajectory', 'Annotator trajectory']) {
            if (fileManager.directoryExists(altName)) {
                annotatorRoot = altName;
                break;
            }
        }
    }
    
    for (const idx of [1, 2, 3]) {
        for (const variant of [
            `annotator${idx}`,
            `annotator_${idx}`,
            `annotaor_${idx}`,
            `annotaor${idx}`,
            `annotator${idx.toString().padStart(2, '0')}`
        ]) {
            const annotDir = `${annotatorRoot}/${variant}/Trajectory and Screenshot`;
            if (fileManager.directoryExists(annotDir)) {
                const trajFile = utils.findTrajectoryFile(annotDir);
                if (trajFile) {
                    const steps = await fileManager.readFileAsJSONL(trajFile);
                    const hashVal = await hashTrajectoryActions(steps);
                    if (hashVal) {
                        const key = `annotator_${idx}`;
                        trajectories[key] = { hash: hashVal, file: trajFile, steps: steps };
                        result.trajectory_hashes[key] = hashVal;
                    }
                }
                break;
            }
        }
    }
    
    // Compare hashes
    const trajectoryList = Object.entries(trajectories);
    for (let i = 0; i < trajectoryList.length; i++) {
        const [name1, traj1] = trajectoryList[i];
        for (let j = i + 1; j < trajectoryList.length; j++) {
            const [name2, traj2] = trajectoryList[j];
            if (traj1.hash === traj2.hash) {
                result.passed = false;
                result.similarities[`${name1}_vs_${name2}`] = 1.0;
            } else {
                const actions1 = traj1.steps.map(s => String(s.action || ''));
                const actions2 = traj2.steps.map(s => String(s.action || ''));
                const common = actions1.filter((a1, idx) => idx < actions2.length && a1 === actions2[idx]).length;
                const maxLen = Math.max(actions1.length, actions2.length);
                const similarity = maxLen > 0 ? common / maxLen : 0.0;
                result.similarities[`${name1}_vs_${name2}`] = similarity;
                if (similarity > 0.95) {
                    result.passed = false;
                }
            }
        }
    }
    
    result.message = `Found ${Object.keys(trajectories).length} trajectories. ${result.passed ? 'PASS' : 'DUPLICATES DETECTED'}`;
    
    return result;
}

/**
 * Criterion 6: Is the average of scores in result.txt files either 0 or less than 1?
 */
async function checkCriterion6RunScoreAverage(modelName) {
    const result = {
        passed: false,
        model_name: modelName,
        scores: [],
        average: null,
        message: ""
    };
    
    if (!modelName) {
        result.message = "Model name not found";
        return result;
    }
    
    const modelFolder = modelName;
    if (!fileManager.directoryExists(modelFolder)) {
        result.message = `Model folder ${modelName} not found`;
        return result;
    }
    
    // Read result.txt from each run
    for (let i = 1; i < 17; i++) {
        for (const runName of [`run_${i.toString().padStart(2, '0')}`, `run_${i}`]) {
            const runDir = `${modelFolder}/${runName}`;
            if (fileManager.directoryExists(runDir)) {
                let trajDir = `${runDir}/Trajectory and Screenshot`;
                if (!fileManager.directoryExists(trajDir)) {
                    trajDir = runDir;
                }
                
                const resultFile = fileManager.getFileFromTree(`${trajDir}/result.txt`);
                if (resultFile) {
                    const scoreText = await fileManager.readFileAsText(resultFile);
                    const score = utils.parseEvaluationScore(scoreText);
                    if (score !== null) {
                        result.scores.push(score);
                    }
                }
                break;
            }
        }
    }
    
    if (result.scores.length > 0) {
        result.average = result.scores.reduce((a, b) => a + b, 0) / result.scores.length;
        result.passed = result.average < 1.0;
        result.message = `Average: ${result.average.toFixed(3)} from ${result.scores.length} runs. ${result.passed ? 'PASS' : 'FAIL'}`;
    } else {
        result.message = "No result.txt files found";
    }
    
    return result;
}

/**
 * Criterion 7: What is the number of folders vs the number of result files?
 */
async function checkCriterion7RunFolderCount(modelName) {
    const result = {
        passed: true,
        folder_count: 0,
        result_file_count: 0,
        message: ""
    };
    
    if (!modelName) {
        result.message = "Model name not found";
        return result;
    }
    
    const modelFolder = modelName;
    if (!fileManager.directoryExists(modelFolder)) {
        result.message = `Model folder ${modelName} not found`;
        return result;
    }
    
    // Count run folders
    for (let i = 1; i < 17; i++) {
        for (const runName of [`run_${i.toString().padStart(2, '0')}`, `run_${i}`]) {
            const runDir = `${modelFolder}/${runName}`;
            if (fileManager.directoryExists(runDir)) {
                result.folder_count++;
                break;
            }
        }
    }
    
    // Count result files
    for (let i = 1; i < 17; i++) {
        for (const runName of [`run_${i.toString().padStart(2, '0')}`, `run_${i}`]) {
            const runDir = `${modelFolder}/${runName}`;
            if (fileManager.directoryExists(runDir)) {
                let trajDir = `${runDir}/Trajectory and Screenshot`;
                if (!fileManager.directoryExists(trajDir)) {
                    trajDir = runDir;
                }
                
                const resultFile = fileManager.getFileFromTree(`${trajDir}/result.txt`);
                if (resultFile) {
                    result.result_file_count++;
                }
                break;
            }
        }
    }
    
    result.message = `Folders: ${result.folder_count}, Result files: ${result.result_file_count}`;
    
    return result;
}

/**
 * Criterion 8: Are there any run folders that don't have a result file?
 */
async function checkCriterion8MissingResultFiles(modelName) {
    const result = {
        passed: true,
        missing_results: [],
        message: ""
    };
    
    if (!modelName) {
        result.message = "Model name not found";
        return result;
    }
    
    const modelFolder = modelName;
    if (!fileManager.directoryExists(modelFolder)) {
        result.message = `Model folder ${modelName} not found`;
        return result;
    }
    
    for (let i = 1; i < 17; i++) {
        for (const runName of [`run_${i.toString().padStart(2, '0')}`, `run_${i}`]) {
            const runDir = `${modelFolder}/${runName}`;
            if (fileManager.directoryExists(runDir)) {
                let trajDir = `${runDir}/Trajectory and Screenshot`;
                if (!fileManager.directoryExists(trajDir)) {
                    trajDir = runDir;
                }
                
                const resultFile = fileManager.getFileFromTree(`${trajDir}/result.txt`);
                if (!resultFile) {
                    result.missing_results.push(runName);
                    result.passed = false;
                }
                break;
            }
        }
    }
    
    result.message = result.missing_results.length > 0
        ? `${result.missing_results.length} missing: ${result.missing_results.join(', ')}`
        : "All runs have result.txt";
    
    return result;
}

/**
 * Criterion 9: Do trajectory folders have equal PNG and XML counts?
 */
async function checkCriterion9PNGXMLMatch(checkEnabled = false) {
    const result = {
        passed: true,
        mismatches: [],
        message: ""
    };
    
    if (!checkEnabled) {
        result.message = "Check disabled (optional)";
        return result;
    }
    
    // Check SFT
    const sftTrajDir = 'SFT/Trajectory and Screenshot';
    if (fileManager.directoryExists(sftTrajDir)) {
        const counts = utils.countPNGXMLFiles(sftTrajDir);
        if (counts.png !== counts.xml) {
            result.mismatches.push({ path: "SFT", png: counts.png, xml: counts.xml });
            result.passed = false;
        }
    }
    
    // Check annotators
    let annotatorRoot = 'Annotator Trajectory';
    if (!fileManager.directoryExists(annotatorRoot)) {
        for (const altName of ['Annotator_trajectory', 'Annotator trajectory']) {
            if (fileManager.directoryExists(altName)) {
                annotatorRoot = altName;
                break;
            }
        }
    }
    
    for (const idx of [1, 2, 3]) {
        for (const variant of [
            `annotator${idx}`,
            `annotator_${idx}`,
            `annotaor_${idx}`,
            `annotaor${idx}`,
            `annotator${idx.toString().padStart(2, '0')}`
        ]) {
            const annotDir = `${annotatorRoot}/${variant}/Trajectory and Screenshot`;
            if (fileManager.directoryExists(annotDir)) {
                const counts = utils.countPNGXMLFiles(annotDir);
                if (counts.png !== counts.xml) {
                    result.mismatches.push({ path: `annotator_${idx}`, png: counts.png, xml: counts.xml });
                    result.passed = false;
                }
                break;
            }
        }
    }
    
    // Check model runs (if model name available)
    const taskJSON = await utils.findTaskJSON();
    if (taskJSON) {
        const modelName = await utils.getModelNameFromJSON(taskJSON.file);
        if (modelName && fileManager.directoryExists(modelName)) {
            for (let i = 1; i < 17; i++) {
                for (const runName of [`run_${i.toString().padStart(2, '0')}`, `run_${i}`]) {
                    const runDir = `${modelName}/${runName}`;
                    if (fileManager.directoryExists(runDir)) {
                        const trajDir = `${runDir}/Trajectory and Screenshot`;
                        if (fileManager.directoryExists(trajDir)) {
                            const counts = utils.countPNGXMLFiles(trajDir);
                            if (counts.png !== counts.xml) {
                                result.mismatches.push({
                                    path: `${modelName}/${runName}`,
                                    png: counts.png,
                                    xml: counts.xml
                                });
                                result.passed = false;
                            }
                        }
                        break;
                    }
                }
            }
        }
    }
    
    result.message = result.mismatches.length > 0
        ? `${result.mismatches.length} mismatches found`
        : "All PNG/XML counts match";
    
    return result;
}

/**
 * Criterion 10: Is the number of PNG files equal to the number of steps + 1?
 */
async function checkCriterion10StepCountMatch() {
    const result = {
        passed: true,
        mismatches: [],
        message: ""
    };
    
    // Check SFT
    const sftTrajDir = 'SFT/Trajectory and Screenshot';
    const sftTrajFile = utils.findTrajectoryFile(sftTrajDir);
    if (sftTrajFile) {
        const steps = await fileManager.readFileAsJSONL(sftTrajFile);
        const stepCount = steps.length;
        const pngCount = utils.countPNGXMLFiles(sftTrajDir).png;
        
        if (pngCount !== stepCount + 1 && pngCount !== stepCount) {
            result.mismatches.push({
                path: "SFT",
                trajectory_steps: stepCount,
                png_files: pngCount
            });
            result.passed = false;
        }
    }
    
    // Check annotators
    let annotatorRoot = 'Annotator Trajectory';
    if (!fileManager.directoryExists(annotatorRoot)) {
        for (const altName of ['Annotator_trajectory', 'Annotator trajectory']) {
            if (fileManager.directoryExists(altName)) {
                annotatorRoot = altName;
                break;
            }
        }
    }
    
    for (const idx of [1, 2, 3]) {
        for (const variant of [
            `annotator${idx}`,
            `annotator_${idx}`,
            `annotaor_${idx}`,
            `annotaor${idx}`,
            `annotator${idx.toString().padStart(2, '0')}`
        ]) {
            const annotDir = `${annotatorRoot}/${variant}/Trajectory and Screenshot`;
            if (fileManager.directoryExists(annotDir)) {
                const trajFile = utils.findTrajectoryFile(annotDir);
                if (trajFile) {
                    const steps = await fileManager.readFileAsJSONL(trajFile);
                    const stepCount = steps.length;
                    const pngCount = utils.countPNGXMLFiles(annotDir).png;
                    
                    if (pngCount !== stepCount + 1 && pngCount !== stepCount) {
                        result.mismatches.push({
                            path: `annotator_${idx}`,
                            trajectory_steps: stepCount,
                            png_files: pngCount
                        });
                        result.passed = false;
                    }
                }
                break;
            }
        }
    }
    
    if (result.mismatches.length > 0) {
        const mismatchDetails = result.mismatches.map(m =>
            `${m.path}: ${m.trajectory_steps} steps, ${m.png_files} PNGs (expected ${m.trajectory_steps + 1} or ${m.trajectory_steps} PNGs)`
        );
        result.message = `${result.mismatches.length} mismatch(es): ${mismatchDetails.join('; ')}`;
    } else {
        result.message = "All step counts match";
    }
    
    return result;
}

/**
 * Criterion 11: Are there any unrequired files in the task folder?
 */
async function checkCriterion11UnrequiredFiles(modelName = null) {
    const result = {
        passed: true,
        unrequired_files: [],
        message: ""
    };
    
    // System file patterns
    const SYSTEM_FILE_PATTERNS = [
        'desktop.ini',
        'Thumbs.db',
        '.DS_Store',
        '._*',
        '~$*',
        '.git*',
        '.vscode*',
        '.idea*'
    ];
    
    // Video file extensions
    const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.m4v'];
    
    // Helper function to match pattern
    function matchesPattern(filename, pattern) {
        if (pattern.includes('*')) {
            const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
            return regex.test(filename);
        }
        return filename === pattern;
    }
    
    // Helper function to check if file is system file
    function isSystemFile(filename) {
        for (const pattern of SYSTEM_FILE_PATTERNS) {
            if (matchesPattern(filename, pattern)) {
                return true;
            }
        }
        return false;
    }
    
    // Helper function to check if file is video (excluding allowed recording.mp4)
    function isVideoFile(filePath) {
        const filename = filePath.split('/').pop();
        if (filename === 'recording.mp4') {
            return false; // recording.mp4 is allowed in Trajectory and Screenshot folders
        }
        const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
        return VIDEO_EXTENSIONS.includes(ext);
    }
    
    // Helper function to check if file is expected
    function isExpectedFile(filePath, modelName) {
        const parts = filePath.split('/').filter(p => p);
        const filename = parts[parts.length - 1];
        const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
        
        // Root level: only JSON files
        if (parts.length === 1) {
            return filename.endsWith('.json');
        }
        
        // SFT/Colab/: only .ipynb files
        if (parts.length === 3 && parts[0] === 'SFT' && parts[1] === 'Colab') {
            return ext === '.ipynb';
        }
        
        // SFT/Trajectory and Screenshot/: trajectory.jsonl, traj.jsonl, *.png, *.xml, evaluation_score.txt, recording.mp4
        if (parts.length === 3 && parts[0] === 'SFT' && parts[1] === 'Trajectory and Screenshot') {
            return (filename === 'trajectory.jsonl' || filename === 'traj.jsonl' ||
                    ext === '.png' || ext === '.xml' || filename === 'evaluation_score.txt' || filename === 'recording.mp4');
        }
        
        // SFT/: evaluation_score.txt (alternative location)
        if (parts.length === 2 && parts[0] === 'SFT') {
            return filename === 'evaluation_score.txt';
        }
        
        // Annotator Trajectory/*/Colab/: only .ipynb files
        if (parts.length === 4) {
            const annotatorRoots = ['Annotator Trajectory', 'Annotator_trajectory', 'Annotator trajectory'];
            if (annotatorRoots.includes(parts[0]) && parts[2] === 'Colab') {
                return ext === '.ipynb';
            }
        }
        
        // Annotator Trajectory/*/Trajectory and Screenshot/: trajectory.jsonl, traj.jsonl, *.png, *.xml, recording.mp4
        if (parts.length === 4) {
            const annotatorRoots = ['Annotator Trajectory', 'Annotator_trajectory', 'Annotator trajectory'];
            if (annotatorRoots.includes(parts[0]) && parts[2] === 'Trajectory and Screenshot') {
                return (filename === 'trajectory.jsonl' || filename === 'traj.jsonl' ||
                        ext === '.png' || ext === '.xml' || filename === 'recording.mp4');
            }
        }
        
        // Annotator Trajectory/*/: evaluation_score.txt (in annotator folder, not root)
        if (parts.length === 3) {
            const annotatorRoots = ['Annotator Trajectory', 'Annotator_trajectory', 'Annotator trajectory'];
            if (annotatorRoots.includes(parts[0])) {
                return filename === 'evaluation_score.txt';
            }
        }
        
        // Model folder/*/Trajectory and Screenshot/: *.png, *.xml, result.txt, run_id.txt, runtime.log, trajectory.jsonl, traj.jsonl, recording.mp4
        if (modelName && parts.length >= 3) {
            if (parts[0] === modelName && parts[parts.length - 2] === 'Trajectory and Screenshot') {
                return (ext === '.png' || ext === '.xml' || filename === 'result.txt' || filename === 'run_id.txt' || filename === 'runtime.log' ||
                        filename === 'trajectory.jsonl' || filename === 'traj.jsonl' || filename === 'recording.mp4');
            }
        }
        
        // Claude folder/*/Trajectory and Screenshot/: *.png, *.xml, result.txt, run_id.txt, runtime.log, trajectory.jsonl, traj.jsonl, recording.mp4
        // (fallback for when model name isn't detected but folder name contains "claude")
        if (parts.length >= 3) {
            const firstPart = parts[0].toLowerCase();
            if (firstPart.includes('claude') && parts[parts.length - 2] === 'Trajectory and Screenshot') {
                return (ext === '.png' || ext === '.xml' || filename === 'result.txt' || filename === 'run_id.txt' || filename === 'runtime.log' ||
                        filename === 'trajectory.jsonl' || filename === 'traj.jsonl' || filename === 'recording.mp4');
            }
        }
        
        // Model folder/*/: result.txt, run_id.txt, runtime.log (alternative location)
        if (modelName && parts.length === 2 && parts[0] === modelName) {
            return filename === 'result.txt' || filename === 'run_id.txt' || filename === 'runtime.log';
        }
        
        // Model folder/run_*/: result.txt, run_id.txt, runtime.log (run folder without Trajectory and Screenshot)
        if (modelName && parts.length === 3 && parts[0] === modelName) {
            const runFolderPattern = /^run_\d+$/i;
            if (runFolderPattern.test(parts[1])) {
                return filename === 'result.txt' || filename === 'run_id.txt' || filename === 'runtime.log';
            }
        }
        
        // Claude folder/*/: result.txt, run_id.txt, runtime.log (alternative location, fallback)
        if (parts.length === 2) {
            const firstPart = parts[0].toLowerCase();
            if (firstPart.includes('claude')) {
                return filename === 'result.txt' || filename === 'run_id.txt' || filename === 'runtime.log';
            }
        }
        
        // Claude folder/run_*/: result.txt, run_id.txt, runtime.log (run folder without Trajectory and Screenshot, fallback)
        if (parts.length === 3) {
            const firstPart = parts[0].toLowerCase();
            if (firstPart.includes('claude')) {
                const runFolderPattern = /^run_\d+$/i;
                if (runFolderPattern.test(parts[1])) {
                    return filename === 'result.txt' || filename === 'run_id.txt' || filename === 'runtime.log';
                }
            }
        }
        
        return false;
    }
    
    // Get all files from the file tree
    const allFiles = fileManager.getAllFilesWithPaths();
    
    for (const { file, path } of allFiles) {
        const filename = file.name;
        
        // Skip if it's an expected file
        if (isExpectedFile(path, modelName)) {
            continue;
        }
        
        // Check for system files
        if (isSystemFile(filename)) {
            result.unrequired_files.push({
                path: path,
                type: 'system',
                reason: 'System file'
            });
            continue;
        }
        
        // Check for video files
        if (isVideoFile(path)) {
            result.unrequired_files.push({
                path: path,
                type: 'video',
                reason: 'Video file'
            });
            continue;
        }
        
        // Any other unexpected file
        result.unrequired_files.push({
            path: path,
            type: 'other',
            reason: 'Unexpected file'
        });
    }
    
    result.passed = result.unrequired_files.length === 0;
    
    if (result.unrequired_files.length > 0) {
        const systemCount = result.unrequired_files.filter(f => f.type === 'system').length;
        const videoCount = result.unrequired_files.filter(f => f.type === 'video').length;
        const otherCount = result.unrequired_files.filter(f => f.type === 'other').length;
        
        const parts = [];
        if (systemCount > 0) {
            parts.push(`${systemCount} system file(s)`);
        }
        if (videoCount > 0) {
            parts.push(`${videoCount} video file(s)`);
        }
        if (otherCount > 0) {
            parts.push(`${otherCount} other file(s)`);
        }
        
        result.message = `Found ${result.unrequired_files.length} unrequired file(s): ${parts.join(', ')}`;
    } else {
        result.message = 'No unrequired files found';
    }
    
    return result;
}

/**
 * Get all assistant cells from all notebooks for comparison view
 */
async function getNotebookAssistantCellsForComparison(taskId = null) {
    const result = {
        sft: [],
        annotator_1: [],
        annotator_2: [],
        annotator_3: [],
        scores: {
            sft: null,
            annotator_1: null,
            annotator_2: null,
            annotator_3: null
        }
    };
    
    // SFT
    const sftDir = 'SFT';
    const sftColab = `${sftDir}/Colab`;
    if (fileManager.directoryExists(sftColab)) {
        const notebooks = fileManager.findFilesInTree(sftColab, '*.ipynb');
        if (notebooks.length > 0) {
            result.sft = await extractNotebookAssistantCells(notebooks[0]);
        }
    }
    
    // Get SFT score
    const sftScoreFile = utils.findEvaluationScore(sftDir, taskId);
    if (sftScoreFile) {
        const scoreText = await fileManager.readFileAsText(sftScoreFile);
        result.scores.sft = utils.parseEvaluationScore(scoreText);
    }
    
    // Annotators
    let annotatorRoot = 'Annotator Trajectory';
    if (!fileManager.directoryExists(annotatorRoot)) {
        for (const altName of ['Annotator_trajectory', 'Annotator trajectory']) {
            if (fileManager.directoryExists(altName)) {
                annotatorRoot = altName;
                break;
            }
        }
    }
    
    for (const idx of [1, 2, 3]) {
        for (const variant of [
            `annotator${idx}`,
            `annotator_${idx}`,
            `annotaor_${idx}`,
            `annotaor${idx}`,
            `annotator${idx.toString().padStart(2, '0')}`
        ]) {
            const annotDir = `${annotatorRoot}/${variant}`;
            if (fileManager.directoryExists(annotDir)) {
                const colabDir = `${annotDir}/Colab`;
                if (fileManager.directoryExists(colabDir)) {
                    const notebooks = fileManager.findFilesInTree(colabDir, '*.ipynb');
                    if (notebooks.length > 0) {
                        const key = `annotator_${idx}`;
                        result[key] = await extractNotebookAssistantCells(notebooks[0]);
                    }
                }
                
                // Get annotator score
                const scoreFile = fileManager.getFileFromTree(`${annotDir}/evaluation_score.txt`);
                if (scoreFile) {
                    const key = `annotator_${idx}`;
                    const scoreText = await fileManager.readFileAsText(scoreFile);
                    result.scores[key] = utils.parseEvaluationScore(scoreText);
                }
                break;
            }
        }
    }
    
    return result;
}

/**
 * Get trajectory action sequences for comparison view
 */
async function getTrajectoryComparisonData(taskId = null) {
    const result = {
        sft: [],
        annotator_1: [],
        annotator_2: [],
        annotator_3: [],
        similarities: {},
        scores: {
            sft: null,
            annotator_1: null,
            annotator_2: null,
            annotator_3: null
        }
    };
    
    const trajectories = {};
    
    // SFT
    const sftDir = 'SFT';
    const sftTrajDir = `${sftDir}/Trajectory and Screenshot`;
    const sftTrajFile = utils.findTrajectoryFile(sftTrajDir);
    if (sftTrajFile) {
        const steps = await fileManager.readFileAsJSONL(sftTrajFile);
        const actions = steps.map(step => String(step.action || ''));
        result.sft = actions;
        trajectories.sft = actions;
    }
    
    // Get SFT score
    const sftScoreFile = utils.findEvaluationScore(sftDir, taskId);
    if (sftScoreFile) {
        const scoreText = await fileManager.readFileAsText(sftScoreFile);
        result.scores.sft = utils.parseEvaluationScore(scoreText);
    }
    
    // Annotators
    let annotatorRoot = 'Annotator Trajectory';
    if (!fileManager.directoryExists(annotatorRoot)) {
        for (const altName of ['Annotator_trajectory', 'Annotator trajectory']) {
            if (fileManager.directoryExists(altName)) {
                annotatorRoot = altName;
                break;
            }
        }
    }
    
    for (const idx of [1, 2, 3]) {
        for (const variant of [
            `annotator${idx}`,
            `annotator_${idx}`,
            `annotaor_${idx}`,
            `annotaor${idx}`,
            `annotator${idx.toString().padStart(2, '0')}`
        ]) {
            const annotDir = `${annotatorRoot}/${variant}`;
            if (fileManager.directoryExists(annotDir)) {
                const trajDir = `${annotDir}/Trajectory and Screenshot`;
                if (fileManager.directoryExists(trajDir)) {
                    const trajFile = utils.findTrajectoryFile(trajDir);
                    if (trajFile) {
                        const steps = await fileManager.readFileAsJSONL(trajFile);
                        const actions = steps.map(step => String(step.action || ''));
                        const key = `annotator_${idx}`;
                        result[key] = actions;
                        trajectories[key] = actions;
                    }
                }
                
                // Get annotator score
                const scoreFile = fileManager.getFileFromTree(`${annotDir}/evaluation_score.txt`);
                if (scoreFile) {
                    const key = `annotator_${idx}`;
                    const scoreText = await fileManager.readFileAsText(scoreFile);
                    result.scores[key] = utils.parseEvaluationScore(scoreText);
                }
                break;
            }
        }
    }
    
    // Calculate similarities
    const trajectoryList = Object.entries(trajectories);
    for (let i = 0; i < trajectoryList.length; i++) {
        const [name1, actions1] = trajectoryList[i];
        for (let j = i + 1; j < trajectoryList.length; j++) {
            const [name2, actions2] = trajectoryList[j];
            const common = actions1.filter((a1, idx) => idx < actions2.length && a1 === actions2[idx] && a1).length;
            const maxLen = Math.max(actions1.length, actions2.length);
            const similarity = maxLen > 0 ? common / maxLen : 0.0;
            result.similarities[`${name1}_vs_${name2}`] = similarity;
        }
    }
    
    return result;
}

/**
 * Main analysis function - Run all 10 validation criteria
 */
async function analyzeTaskFolder(checkPNGXML = false) {
    // Find task JSON and model name
    const taskJSON = await utils.findTaskJSON();
    let taskId = null;
    let modelName = null;
    
    if (taskJSON) {
        taskId = taskJSON.taskId;
        modelName = await utils.getModelNameFromJSON(taskJSON.file);
    }
    
    const results = {
        task_id: taskId,
        model_name: modelName,
        folder_path: "",
        criteria: {}
    };
    
    // Run all checks in parallel where possible
    const [
        criterion1,
        criterion2,
        criterion3,
        criterion4,
        criterion5,
        criterion6,
        criterion7,
        criterion8,
        criterion9,
        criterion10,
        criterion11
    ] = await Promise.all([
        checkCriterion1SFTStepCount(modelName),
        checkCriterion2EvaluationScores(taskId || ''),
        checkCriterion3AnnotatorZeroScore(),
        checkCriterion4NotebookAssistantCells(),
        checkCriterion5DuplicateDetection(),
        checkCriterion6RunScoreAverage(modelName),
        checkCriterion7RunFolderCount(modelName),
        checkCriterion8MissingResultFiles(modelName),
        checkCriterion9PNGXMLMatch(checkPNGXML),
        checkCriterion10StepCountMatch(),
        checkCriterion11UnrequiredFiles(modelName)
    ]);
    
    results.criteria['1_sft_step_count'] = criterion1;
    results.criteria['2_evaluation_scores'] = criterion2;
    results.criteria['3_annotator_zero'] = criterion3;
    results.criteria['4_notebook_assistant'] = criterion4;
    results.criteria['5_duplicate_detection'] = criterion5;
    results.criteria['6_run_score_average'] = criterion6;
    results.criteria['7_run_folder_count'] = criterion7;
    results.criteria['8_missing_results'] = criterion8;
    results.criteria['9_png_xml_match'] = criterion9;
    results.criteria['10_step_count_match'] = criterion10;
    results.criteria['11_unrequired_files'] = criterion11;
    
    return results;
}

/**
 * Get screenshot and action data for a specific step
 */
async function getScreenshotPath(trajectoryType, stepIndex) {
    const result = {
        screenshot: "",
        action: null,
        drag_end: null
    };
    
    try {
        // Determine trajectory directory
        let trajDir;
        if (trajectoryType === "sft") {
            trajDir = 'SFT/Trajectory and Screenshot';
        } else {
            const annotatorNumStr = trajectoryType.replace("annotator_", "");
            let annotatorRoot = 'Annotator Trajectory';
            if (!fileManager.directoryExists(annotatorRoot)) {
                for (const altName of ['Annotator_trajectory', 'Annotator trajectory']) {
                    if (fileManager.directoryExists(altName)) {
                        annotatorRoot = altName;
                        break;
                    }
                }
            }
            
            const variants = [
                `annotator${annotatorNumStr}`,
                `annotator_${annotatorNumStr}`,
                `annotaor_${annotatorNumStr}`,
                `annotaor${annotatorNumStr}`
            ];
            
            const annotatorNumInt = parseInt(annotatorNumStr);
            if (!isNaN(annotatorNumInt)) {
                variants.push(`annotator${annotatorNumInt.toString().padStart(2, '0')}`);
            }
            
            trajDir = null;
            for (const variant of variants) {
                const annotDir = `${annotatorRoot}/${variant}/Trajectory and Screenshot`;
                if (fileManager.directoryExists(annotDir)) {
                    trajDir = annotDir;
                    break;
                }
            }
            
            if (!trajDir) {
                return result;
            }
        }
        
        // Get trajectory data
        const trajFile = utils.findTrajectoryFile(trajDir);
        let steps = [];
        if (trajFile) {
            steps = await fileManager.readFileAsJSONL(trajFile);
        }
        
        // Parse action for this step
        if (stepIndex < steps.length) {
            const stepData = steps[stepIndex];
            const actionStr = String(stepData.action || '');
            result.action = utils.parsePyautoguiAction(actionStr);
            
            // Check for drag operation: mouseDown -> moveTo -> mouseUp
            if (result.action.action_type === "mouseDown") {
                if (stepIndex + 1 < steps.length) {
                    const nextActionStr = String(steps[stepIndex + 1].action || '');
                    const nextAction = utils.parsePyautoguiAction(nextActionStr);
                    if (nextAction.action_type === "moveTo") {
                        result.drag_end = {
                            x: nextAction.x,
                            y: nextAction.y
                        };
                    }
                }
            }
        }
        
        // Try to get screenshot from trajectory.jsonl observation
        if (stepIndex < steps.length) {
            const stepData = steps[stepIndex];
            const observation = stepData.observation || {};
            const screenshotPathStr = observation.screenshot;
            
            if (screenshotPathStr) {
                // Try to find the screenshot file
                const screenshotFile = fileManager.getFileFromTree(screenshotPathStr) ||
                    fileManager.getFileFromTree(`${trajDir}/${screenshotPathStr}`);
                
                if (screenshotFile) {
                    result.screenshot = await fileManager.readFileAsDataURL(screenshotFile);
                    return result;
                }
            }
        }
        
        // Fallback: Try different screenshot naming patterns
        const screenshotPatterns = [
            `step_${stepIndex}_before.png`,
            `step_${stepIndex.toString().padStart(4, '0')}_before.png`,
            `step_${stepIndex}_after.png`,
            `step_${stepIndex.toString().padStart(4, '0')}_after.png`,
            `step_${stepIndex}.png`,
            `step_${stepIndex.toString().padStart(4, '0')}.png`
        ];
        
        for (const pattern of screenshotPatterns) {
            const screenshotFile = fileManager.getFileFromTree(`${trajDir}/${pattern}`);
            if (screenshotFile) {
                result.screenshot = await fileManager.readFileAsDataURL(screenshotFile);
                return result;
            }
        }
        
        // Last resort: find any PNG file that might match by step number
        const allPNGs = fileManager.findFilesInTree(trajDir, '*.png');
        for (const pngFile of allPNGs) {
            const filename = pngFile.name.toLowerCase();
            if (filename.includes(`step_${stepIndex}_`) || filename === `step_${stepIndex}.png`) {
                result.screenshot = await fileManager.readFileAsDataURL(pngFile);
                return result;
            }
            const paddedStep = stepIndex.toString().padStart(4, '0');
            if (filename.includes(`step_${paddedStep}_`) || filename === `step_${paddedStep}.png`) {
                result.screenshot = await fileManager.readFileAsDataURL(pngFile);
                return result;
            }
        }
        
    } catch (e) {
        console.error('Error getting screenshot:', e);
    }
    
    return result;
}

// Export functions
window.analyzer = {
    analyzeTaskFolder,
    getNotebookAssistantCellsForComparison,
    getTrajectoryComparisonData,
    getScreenshotPath,
    extractNotebookAssistantCells,
    hashTrajectoryActions
};


