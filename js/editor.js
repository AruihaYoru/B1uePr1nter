// エディタの現在の状態を保持する変数
let currentTreeData = null;
let visualTreeContainer = null; // コンテナ要素を保持

// --- データ操作関数 ---
function findNodeByPath(path) { if (!currentTreeData || !path) return null; const parts = path.split('/'); let currentNode = currentTreeData; if (parts.length === 1 && parts[0] === currentNode.name) return currentNode; for (let i = 1; i < parts.length; i++) { const part = parts[i]; if (!currentNode.children) return null; const found = currentNode.children.find(child => child.name === part); if (found) { currentNode = found; } else { return null; } } return currentNode; }
function removeNodeByPath(path) { if (!currentTreeData || path === currentTreeData.name) { currentTreeData = null; return true; } const parentPath = path.substring(0, path.lastIndexOf('/')); const nodeName = path.substring(path.lastIndexOf('/') + 1); const parentNode = findNodeByPath(parentPath); if (parentNode && parentNode.children) { const originalLength = parentNode.children.length; parentNode.children = parentNode.children.filter(child => child.name !== nodeName); return parentNode.children.length < originalLength; } return false; }


// --- ビュー（HTML）生成関数  ---
function createTreeHTML(node, currentPath) {
    if (!node) return '';
    const icon = node.type === 'directory' ? '📁' : '📄';
    const pathId = currentPath || node.name;
    const isDirectory = node.type === 'directory';

    let childrenHTML = '';
    if (isDirectory && node.children.length > 0) {
        childrenHTML = `<ul>${node.children.map(child => createTreeHTML(child, `${pathId}/${child.name}`)).join('')}</ul>`;
    }

    const addControls = isDirectory ?
        `<button class="add-file-btn" title="Add File">📄+</button>
         <button class="add-dir-btn" title="Add Directory">📁+</button>` : '';

    return `<li data-path="${pathId}" draggable="true">
                <div class="node-container">
                    <span class="node-name" title="Double-click to rename">${icon} ${node.name}</span>
                    <div class="node-controls">
                        ${addControls}
                        <button class="delete-btn" title="Delete item">×</button>
                    </div>
                </div>
                ${childrenHTML}
            </li>`;
}

function displayTree(treeData, container) {
    currentTreeData = treeData;
    visualTreeContainer = container;
    if (treeData) { container.innerHTML = `<ul class="tree-root">${createTreeHTML(treeData, treeData.name)}</ul>`; } 
    else { container.innerHTML = `<p><i>No structure to display.</i></p>`; }
}
function getTreeData() { return currentTreeData; }


// --- イベントハンドラ ---
function handleEditorClick(event) {
    const target = event.target;
    const li = target.closest('li');
    if (!li) return;
    const path = li.dataset.path;
    const node = findNodeByPath(path);
    if (!node) return;

    const isAddFile = target.classList.contains('add-file-btn');
    const isAddDir = target.classList.contains('add-dir-btn');

    if (isAddFile || isAddDir) {
        const type = isAddFile ? 'file' : 'directory';
        const name = prompt(`Enter new ${type} name:`);
        if (name && name.trim() !== '') {
            if (node.children.some(child => child.name === name)) {
                alert('Error: An item with that name already exists.'); return;
            }
            const newNode = { name: name.trim(), type: type, children: type === 'directory' ? [] : null };
            node.children.push(newNode);
            displayTree(currentTreeData, visualTreeContainer);
        }
    } else if (target.classList.contains('delete-btn')) {
        if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
            if (removeNodeByPath(path)) { displayTree(currentTreeData, visualTreeContainer); }
        }
    }
}
function handleEditorDoubleClick(event) {
    const target = event.target;
    if (!target.classList.contains('node-name')) return;
    const li = target.closest('li');
    const path = li.dataset.path;
    const node = findNodeByPath(path);
    if (!node) return;
    const originalName = node.name;
    const input = document.createElement('input');
    input.type = 'text'; input.value = originalName;
    target.replaceWith(input);
    input.focus();
    const saveChanges = () => {
        const newName = input.value.trim();
        const parentPath = path.substring(0, path.lastIndexOf('/'));
        const parentNode = findNodeByPath(parentPath);
        const isDuplicate = parentNode && parentNode.children.some(child => child.name === newName && child.name !== originalName);
        if (newName && !isDuplicate) { node.name = newName; } 
        else if (isDuplicate) { alert('Error: An item with that name already exists.'); }
        displayTree(currentTreeData, visualTreeContainer);
    };
    input.addEventListener('blur', saveChanges);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
        else if (e.key === 'Escape') { input.value = originalName; input.blur(); }
    });
}

