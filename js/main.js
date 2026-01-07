/* Main frontend logic for WebSypher */

let currentFolderName = '';
let currentAnalysisResults = null;
let currentNotebookData = null;
let currentTrajectoryData = null;

// Animation state for overlay rendering
let animationState = {
    running: false,
    frameId: null,
    phase: 0,
    dashOffset: 0,
    currentAction: null,
    dragEnd: null,
    imageWidth: 0,
    imageHeight: 0,
    overlayOpacity: 1.0,  // 0.0 to 1.0
    currentImage: null,  // Store the current image for redraws
    displayWidth: 0,  // Current display width
    displayHeight: 0  // Current display height
};

// Fullscreen state
let isFullscreen = false;
let originalCanvasSize = { width: 0, height: 0 };

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7fd68ed9-e1c9-4c80-b5ab-135c80385bda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:29',message:'DOMContentLoaded fired',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
        setupEventListeners();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7fd68ed9-e1c9-4c80-b5ab-135c80385bda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:35',message:'setupEventListeners completed successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
    } catch (error) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/7fd68ed9-e1c9-4c80-b5ab-135c80385bda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:37',message:'ERROR in setupEventListeners',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('Error in setupEventListeners:', error);
    }
    try {
        initScreenshotModal();
        initCriterion9Modal();
    } catch (error) {
        console.error('Error in initScreenshotModal:', error);
    }
});

// Global error handler
window.addEventListener('error', (event) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7fd68ed9-e1c9-4c80-b5ab-135c80385bda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:48',message:'Global JavaScript error',data:{message:event.message,filename:event.filename,lineno:event.lineno},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
});

// Setup event listeners
function setupEventListeners() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7fd68ed9-e1c9-4c80-b5ab-135c80385bda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:35',message:'setupEventListeners called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // File input for folder selection
    const fileInput = document.getElementById('folder-input');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7fd68ed9-e1c9-4c80-b5ab-135c80385bda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:39',message:'fileInput element lookup',data:{found:!!fileInput,id:'folder-input'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (fileInput) {
        fileInput.addEventListener('change', handleFolderSelection);
    }
    
    // Browse button triggers file input
    const browseBtn = document.getElementById('browse-btn');
    // #region agent log
    console.log('[DEBUG] browseBtn lookup:', !!browseBtn, 'fileInput:', !!fileInput);
    fetch('http://127.0.0.1:7242/ingest/7fd68ed9-e1c9-4c80-b5ab-135c80385bda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:46',message:'browseBtn element lookup',data:{found:!!browseBtn,fileInputFound:!!fileInput,id:'browse-btn'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (browseBtn) {
        browseBtn.addEventListener('click', () => {
            // #region agent log
            console.log('[DEBUG] browseBtn clicked, fileInput:', !!fileInput, fileInput);
            fetch('http://127.0.0.1:7242/ingest/7fd68ed9-e1c9-4c80-b5ab-135c80385bda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:50',message:'browseBtn click handler fired',data:{fileInputExists:!!fileInput},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            // #region agent log
            console.log('[DEBUG] Before fileInput.click(), fileInput:', fileInput);
            fetch('http://127.0.0.1:7242/ingest/7fd68ed9-e1c9-4c80-b5ab-135c80385bda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:52',message:'Before fileInput.click()',data:{fileInputType:fileInput?.type,fileInputDisplay:fileInput?.style?.display},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            fileInput?.click();
            // #region agent log
            console.log('[DEBUG] After fileInput.click()');
            fetch('http://127.0.0.1:7242/ingest/7fd68ed9-e1c9-4c80-b5ab-135c80385bda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:55',message:'After fileInput.click()',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
        });
        // #region agent log
        console.log('[DEBUG] browseBtn click listener attached');
        fetch('http://127.0.0.1:7242/ingest/7fd68ed9-e1c9-4c80-b5ab-135c80385bda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:58',message:'browseBtn click listener attached',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
    } else {
        // #region agent log
        console.error('[DEBUG] browseBtn NOT FOUND');
        fetch('http://127.0.0.1:7242/ingest/7fd68ed9-e1c9-4c80-b5ab-135c80385bda',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.js:60',message:'browseBtn NOT FOUND',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
    }
    
    // Drag and drop zone
    const dragDropZone = document.getElementById('drag-drop-zone');
    if (dragDropZone) {
        dragDropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dragDropZone.classList.add('drag-over');
        });
        
        dragDropZone.addEventListener('dragleave', () => {
            dragDropZone.classList.remove('drag-over');
        });
        
        dragDropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dragDropZone.classList.remove('drag-over');
            
            const items = e.dataTransfer.items;
            if (items && items.length > 0) {
                // Check if it's a directory
                const entry = items[0].webkitGetAsEntry();
                if (entry && entry.isDirectory) {
                    // Get all files from the directory
                    readDirectoryEntry(entry);
                } else {
                    // Fallback: try to get files
                    const files = Array.from(e.dataTransfer.files);
                    if (files.length > 0) {
                        handleFiles(files);
                    }
                }
            } else {
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                    handleFiles(files);
                }
            }
        });
        
        dragDropZone.addEventListener('click', () => {
            fileInput?.click();
        });
    }

    document.getElementById('analyze-btn').addEventListener('click', analyzeFolder);

    // Tab switching
    document.querySelectorAll('.comparison-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            if (tab === 'notebook' || tab === 'trajectory') {
                document.querySelectorAll('.comparison-tabs .tab-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.target.classList.add('active');
                
                document.getElementById('notebook-panel').classList.remove('active');
                document.getElementById('trajectory-panel').classList.remove('active');
                
                if (tab === 'notebook') {
                    document.getElementById('notebook-panel').classList.add('active');
                } else if (tab === 'trajectory') {
                    document.getElementById('trajectory-panel').classList.add('active');
                }
            }
        });
    });

    // Comparison views
    document.getElementById('notebook-search').addEventListener('input', filterNotebookCells);
    document.getElementById('trajectory-filter').addEventListener('change', filterTrajectoryActions);
    document.getElementById('export-notebook').addEventListener('click', exportNotebookComparison);
    document.getElementById('export-trajectory').addEventListener('click', exportTrajectoryComparison);
}

// Handle folder selection from file input
function handleFolderSelection(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        handleFiles(files);
    }
}

// Read directory entry (for drag-drop)
function readDirectoryEntry(entry) {
    const files = [];
    const rootName = entry.name;
    
    function readEntries(dirReader, currentPath = '') {
        dirReader.readEntries((entries) => {
            if (entries.length === 0) {
                // Done reading, process files
                if (files.length > 0) {
                    // Add webkitRelativePath to files for consistent handling
                    files.forEach(file => {
                        if (!file.webkitRelativePath && file._relativePath) {
                            file.webkitRelativePath = file._relativePath;
                        }
                    });
                    handleFiles(files);
                }
                return;
            }
            
            entries.forEach(entry => {
                const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
                
                if (entry.isFile) {
                    entry.file((file) => {
                        // Store relative path for later use
                        file._relativePath = entryPath;
                        files.push(file);
                    });
                } else if (entry.isDirectory) {
                    const subReader = entry.createReader();
                    readEntries(subReader, entryPath);
                }
            });
            
            // Continue reading
            readEntries(dirReader, currentPath);
        });
    }
    
    const reader = entry.createReader();
    readEntries(reader);
}

// Handle files from selection
async function handleFiles(files) {
    const statusDiv = document.getElementById('folder-status');
    const analyzeBtn = document.getElementById('analyze-btn');
    const folderPathInput = document.getElementById('folder-path');
    
    statusDiv.textContent = 'Processing folder...';
    statusDiv.className = 'status-message';
    analyzeBtn.disabled = true;
    
    try {
        // Build file tree
        fileManager.buildFileTree(files);
        
        // Get folder name from first file's path
        if (files.length > 0) {
            const firstPath = files[0].webkitRelativePath || files[0].name;
            const pathParts = firstPath.split('/');
            currentFolderName = pathParts[0] || 'Selected Folder';
        } else {
            currentFolderName = 'Selected Folder';
        }
        
        // Update UI
        if (folderPathInput) {
            folderPathInput.value = currentFolderName;
        }
        
        // Try to get model name to verify folder is valid
        const taskJSON = await utils.findTaskJSON();
        let modelName = null;
        if (taskJSON) {
            modelName = await utils.getModelNameFromJSON(taskJSON.file);
        }
        
        if (modelName) {
            statusDiv.textContent = `✓ Valid task folder. Model: ${modelName}`;
            statusDiv.className = 'status-message success';
            analyzeBtn.disabled = false;
            
            // Update task info
            document.getElementById('model-name').textContent = modelName;
            document.getElementById('task-id').textContent = taskJSON.taskId || currentFolderName;
            document.getElementById('task-info').style.display = 'block';
        } else {
            statusDiv.textContent = '⚠ Could not detect model name. Folder may be invalid.';
            statusDiv.className = 'status-message warning';
            analyzeBtn.disabled = false; // Allow analysis anyway
        }
    } catch (error) {
        console.error('Error processing folder:', error);
        statusDiv.textContent = `✗ Error: ${error.message}`;
        statusDiv.className = 'status-message error';
        analyzeBtn.disabled = true;
    }
}

// Analyze folder
async function analyzeFolder() {
    const analyzeBtn = document.getElementById('analyze-btn');
    const statusDiv = document.getElementById('folder-status');
    const checkPngXml = document.getElementById('check-png-xml').checked;
    
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    statusDiv.textContent = 'Analyzing task folder...';
    statusDiv.className = 'status-message';

    try {
        const results = await analyzer.analyzeTaskFolder(checkPngXml);
        currentAnalysisResults = results;
        
        displayAnalysisResults(results);
        
        // Load comparison data
        await loadComparisonData();
        
        statusDiv.textContent = '✓ Analysis complete';
        statusDiv.className = 'status-message success';
    } catch (error) {
        console.error('Analysis error:', error);
        statusDiv.textContent = `✗ Analysis failed: ${error.message}`;
        statusDiv.className = 'status-message error';
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Analyze';
    }
}

// Display analysis results
function displayAnalysisResults(results) {
    const resultsGrid = document.getElementById('results-grid');
    resultsGrid.innerHTML = '';
    
    const criteria = [
        { key: '1_sft_step_count', name: 'Criterion 1: SFT Step Count', description: 'Does SFT have the lowest number of steps?' },
        { key: '2_evaluation_scores', name: 'Criterion 2: Evaluation Scores', description: 'Is SFT and at least one annotator score 1.0?' },
        { key: '3_annotator_zero', name: 'Criterion 3: Annotator Zero Score', description: 'Is annotator 2 or 3 score equal to 0?' },
        { key: '4_notebook_assistant', name: 'Criterion 4: Notebook Assistant Cells', description: 'Are assistant descriptions properly written?', review: true },
        { key: '5_duplicate_detection', name: 'Criterion 5: Duplicate Detection', description: 'Are any trajectories copies?', review: true },
        { key: '6_run_score_average', name: 'Criterion 6: Run Score Average', description: 'Is average score < 1.0?' },
        { key: '7_run_folder_count', name: 'Criterion 7: Run Folder Count', description: 'Folder vs result file count' },
        { key: '8_missing_results', name: 'Criterion 8: Missing Result Files', description: 'Are there missing result.txt files?' },
        { key: '9_png_xml_match', name: 'Criterion 9: PNG/XML Match', description: 'Do PNG and XML counts match?' },
        { key: '10_step_count_match', name: 'Criterion 10: Step Count Match', description: 'Do PNG counts match step count + 1 (for final state screenshot)?' },
        { key: '11_unrequired_files', name: 'Criterion 11: Unrequired Files', description: 'Are there any unrequired files in the task folder?' },
    ];
    
    criteria.forEach(criterion => {
        const result = results.criteria[criterion.key] || {};
        const passed = result.passed !== false;
        const status = passed ? 'passed' : 'failed';
        const badgeClass = passed ? 'passed' : (result.passed === undefined ? 'warning' : 'failed');
        
        // Build detailed mismatch display for Criterion 10
        let mismatchDetails = '';
        if (criterion.key === '10_step_count_match' && result.mismatches && result.mismatches.length > 0) {
            mismatchDetails = '<div style="margin-top: 10px; padding: 10px; background: rgba(255,0,0,0.1); border-radius: 4px;">';
            mismatchDetails += '<strong>Mismatch Details:</strong><ul style="margin: 5px 0; padding-left: 20px;">';
            result.mismatches.forEach(mismatch => {
                mismatchDetails += `<li><strong>${mismatch.path}</strong>: ${mismatch.trajectory_steps} steps, ${mismatch.png_files} PNGs (expected ${mismatch.trajectory_steps + 1} or ${mismatch.trajectory_steps})</li>`;
            });
            mismatchDetails += '</ul></div>';
        }
        
        // Build unrequired files display for Criterion 11
        if (criterion.key === '11_unrequired_files' && result.unrequired_files && result.unrequired_files.length > 0) {
            mismatchDetails = '<div style="margin-top: 10px; padding: 10px; background: rgba(255,0,0,0.1); border-radius: 4px;">';
            mismatchDetails += '<strong>Unrequired Files:</strong><ul style="margin: 5px 0; padding-left: 20px; max-height: 200px; overflow-y: auto;">';
            result.unrequired_files.forEach(file => {
                const typeLabel = file.type === 'system' ? '🔧 System' : (file.type === 'video' ? '🎥 Video' : '📄 Other');
                mismatchDetails += `<li><strong>${typeLabel}:</strong> ${escapeHtml(file.path)} <span style="opacity: 0.7; font-size: 0.85em;">(${file.reason})</span></li>`;
            });
            mismatchDetails += '</ul></div>';
        }
        
        const card = document.createElement('div');
        card.className = `result-card ${status}`;
        
        // Make Criterion 9 card clickable if there are mismatches
        if (criterion.key === '9_png_xml_match' && result.mismatches && result.mismatches.length > 0) {
            card.style.cursor = 'pointer';
            card.title = 'Click to view mismatch details';
            card.addEventListener('click', () => {
                openCriterion9DetailsModal(result.mismatches);
            });
        }
        
        card.innerHTML = `
            <div class="status-badge ${badgeClass}">${badgeClass.toUpperCase()}</div>
            <h3>${criterion.name}</h3>
            <p class="message">${criterion.description}</p>
            <p class="message">${result.message || 'No data'}</p>
            ${mismatchDetails}
            ${criterion.review ? `<button class="btn btn-primary" onclick="openReviewPanel('${criterion.key}')" style="margin-top: 10px;">Review Details</button>` : ''}
        `;
        
        resultsGrid.appendChild(card);
    });
    
    document.getElementById('results-section').style.display = 'block';
    document.getElementById('comparison-section').style.display = 'block';
    document.getElementById('task-info-section').style.display = 'block';
    
    // Load task information
    loadTaskInfo();
}