// --- ドラッグ＆ドロップ イベントハンドラ ---
let draggedElementPath = null;
function handleDragStart(event) { const li = event.target.closest('li'); if (li) { draggedElementPath = li.dataset.path; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', draggedElementPath); setTimeout(() => li.classList.add('dragging'), 0); } }
function handleDragOver(event) { event.preventDefault(); const li = event.target.closest('li'); if (li) { const targetPath = li.dataset.path; const targetNode = findNodeByPath(targetPath); if (targetNode.type === 'directory' && draggedElementPath !== targetPath && !targetPath.startsWith(draggedElementPath + '/')) { li.classList.add('drag-over'); event.dataTransfer.dropEffect = 'move'; } else { event.dataTransfer.dropEffect = 'none'; } } }
function handleDragLeave(event) { const li = event.target.closest('li'); if (li) { li.classList.remove('drag-over'); } }
function handleDrop(event) { event.preventDefault(); const li = event.target.closest('li'); if (li) { li.classList.remove('drag-over'); const targetPath = li.dataset.path; const draggedPath = event.dataTransfer.getData('text/plain'); const draggedNode = findNodeByPath(draggedPath); const targetNode = findNodeByPath(targetPath); if (targetNode.type === 'directory' && draggedPath !== targetPath && !targetPath.startsWith(draggedPath + '/')) { if (targetNode.children.some(child => child.name === draggedNode.name)) { alert(`Error: A file named "${draggedNode.name}" already exists in this directory.`); return; } if (removeNodeByPath(draggedPath)) { targetNode.children.push(draggedNode); displayTree(currentTreeData, visualTreeContainer); } } } }
function handleDragEnd(event) { const draggingElement = document.querySelector('.dragging'); if (draggingElement) { draggingElement.classList.remove('dragging'); } draggedElementPath = null; }


document.head.insertAdjacentHTML('beforeend', `<style>
    .tree-root, .tree-root ul { list-style-type: none; padding-left: 20px; }
    .tree-root li { padding: 0; }
    .node-container { 
        display: flex; 
        align-items: center; 
        justify-content: space-between; 
        padding: 2px 4px;
        border-radius: 3px; 
        box-sizing: border-box;
        border: 1px solid transparent;
    }
    .node-container:hover { 
        background-color: #f0f0f0;
        border-color: #ddd;
    }
    .node-name { 
        cursor: pointer; 
        flex-grow: 1; 
        user-select: none; 
        /* ボタンとの間に少し余白を作る */
        padding-right: 8px;
    }
    
    .node-controls { 
        display: flex; /* Flexboxで横並びにする */
        align-items: center;
        gap: 4px; /* ボタン間のスペース */
    }
    
    .node-controls button {
        border: 1px solid #ccc; 
        background-color: #fff; 
        cursor: pointer; 
        font-size: 14px;
        width: 28px; 
        height: 24px; 
        text-align: center;
        padding: 0;
        border-radius: 4px;
        transition: background-color 0.2s, border-color 0.2s;
    }
    .node-controls button:hover {
        background-color: #e9e9e9;
        border-color: #999;
    }

    .delete-btn { color: red; }
    .node-container input[type="text"] { border: 1px solid #007bff; padding: 1px 3px; font-family: inherit; }
    
    /* Drag & Drop Styles */
    li.dragging { opacity: 0.5; }
    li.drag-over > .node-container { 
        background-color: #cce5ff; 
        border: 1px dashed #007bff; 
    }
</style>`);