// Load comparison data
async function loadComparisonData() {
    try {
        console.log('Loading comparison data...');
        console.log('File tree root:', Object.keys(fileManager.getFileTree()));
        
        const taskJSON = await utils.findTaskJSON();
        console.log('Task JSON found:', taskJSON);
        const taskId = taskJSON ? taskJSON.taskId : null;
        
        // Debug: Check if directories exist
        console.log('SFT exists:', fileManager.directoryExists('SFT'));
        console.log('SFT/Colab exists:', fileManager.directoryExists('SFT/Colab'));
        console.log('Annotator Trajectory exists:', fileManager.directoryExists('Annotator Trajectory'));
        
        console.log('Loading notebook data...');
        currentNotebookData = await analyzer.getNotebookAssistantCellsForComparison(taskId);
        console.log('Notebook data:', currentNotebookData);
        displayNotebookComparison(currentNotebookData);
        
        console.log('Loading trajectory data...');
        currentTrajectoryData = await analyzer.getTrajectoryComparisonData(taskId);
        console.log('Trajectory data:', currentTrajectoryData);
        displayTrajectoryComparison(currentTrajectoryData);
    } catch (error) {
        console.error('Error loading comparison data:', error);
        console.error('Error stack:', error.stack);
    }
}

// Load task information
async function loadTaskInfo() {
    try {
        const taskJSON = await utils.findTaskJSON();
        if (taskJSON) {
            const taskInfo = await utils.getTaskInfo(taskJSON.file);
            displayTaskInfo(taskInfo);
        }
    } catch (error) {
        console.error('Error loading task info:', error);
    }
}

// Display task information
function displayTaskInfo(taskInfo) {
    // Instruction
    const instructionDiv = document.getElementById('task-instruction');
    if (taskInfo.instruction) {
        instructionDiv.innerHTML = linkifyUrls(escapeHtml(taskInfo.instruction));
    } else {
        instructionDiv.textContent = 'No instruction found';
    }
    
    // Snapshot
    const snapshotDiv = document.getElementById('task-snapshot');
    if (taskInfo.snapshot) {
        snapshotDiv.textContent = taskInfo.snapshot;
    } else {
        snapshotDiv.textContent = 'No snapshot found';
    }
    
    // Related Apps
    const relatedAppsDiv = document.getElementById('task-related-apps');
    if (taskInfo.related_apps && Array.isArray(taskInfo.related_apps) && taskInfo.related_apps.length > 0) {
        relatedAppsDiv.textContent = taskInfo.related_apps.join(', ');
    } else {
        relatedAppsDiv.textContent = 'No related apps found';
    }
    
    // Config
    const configDiv = document.getElementById('task-config');
    if (taskInfo.config && Object.keys(taskInfo.config).length > 0) {
        configDiv.innerHTML = formatJsonObject(taskInfo.config);
    } else {
        configDiv.textContent = 'No configuration found';
    }
    
    // Evaluator
    const evaluatorDiv = document.getElementById('task-evaluator');
    if (taskInfo.evaluator && Object.keys(taskInfo.evaluator).length > 0) {
        evaluatorDiv.innerHTML = formatJsonObject(taskInfo.evaluator);
    } else {
        evaluatorDiv.textContent = 'No evaluator configuration found';
    }
    
    // Model Pass Rate
    const modelPassRateDiv = document.getElementById('task-model-pass-rate');
    if (taskInfo.model_pass_rate && Object.keys(taskInfo.model_pass_rate).length > 0) {
        modelPassRateDiv.innerHTML = formatModelPassRate(taskInfo.model_pass_rate);
    } else {
        modelPassRateDiv.textContent = 'No model pass rate data found';
    }
}

// Format JSON object for display
function formatJsonObject(obj, indent = 0) {
    if (obj === null || obj === undefined) {
        return '<span class="json-null">null</span>';
    }
    
    if (typeof obj !== 'object') {
        if (typeof obj === 'string') {
            const escaped = escapeHtml(String(obj));
            const linkified = linkifyUrls(escaped);
            return `<span class="json-string">"${linkified}"</span>`;
        } else if (typeof obj === 'number') {
            return `<span class="json-number">${obj}</span>`;
        } else if (typeof obj === 'boolean') {
            return `<span class="json-boolean">${obj}</span>`;
        }
        return escapeHtml(String(obj));
    }
    
    if (Array.isArray(obj)) {
        if (obj.length === 0) {
            return '<span class="json-array">[]</span>';
        }
        const items = obj.map(item => {
            const indented = '&nbsp;'.repeat((indent + 1) * 2);
            return `${indented}${formatJsonObject(item, indent + 1)}`;
        }).join(',<br>');
        return `<span class="json-array">[<br>${items}<br>${'&nbsp;'.repeat(indent * 2)}]</span>`;
    }
    
    const keys = Object.keys(obj);
    if (keys.length === 0) {
        return '<span class="json-object">{}</span>';
    }
    
    const items = keys.map(key => {
        const indented = '&nbsp;'.repeat((indent + 1) * 2);
        const value = formatJsonObject(obj[key], indent + 1);
        return `${indented}<span class="json-key">"${escapeHtml(key)}"</span>: ${value}`;
    }).join(',<br>');
    
    return `<span class="json-object">{<br>${items}<br>${'&nbsp;'.repeat(indent * 2)}}</span>`;
}

// Format model pass rate for display
function formatModelPassRate(modelPassRate) {
    const entries = Object.entries(modelPassRate);
    if (entries.length === 0) {
        return 'No data';
    }
    
    return entries.map(([model, rate]) => {
        const rateNum = typeof rate === 'number' ? rate : parseFloat(rate);
        const rateClass = rateNum >= 0.5 ? 'pass-rate-high' : (rateNum >= 0.25 ? 'pass-rate-medium' : 'pass-rate-low');
        return `<div class="model-pass-rate-item">
            <span class="model-name">${escapeHtml(model)}</span>
            <span class="pass-rate ${rateClass}">${(rateNum * 100).toFixed(1)}%</span>
        </div>`;
    }).join('');
}

// Display notebook comparison
function displayNotebookComparison(data) {
    const columns = ['sft', 'annotator_1', 'annotator_2', 'annotator_3'];
    const columnIds = ['notebook-sft', 'notebook-ann1', 'notebook-ann2', 'notebook-ann3'];
    const columnHeaders = ['notebook-sft-header', 'notebook-ann1-header', 'notebook-ann2-header', 'notebook-ann3-header'];
    
    columns.forEach((col, idx) => {
        const container = document.getElementById(columnIds[idx]);
        const header = document.getElementById(columnHeaders[idx]);
        
        // Display score in header
        const score = data.scores && data.scores[col];
        if (header) {
            const scoreText = score !== null && score !== undefined ? `Score: ${score.toFixed(2)}` : 'Score: N/A';
            const scoreClass = score === 1.0 ? 'score-pass' : (score === 0.0 ? 'score-fail' : 'score-partial');
            if (col === 'sft') {
                header.innerHTML = `<h3>SFT</h3><div class="score-badge ${scoreClass}">${scoreText}</div>`;
            } else {
                const annotatorNum = col.replace('annotator_', '');
                header.innerHTML = `<h3>Annotator ${annotatorNum}</h3><div class="score-badge ${scoreClass}">${scoreText}</div>`;
            }
        }
        
        container.innerHTML = '';
        
        const cells = data[col] || [];
        cells.forEach((cell, cellIdx) => {
            const quality = getCellQuality(cell);
            const cellDiv = document.createElement('div');
            cellDiv.className = `notebook-cell ${quality}`;
            cellDiv.style.cursor = 'pointer';
            cellDiv.dataset.step = cell.step;
            cellDiv.dataset.trajectory = col;
            const stepLabel = `Step ${cell.step + 1}`;
            cellDiv.innerHTML = `
                <div class="cell-header">
                    <span class="cell-step">${stepLabel}</span>
                    <span class="cell-stats">${cell.word_count} words</span>
                </div>
                <div class="cell-content">${escapeHtml(cell.content)}</div>
            `;
            
            cellDiv.addEventListener('click', () => showScreenshot(col, cell.step + 1));
            
            container.appendChild(cellDiv);
        });
    });
}

// Get cell quality
function getCellQuality(cell) {
    const content = cell.content.toLowerCase();
    if (content.includes('executing step') && cell.word_count < 20) {
        return 'bad';
    } else if (content.includes('executing step') && cell.word_count >= 20) {
        return 'generic';
    } else {
        return 'good';
    }
}

// Display trajectory comparison
function displayTrajectoryComparison(data) {
    // Display similarity matrix
    const matrixDiv = document.getElementById('similarity-matrix');
    matrixDiv.innerHTML = '';
    
    const trajectories = ['sft', 'annotator_1', 'annotator_2', 'annotator_3'];
    const similarities = data.similarities || {};
    
    // Create header row
    const headerRow = document.createElement('div');
    headerRow.className = 'similarity-row header-row';
    headerRow.innerHTML = '<div class="similarity-cell empty-cell"></div>'; // Top-left empty cell
    trajectories.forEach(traj => {
        const cell = document.createElement('div');
        cell.className = 'similarity-cell header-cell';
        cell.textContent = traj.replace('_', ' ').toUpperCase();
        headerRow.appendChild(cell);
    });
    matrixDiv.appendChild(headerRow);
    
    // Create data rows
    trajectories.forEach((rowTraj, rowIndex) => {
        const dataRow = document.createElement('div');
        dataRow.className = 'similarity-row';
        
        // Add row label
        const rowLabelCell = document.createElement('div');
        rowLabelCell.className = 'similarity-cell header-cell';
        rowLabelCell.textContent = rowTraj.replace('_', ' ').toUpperCase();
        dataRow.appendChild(rowLabelCell);
        
        trajectories.forEach((colTraj, colIndex) => {
            const cell = document.createElement('div');
            cell.className = 'similarity-cell';
            
            if (rowIndex === colIndex) {
                // Diagonal: comparing to itself
                cell.textContent = '—';
            } else {
                // Find similarity value
                let key;
                if (rowIndex < colIndex) {
                    key = `${rowTraj}_vs_${colTraj}`;
                } else {
                    key = `${colTraj}_vs_${rowTraj}`;
                }
                const value = similarities[key];
                if (value !== undefined) {
                    cell.innerHTML = `<span class="similarity-value">${(value * 100).toFixed(1)}%</span>`;
                } else {
                    cell.textContent = 'N/A';
                }
            }
            dataRow.appendChild(cell);
        });
        matrixDiv.appendChild(dataRow);
    });
    
    // Display trajectories
    const columnIds = ['trajectory-sft', 'trajectory-ann1', 'trajectory-ann2', 'trajectory-ann3'];
    trajectories.forEach((traj, idx) => {
        const container = document.getElementById(columnIds[idx]);
        container.innerHTML = '';
        
        const actions = data[traj] || [];
        actions.forEach((action, actionIdx) => {
            const actionDiv = document.createElement('div');
            actionDiv.className = 'trajectory-action';
            actionDiv.dataset.step = actionIdx;
            actionDiv.dataset.trajectory = traj;
            const stepLabel = `${actionIdx + 1}:`;
            actionDiv.innerHTML = `
                <span class="action-step">${stepLabel}</span>
                <span class="action-text">${escapeHtml(action)}</span>
            `;
            
            actionDiv.addEventListener('click', () => {
                highlightAction(actionIdx, traj);
                showScreenshot(traj, actionIdx + 1);
            });
            
            container.appendChild(actionDiv);
        });
    });
    
    // Mark identical/different actions
    markTrajectorySimilarities(data);
}

// Mark trajectory similarities
function markTrajectorySimilarities(data) {
    const trajectories = ['sft', 'annotator_1', 'annotator_2', 'annotator_3'];
    const maxLength = Math.max(...trajectories.map(t => (data[t] || []).length));
    
    for (let i = 0; i < maxLength; i++) {
        const actions = trajectories.map(t => (data[t] || [])[i]);
        const allSame = actions.every(a => a === actions[0] && actions[0]);
        
        trajectories.forEach((traj, idx) => {
            const actionDiv = document.querySelector(`[data-trajectory="${traj}"][data-step="${i}"]`);
            if (actionDiv) {
                if (allSame && actions[0]) {
                    actionDiv.classList.add('identical');
                } else if (actions[idx]) {
                    actionDiv.classList.add('different');
                }
            }
        });
    }
}

// Highlight action across all columns
function highlightAction(step, sourceTraj) {
    document.querySelectorAll('.trajectory-action').forEach(div => {
        div.style.background = '';
    });
    
    document.querySelectorAll(`[data-step="${step}"]`).forEach(div => {
        div.style.background = 'rgba(0, 255, 65, 0.3)';
    });
}

// Filter notebook cells
function filterNotebookCells() {
    const searchTerm = document.getElementById('notebook-search').value.toLowerCase();
    document.querySelectorAll('.notebook-cell').forEach(cell => {
        const content = cell.textContent.toLowerCase();
        cell.style.display = content.includes(searchTerm) ? 'block' : 'none';
    });
}

// Filter trajectory actions
function filterTrajectoryActions() {
    const filter = document.getElementById('trajectory-filter').value;
    document.querySelectorAll('.trajectory-action').forEach(action => {
        if (filter === 'all') {
            action.style.display = 'block';
        } else if (filter === 'diff') {
            action.style.display = action.classList.contains('different') ? 'block' : 'none';
        } else if (filter === 'same') {
            action.style.display = action.classList.contains('identical') ? 'block' : 'none';
        }
    });
}

// Export functions
function exportNotebookComparison() {
    if (!currentNotebookData) return;
    
    let text = 'Notebook Assistant Cell Comparison\n';
    text += '='.repeat(50) + '\n\n';
    
    ['sft', 'annotator_1', 'annotator_2', 'annotator_3'].forEach(col => {
        text += `\n${col.toUpperCase().replace('_', ' ')}\n`;
        text += '-'.repeat(50) + '\n';
        (currentNotebookData[col] || []).forEach((cell, idx) => {
            text += `\nStep ${cell.step}:\n${cell.content}\n`;
        });
    });
    
    downloadText(text, 'notebook_comparison.txt');
}

function exportTrajectoryComparison() {
    if (!currentTrajectoryData) return;
    
    let text = 'Trajectory Comparison Report\n';
    text += '='.repeat(50) + '\n\n';
    
    text += 'Similarity Matrix:\n';
    Object.entries(currentTrajectoryData.similarities || {}).forEach(([key, value]) => {
        text += `${key}: ${(value * 100).toFixed(1)}%\n`;
    });
    
    text += '\n\nAction Sequences:\n';
    ['sft', 'annotator_1', 'annotator_2', 'annotator_3'].forEach(traj => {
        text += `\n${traj.toUpperCase().replace('_', ' ')}\n`;
        text += '-'.repeat(50) + '\n';
        (currentTrajectoryData[traj] || []).forEach((action) => {
            text += `${action}\n`;
        });
    });
    
    downloadText(text, 'trajectory_comparison.txt');
}

function downloadText(text, filename) {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Open review panel
function openReviewPanel(criterion) {
    if (criterion === '4_notebook_assistant') {
        document.querySelectorAll('.comparison-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === 'notebook') {
                btn.classList.add('active');
            }
        });
        document.getElementById('notebook-panel').classList.add('active');
        document.getElementById('trajectory-panel').classList.remove('active');
        document.getElementById('comparison-section').scrollIntoView({ behavior: 'smooth' });
    } else if (criterion === '5_duplicate_detection') {
        document.querySelectorAll('.comparison-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === 'trajectory') {
                btn.classList.add('active');
            }
        });
        document.getElementById('trajectory-panel').classList.add('active');
        document.getElementById('notebook-panel').classList.remove('active');
        document.getElementById('comparison-section').scrollIntoView({ behavior: 'smooth' });
    }
}

// Screenshot display
let currentScreenshotModal = null;
let currentScreenshotData = {
    trajectoryType: null,
    stepIndex: null,
    maxSteps: null,
    beforeAfter: "after"
};

async function showScreenshot(trajectoryType, stepIndex) {
    if (currentScreenshotModal) {
        closeScreenshot();
    }
    
    currentScreenshotData.trajectoryType = trajectoryType;
    currentScreenshotData.stepIndex = stepIndex;
    
    if (trajectoryType === 'sft') {
        currentScreenshotData.maxSteps = (currentTrajectoryData?.sft?.length || 0) + 1;
    } else {
        const key = trajectoryType;
        currentScreenshotData.maxSteps = (currentTrajectoryData?.[key]?.length || 0) + 1;
    }
    
    await loadScreenshot(trajectoryType, stepIndex);
}

async function loadScreenshot(trajectoryType, stepIndex) {
    const modal = document.getElementById('screenshot-modal');
    const canvas = document.getElementById('screenshot-canvas');
    const image = document.getElementById('screenshot-image');
    const loading = document.getElementById('screenshot-loading');
    const title = document.getElementById('screenshot-title');
    const stepInfo = document.getElementById('screenshot-step-info');
    const prevBtn = document.getElementById('screenshot-prev');
    const nextBtn = document.getElementById('screenshot-next');
    const actionPanel = document.getElementById('action-info-panel');
    const toggleBtn = document.getElementById('screenshot-toggle');
    
    stopOverlayAnimation();
    
    // Reset fullscreen state when loading new screenshot
    if (isFullscreen) {
        toggleFullscreen();
    }
    
    modal.style.display = 'block';
    loading.style.display = 'block';
    loading.textContent = 'Loading...';
    canvas.style.display = 'none';
    image.style.display = 'none';
    actionPanel.style.display = 'none';
    if (toggleBtn) {
        toggleBtn.style.display = 'none';
    }
    
    currentScreenshotData.stepIndex = stepIndex;
    
    const trajectoryName = trajectoryType === 'sft' ? 'SFT' : `Annotator ${trajectoryType.replace('annotator_', '')}`;
    title.textContent = trajectoryName;
    
    const numActions = currentScreenshotData.maxSteps - 1;
    if (stepIndex === 0) {
        stepInfo.textContent = `Initial State`;
    } else if (stepIndex === numActions) {
        stepInfo.textContent = `DONE (Step ${stepIndex} of ${numActions})`;
    } else {
        stepInfo.textContent = `Step ${stepIndex} of ${numActions}`;
    }
    
    prevBtn.disabled = stepIndex <= 0;
    nextBtn.disabled = stepIndex >= currentScreenshotData.maxSteps - 1;
    
    try {
        let screenshotStepIndex = stepIndex;
        
        if (currentScreenshotData.beforeAfter === "before" && stepIndex > 0) {
            screenshotStepIndex = stepIndex - 1;
        }
        
        const actionStepIndex = stepIndex > 0 ? stepIndex - 1 : -1;
        
        // Get screenshot and action data
        const data = await analyzer.getScreenshotPath(trajectoryType, screenshotStepIndex);
        
        let actionData = null;
        let dragEndData = null;
        if (actionStepIndex >= 0) {
            const actionResult = await analyzer.getScreenshotPath(trajectoryType, actionStepIndex);
            actionData = actionResult?.action || null;
            dragEndData = actionResult?.drag_end || null;
        }
        
        if (data && data.screenshot) {
            const img = new Image();
            img.onload = () => {
                loading.style.display = 'none';
                
                // Use requestAnimationFrame to ensure DOM is laid out
                requestAnimationFrame(() => {
                    // Get the actual container dimensions after layout
                    const container = document.querySelector('.screenshot-container');
                    const wrapper = document.querySelector('.screenshot-image-wrapper');
                    
                    // Calculate available space (account for nav buttons ~120px total and padding)
                    let availableWidth = window.innerWidth * 0.85;
                    let availableHeight = window.innerHeight * 0.7;
                    
                    if (container && wrapper) {
                        // Use actual container dimensions if available
                        availableWidth = Math.min(container.clientWidth - 120, availableWidth);
                        availableHeight = Math.min(wrapper.clientHeight || availableHeight, availableHeight);
                    }
                    
                    let displayWidth = img.naturalWidth;
                    let displayHeight = img.naturalHeight;
                    
                    // Scale down if needed to fit within available space
                    const scaleX = availableWidth / displayWidth;
                    const scaleY = availableHeight / displayHeight;
                    const scale = Math.min(scaleX, scaleY, 1);
                    
                    displayWidth = Math.floor(displayWidth * scale);
                    displayHeight = Math.floor(displayHeight * scale);
                    
                    canvas.width = displayWidth;
                    canvas.height = displayHeight;
                    canvas.style.display = 'block';
                    
                    animationState.imageWidth = img.naturalWidth;
                    animationState.imageHeight = img.naturalHeight;
                    animationState.currentAction = actionData;
                    animationState.dragEnd = dragEndData;
                    animationState.currentImage = img;
                    animationState.displayWidth = displayWidth;
                    animationState.displayHeight = displayHeight;
                    
                    // Store original size for fullscreen toggle
                    originalCanvasSize.width = displayWidth;
                    originalCanvasSize.height = displayHeight;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
                    
                    if (stepIndex === 0 || !actionData) {
                        updateActionInfoPanel(null, null);
                        if (toggleBtn) {
                            toggleBtn.style.display = 'none';
                        }
                    } else {
                        document.getElementById('screenshot-image').src = data.screenshot;
                        startOverlayAnimation(canvas, img);
                        updateActionInfoPanel(actionData, dragEndData);
                        if (toggleBtn) {
                            toggleBtn.style.display = 'block';
                            const toggleText = document.getElementById('screenshot-toggle-text');
                            if (toggleText) {
                                toggleText.textContent = currentScreenshotData.beforeAfter === "before" ? "Before" : "After";
                            }
                        }
                    }
                });
            };
            
            img.onerror = () => {
                loading.textContent = 'Failed to load screenshot';
                loading.style.display = 'block';
                canvas.style.display = 'none';
            };
            
            img.src = data.screenshot;
        } else {
            loading.textContent = 'Screenshot not found';
            loading.style.display = 'block';
            canvas.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading screenshot:', error);
        loading.textContent = 'Error loading screenshot';
        loading.style.display = 'block';
        canvas.style.display = 'none';
    }
    
    currentScreenshotModal = modal;
}

function navigateScreenshot(direction) {
    if (!currentScreenshotData.trajectoryType || currentScreenshotData.stepIndex === null) {
        return;
    }
    
    const newIndex = currentScreenshotData.stepIndex + direction;
    
    if (newIndex < 0 || newIndex >= currentScreenshotData.maxSteps) {
        return;
    }
    
    loadScreenshot(currentScreenshotData.trajectoryType, newIndex);
}

// Criterion 9 Mismatch Details Modal
function openCriterion9DetailsModal(mismatches) {
    const modal = document.getElementById('criterion9-modal');
    const mismatchList = document.getElementById('criterion9-mismatch-list');
    
    if (!modal || !mismatchList) return;
    
    // Clear previous content
    mismatchList.innerHTML = '';
    
    // Group mismatches by type for better organization
    const sftMismatches = mismatches.filter(m => m.path === 'SFT');
    const annotatorMismatches = mismatches.filter(m => m.path.startsWith('annotator_'));
    const modelMismatches = mismatches.filter(m => !m.path.startsWith('annotator_') && m.path !== 'SFT');
    
    // Build HTML for mismatch list
    let html = '';
    
    if (sftMismatches.length > 0) {
        html += '<div class="mismatch-group"><h4>SFT</h4><ul class="mismatch-list">';
        sftMismatches.forEach(mismatch => {
            const diff = mismatch.png - mismatch.xml;
            const diffText = diff > 0 ? `+${diff} PNGs` : `${diff} PNGs`;
            html += `<li class="mismatch-item">
                <div class="mismatch-path"><strong>${escapeHtml(mismatch.path)}</strong></div>
                <div class="mismatch-counts">
                    <span class="count-badge png-count">${mismatch.png} PNGs</span>
                    <span class="count-badge xml-count">${mismatch.xml} XMLs</span>
                    <span class="count-badge diff-count">Difference: ${diffText}</span>
                </div>
            </li>`;
        });
        html += '</ul></div>';
    }
    
    if (annotatorMismatches.length > 0) {
        html += '<div class="mismatch-group"><h4>Annotators</h4><ul class="mismatch-list">';
        annotatorMismatches.forEach(mismatch => {
            const diff = mismatch.png - mismatch.xml;
            const diffText = diff > 0 ? `+${diff} PNGs` : `${diff} PNGs`;
            html += `<li class="mismatch-item">
                <div class="mismatch-path"><strong>${escapeHtml(mismatch.path)}</strong></div>
                <div class="mismatch-counts">
                    <span class="count-badge png-count">${mismatch.png} PNGs</span>
                    <span class="count-badge xml-count">${mismatch.xml} XMLs</span>
                    <span class="count-badge diff-count">Difference: ${diffText}</span>
                </div>
            </li>`;
        });
        html += '</ul></div>';
    }
    
    if (modelMismatches.length > 0) {
        html += '<div class="mismatch-group"><h4>Model Runs</h4><ul class="mismatch-list">';
        modelMismatches.forEach(mismatch => {
            const diff = mismatch.png - mismatch.xml;
            const diffText = diff > 0 ? `+${diff} PNGs` : `${diff} PNGs`;
            html += `<li class="mismatch-item">
                <div class="mismatch-path"><strong>${escapeHtml(mismatch.path)}</strong></div>
                <div class="mismatch-counts">
                    <span class="count-badge png-count">${mismatch.png} PNGs</span>
                    <span class="count-badge xml-count">${mismatch.xml} XMLs</span>
                    <span class="count-badge diff-count">Difference: ${diffText}</span>
                </div>
            </li>`;
        });
        html += '</ul></div>';
    }
    
    mismatchList.innerHTML = html;
    modal.style.display = 'block';
}

function closeCriterion9DetailsModal() {
    const modal = document.getElementById('criterion9-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeScreenshot() {
    const modal = document.getElementById('screenshot-modal');
    if (modal) {
        modal.style.display = 'none';
        currentScreenshotModal = null;
    }
    stopOverlayAnimation();
    const actionPanel = document.getElementById('action-info-panel');
    if (actionPanel) {
        actionPanel.style.display = 'none';
    }
    // Reset fullscreen state when closing
    if (isFullscreen) {
        toggleFullscreen();
    }
}

// Initialize screenshot modal handlers
function initScreenshotModal() {
    const modal = document.getElementById('screenshot-modal');
    const closeBtn = document.querySelector('.screenshot-close');
    const prevBtn = document.getElementById('screenshot-prev');
    const nextBtn = document.getElementById('screenshot-next');
    const toggleBtn = document.getElementById('screenshot-toggle');
    const opacitySlider = document.getElementById('overlay-opacity-slider');
    const opacityValue = document.getElementById('opacity-value');
    const wrapper = document.querySelector('.screenshot-image-wrapper');
    
    // Prevent background scrolling when interacting with screenshot
    if (wrapper) {
        // Prevent wheel events from scrolling the background when over the wrapper
        wrapper.addEventListener('wheel', (e) => {
            e.stopPropagation();
        }, { passive: false });
        
        // Prevent touch events from scrolling background
        wrapper.addEventListener('touchmove', (e) => {
            e.stopPropagation();
        }, { passive: true });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeScreenshot);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => navigateScreenshot(-1));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => navigateScreenshot(1));
    }
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (currentScreenshotData.stepIndex === 0) {
                return;
            }
            if (currentScreenshotData.beforeAfter === "before") {
                currentScreenshotData.beforeAfter = "after";
            } else {
                currentScreenshotData.beforeAfter = "before";
            }
            if (currentScreenshotData.trajectoryType && currentScreenshotData.stepIndex !== null) {
                loadScreenshot(currentScreenshotData.trajectoryType, currentScreenshotData.stepIndex);
            }
        });
    }
    
    if (opacitySlider && opacityValue) {
        opacitySlider.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            animationState.overlayOpacity = value / 100;
            opacityValue.textContent = `${value}%`;
        });
    }
    
    // Add click handler for fullscreen toggle
    const canvas = document.getElementById('screenshot-canvas');
    
    if (canvas && wrapper) {
        canvas.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFullscreen();
        });
        
        wrapper.addEventListener('click', (e) => {
            // Only trigger if clicking on the wrapper itself, not on canvas
            if (e.target === wrapper) {
                toggleFullscreen();
            }
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            // If in fullscreen, clicking modal background should exit fullscreen
            if (isFullscreen && e.target === modal) {
                toggleFullscreen();
            } else if (e.target === modal) {
                closeScreenshot();
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (!currentScreenshotModal) return;
        
        if (e.key === 'Escape') {
            // If in fullscreen, exit fullscreen first
            if (isFullscreen) {
                toggleFullscreen();
            } else {
                closeScreenshot();
            }
        } else if (e.key === 'ArrowLeft') {
            navigateScreenshot(-1);
        } else if (e.key === 'ArrowRight') {
            navigateScreenshot(1);
        }
    });
}

// Initialize Criterion 9 modal handlers
function initCriterion9Modal() {
    const modal = document.getElementById('criterion9-modal');
    const closeBtn = document.querySelector('.criterion9-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeCriterion9DetailsModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeCriterion9DetailsModal();
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('criterion9-modal');
            if (modal && modal.style.display === 'block') {
                closeCriterion9DetailsModal();
            }
        }
    });
}

// Toggle fullscreen mode for screenshot
function toggleFullscreen() {
    const canvas = document.getElementById('screenshot-canvas');
    const wrapper = document.querySelector('.screenshot-image-wrapper');
    const modal = document.getElementById('screenshot-modal');
    
    if (!canvas || !wrapper || !modal) return;
    
    const img = animationState.currentImage;
    if (!img) return;
    
    if (!isFullscreen) {
        // Enter fullscreen
        isFullscreen = true;
        wrapper.classList.add('screenshot-fullscreen');
        
        // Calculate fullscreen dimensions (fill viewport while maintaining aspect ratio)
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const imageAspect = img.naturalWidth / img.naturalHeight;
        const viewportAspect = viewportWidth / viewportHeight;
        
        let fullscreenWidth, fullscreenHeight;
        if (imageAspect > viewportAspect) {
            // Image is wider - fit to width
            fullscreenWidth = viewportWidth;
            fullscreenHeight = viewportWidth / imageAspect;
        } else {
            // Image is taller - fit to height
            fullscreenHeight = viewportHeight;
            fullscreenWidth = viewportHeight * imageAspect;
        }
        
        // Update canvas size
        canvas.width = Math.floor(fullscreenWidth);
        canvas.height = Math.floor(fullscreenHeight);
        animationState.displayWidth = canvas.width;
        animationState.displayHeight = canvas.height;
        
        // Redraw image and overlay
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        if (animationState.currentAction) {
            renderActionOverlay(ctx, canvas.width, canvas.height);
        }
        
        // If animation is running, restart it with new dimensions
        if (animationState.running) {
            stopOverlayAnimation();
            startOverlayAnimation(canvas, img);
        }
    } else {
        // Exit fullscreen
        isFullscreen = false;
        wrapper.classList.remove('screenshot-fullscreen');
        
        // Restore original canvas size
        canvas.width = originalCanvasSize.width;
        canvas.height = originalCanvasSize.height;
        animationState.displayWidth = canvas.width;
        animationState.displayHeight = canvas.height;
        
        // Redraw image and overlay
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        if (animationState.currentAction) {
            renderActionOverlay(ctx, canvas.width, canvas.height);
        }
        
        // If animation is running, restart it with original dimensions
        if (animationState.running) {
            stopOverlayAnimation();
            startOverlayAnimation(canvas, img);
        }
    }
}

// ============================================
// OVERLAY RENDERING FUNCTIONS
// ============================================

function startOverlayAnimation(canvas, image) {
    animationState.running = true;
    animationState.phase = 0;
    animationState.dashOffset = 0;
    
    function animate() {
        if (!animationState.running) return;
        
        const ctx = canvas.getContext('2d');
        
        // Use current display dimensions (may be fullscreen or normal)
        const displayWidth = animationState.displayWidth;
        const displayHeight = animationState.displayHeight;
        
        // Ensure canvas size matches current display size
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }
        
        ctx.drawImage(image, 0, 0, displayWidth, displayHeight);
        
        animationState.phase += 0.08;
        animationState.dashOffset -= 0.5;
        
        renderActionOverlay(ctx, canvas.width, canvas.height);
        
        animationState.frameId = requestAnimationFrame(animate);
    }
    
    animate();
}

function stopOverlayAnimation() {
    animationState.running = false;
    if (animationState.frameId) {
        cancelAnimationFrame(animationState.frameId);
        animationState.frameId = null;
    }
}

function renderActionOverlay(ctx, canvasWidth, canvasHeight) {
    const action = animationState.currentAction;
    if (!action || action.action_type === 'unknown') return;
    
    // Calculate scale based on current canvas size vs original image size
    const scaleX = (canvasWidth / animationState.imageWidth);
    const scaleY = (canvasHeight / animationState.imageHeight);
    
    const type = action.action_type;
    
    switch (type) {
        case 'click':
            drawCrosshair(ctx, action.x * scaleX, action.y * scaleY, 'click');
            break;
        case 'doubleClick':
            drawCrosshair(ctx, action.x * scaleX, action.y * scaleY, 'doubleClick');
            break;
        case 'tripleClick':
            drawCrosshair(ctx, action.x * scaleX, action.y * scaleY, 'tripleClick');
            break;
        case 'rightClick':
            drawCrosshair(ctx, action.x * scaleX, action.y * scaleY, 'rightClick');
            break;
        case 'mouseDown':
            if (animationState.dragEnd) {
                drawDragPath(
                    ctx,
                    action.x * scaleX, action.y * scaleY,
                    animationState.dragEnd.x * scaleX, animationState.dragEnd.y * scaleY
                );
            } else {
                drawCrosshair(ctx, action.x * scaleX, action.y * scaleY, 'mouseDown');
            }
            break;
        case 'moveTo':
            drawCrosshair(ctx, action.x * scaleX, action.y * scaleY, 'moveTo');
            break;
        case 'scroll':
            drawScrollIndicator(ctx, action.scroll_amount, canvasWidth, canvasHeight);
            break;
        case 'sleep':
            drawSleepIndicator(ctx, action.sleep_duration, canvasWidth, canvasHeight);
            break;
    }
}

function drawCrosshair(ctx, x, y, type) {
    const phase = animationState.phase;
    const opacity = animationState.overlayOpacity;
    const pulseSize = 14.4 + Math.sin(phase) * 5.76;
    const pulseAlpha = (0.7 + Math.sin(phase) * 0.3) * opacity;
    const innerPulse = 8.64 + Math.sin(phase * 1.5) * 2.88;
    
    let color;
    switch (type) {
        case 'rightClick':
            color = `rgba(255, 50, 50, ${pulseAlpha})`;
            break;
        case 'doubleClick':
            color = `rgba(0, 200, 255, ${pulseAlpha})`;
            break;
        case 'tripleClick':
            color = `rgba(255, 0, 255, ${pulseAlpha})`;
            break;
        case 'mouseDown':
            color = `rgba(255, 170, 0, ${pulseAlpha})`;
            break;
        case 'moveTo':
            color = `rgba(180, 180, 180, ${pulseAlpha})`;
            break;
        default:
            color = `rgba(0, 255, 65, ${pulseAlpha})`;
    }
    
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
    ctx.stroke();
    
    if (type === 'doubleClick' || type === 'tripleClick') {
        ctx.beginPath();
        ctx.arc(x, y, innerPulse, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    if (type === 'tripleClick') {
        // Add a third ring for tripleClick to distinguish it
        const outerPulse = 18 + Math.sin(phase * 0.8) * 4;
        ctx.beginPath();
        ctx.arc(x, y, outerPulse, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    const lineLen = pulseSize * 1.5;
    const gap = 5.76;
    
    ctx.beginPath();
    ctx.moveTo(x - lineLen, y);
    ctx.lineTo(x - gap, y);
    ctx.moveTo(x + gap, y);
    ctx.lineTo(x + lineLen, y);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x, y - lineLen);
    ctx.lineTo(x, y - gap);
    ctx.moveTo(x, y + gap);
    ctx.lineTo(x, y + lineLen);
    ctx.stroke();
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 2.16, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowColor = color;
    ctx.shadowBlur = 10.8 + Math.sin(phase) * 7.2;
    ctx.beginPath();
    ctx.arc(x, y, pulseSize * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
}

function drawDragPath(ctx, startX, startY, endX, endY) {
    const phase = animationState.phase;
    const dashOffset = animationState.dashOffset;
    const opacity = animationState.overlayOpacity;
    const pulseAlpha = (0.7 + Math.sin(phase) * 0.3) * opacity;
    
    const color = `rgba(255, 170, 0, ${pulseAlpha})`;
    const colorSolid = `rgba(255, 170, 0, ${0.8 * opacity})`;
    
    ctx.save();
    
    ctx.strokeStyle = colorSolid;
    ctx.lineWidth = 2.16;
    ctx.setLineDash([7.2, 6]);
    ctx.lineDashOffset = dashOffset;
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    ctx.setLineDash([]);
    
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowLen = 10.8;
    
    ctx.fillStyle = colorSolid;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - arrowLen * Math.cos(angle - Math.PI / 6),
        endY - arrowLen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        endX - arrowLen * Math.cos(angle + Math.PI / 6),
        endY - arrowLen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    
    drawCrosshair(ctx, startX, startY, 'mouseDown');
    drawCrosshair(ctx, endX, endY, 'moveTo');
}

function drawScrollIndicator(ctx, amount, canvasWidth, canvasHeight) {
    const phase = animationState.phase;
    const opacity = animationState.overlayOpacity;
    const pulseAlpha = (0.7 + Math.sin(phase) * 0.3) * opacity;
    
    const isUp = amount > 0;
    const color = `rgba(100, 200, 150, ${pulseAlpha})`;
    
    ctx.save();
    
    const x = canvasWidth - 60;
    const centerY = canvasHeight / 2;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(x - 25, centerY - 60, 50, 120, 10);
    } else {
        // Fallback for browsers without roundRect
        ctx.rect(x - 25, centerY - 60, 50, 120);
    }
    ctx.fill();
    ctx.stroke();
    
    const arrowY = centerY + (isUp ? -20 : 20);
    const arrowOffset = Math.sin(phase * 2) * 5;
    
    ctx.fillStyle = color;
    ctx.beginPath();
    if (isUp) {
        ctx.moveTo(x, arrowY - 20 - arrowOffset);
        ctx.lineTo(x - 15, arrowY + arrowOffset);
        ctx.lineTo(x + 15, arrowY + arrowOffset);
    } else {
        ctx.moveTo(x, arrowY + 20 + arrowOffset);
        ctx.lineTo(x - 15, arrowY - arrowOffset);
        ctx.lineTo(x + 15, arrowY - arrowOffset);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = color;
    ctx.font = 'bold 14px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(Math.abs(amount).toString(), x, centerY + (isUp ? 35 : -25));
    
    ctx.restore();
}

function drawSleepIndicator(ctx, duration, canvasWidth, canvasHeight) {
    const phase = animationState.phase;
    const opacity = animationState.overlayOpacity;
    const pulseAlpha = (0.7 + Math.sin(phase) * 0.3) * opacity;
    
    const color = `rgba(150, 150, 255, ${pulseAlpha})`;
    const colorSolid = `rgba(150, 150, 255, ${0.8 * opacity})`;
    
    ctx.save();
    
    const x = canvasWidth / 2;
    const y = 80;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = colorSolid;
    ctx.lineWidth = 2;
    
    const containerWidth = 200;
    const containerHeight = 80;
    
    ctx.beginPath();
    if (ctx.roundRect) {
        ctx.roundRect(x - containerWidth / 2, y - containerHeight / 2, containerWidth, containerHeight, 10);
    } else {
        ctx.rect(x - containerWidth / 2, y - containerHeight / 2, containerWidth, containerHeight);
    }
    ctx.fill();
    ctx.stroke();
    
    const clockX = x - 60;
    const clockY = y;
    const clockRadius = 20;
    
    ctx.strokeStyle = colorSolid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(clockX, clockY, clockRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    const handAngle = phase * 2;
    ctx.strokeStyle = colorSolid;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(clockX, clockY);
    ctx.lineTo(
        clockX + Math.cos(handAngle) * clockRadius * 0.5,
        clockY + Math.sin(handAngle) * clockRadius * 0.5
    );
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(clockX, clockY);
    ctx.lineTo(
        clockX + Math.cos(handAngle * 1.5) * clockRadius * 0.7,
        clockY + Math.sin(handAngle * 1.5) * clockRadius * 0.7
    );
    ctx.stroke();
    
    ctx.fillStyle = colorSolid;
    ctx.font = 'bold 16px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SLEEP', x + 20, y - 10);
    
    const durationText = duration >= 1.0 
        ? `${duration.toFixed(1)}s` 
        : `${(duration * 1000).toFixed(0)}ms`;
    ctx.font = '14px "Share Tech Mono", monospace';
    ctx.fillText(durationText, x + 20, y + 15);
    
    ctx.restore();
}

function updateActionInfoPanel(action, dragEnd) {
    const panel = document.getElementById('action-info-panel');
    const typeBadge = document.getElementById('action-type-badge');
    const content = document.getElementById('action-content');
    
    if (!action || action.action_type === 'unknown') {
        panel.style.display = 'none';
        return;
    }
    
    panel.style.display = 'flex';
    
    const type = action.action_type;
    
    let badgeText = type.toUpperCase();
    let badgeClass = 'action-type-badge';
    let contentHtml = '';
    
    switch (type) {
        case 'click':
            badgeClass += ' action-click';
            contentHtml = `Click at <span class="coordinates">(${action.x}, ${action.y})</span>`;
            break;
        case 'doubleClick':
            badgeText = 'DOUBLE CLICK';
            badgeClass += ' action-double-click';
            contentHtml = `Double-click at <span class="coordinates">(${action.x}, ${action.y})</span>`;
            break;
        case 'tripleClick':
            badgeText = 'TRIPLE CLICK';
            badgeClass += ' action-triple-click';
            contentHtml = `Triple-click at <span class="coordinates">(${action.x}, ${action.y})</span>`;
            break;
        case 'rightClick':
            badgeText = 'RIGHT CLICK';
            badgeClass += ' action-right-click';
            contentHtml = `Right-click at <span class="coordinates">(${action.x}, ${action.y})</span>`;
            break;
        case 'mouseDown':
            if (dragEnd) {
                badgeText = 'DRAG';
                badgeClass += ' action-drag';
                contentHtml = `Drag from <span class="coordinates">(${action.x}, ${action.y})</span> to <span class="coordinates">(${dragEnd.x}, ${dragEnd.y})</span>`;
            } else {
                badgeText = 'MOUSE DOWN';
                badgeClass += ' action-drag';
                contentHtml = `Mouse down at <span class="coordinates">(${action.x}, ${action.y})</span>`;
            }
            break;
        case 'moveTo':
            badgeText = 'MOVE';
            badgeClass += ' action-move';
            contentHtml = `Move cursor to <span class="coordinates">(${action.x}, ${action.y})</span>`;
            break;
        case 'mouseUp':
            badgeText = 'MOUSE UP';
            badgeClass += ' action-move';
            contentHtml = 'Release mouse button';
            break;
        case 'press':
            badgeText = 'KEY';
            badgeClass += ' action-key';
            contentHtml = action.keys.map(k => `<span class="key-badge">${escapeHtml(k)}</span>`).join('');
            break;
        case 'hotkey':
            badgeText = 'HOTKEY';
            badgeClass += ' action-key';
            contentHtml = action.keys.map(k => `<span class="key-badge">${escapeHtml(k)}</span>`).join('<span class="plus-sign">+</span>');
            break;
        case 'write':
            badgeText = 'TYPE';
            badgeClass += ' action-text';
            let displayText = action.text || '';
            displayText = displayText.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
            contentHtml = `<span class="typed-text">${escapeHtml(displayText)}</span>`;
            break;
        case 'scroll':
            badgeText = 'SCROLL';
            badgeClass += ' action-scroll';
            const direction = action.scroll_amount > 0 ? '↑ UP' : '↓ DOWN';
            contentHtml = `<span class="scroll-direction">${direction}</span> (${Math.abs(action.scroll_amount)} units)`;
            break;
        case 'sleep':
            badgeText = 'SLEEP';
            badgeClass += ' action-sleep';
            const duration = action.sleep_duration || 0;
            const durationText = duration >= 1.0 
                ? `${duration.toFixed(2)} seconds` 
                : `${(duration * 1000).toFixed(0)} milliseconds`;
            contentHtml = `<span class="sleep-duration">Wait for ${durationText}</span>`;
            break;
        default:
            badgeText = type.toUpperCase();
            contentHtml = action.raw ? escapeHtml(action.raw) : '';
    }
    
    typeBadge.className = badgeClass;
    typeBadge.textContent = badgeText;
    content.innerHTML = contentHtml;
}

// ============================================
// END OVERLAY RENDERING FUNCTIONS
// ============================================

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function linkifyUrls(text) {
    if (text.includes('<a ') || text.includes('&lt;a ')) {
        return text;
    }
    
    // Match full URLs starting with http://, https://, or www.
    const urlPattern = /(https?:\/\/[^\s<>"]+)|(www\.[^\s<>"]+)/gi;
    
    return text.replace(urlPattern, (match) => {
        let url = match.trim();
        const cleanedUrl = url.replace(/[.,;!?]+$/, '');
        if (cleanedUrl !== url && cleanedUrl.length > 0) {
            url = cleanedUrl;
        }
        
        let href = url;
        if (!href.match(/^https?:\/\//i)) {
            href = 'https://' + href;
        }
        
        return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="info-box-link">${escapeHtml(url)}</a>`;
    });
}

// Make functions available globally
window.openReviewPanel = openReviewPanel;

