/**
 * ツリーデータとスクリプトタイプに基づいてスクリプトを生成する
 * @param {object} treeData - スクリプトの元になるツリーデータ
 * @param {string} scriptType - 'python', 'batch', 'shell'など
 * @returns {string} - 生成されたスクリプト文字列
 */
function generateScript(treeData, scriptType) {
    if (!treeData) return "No data to generate script.";

    switch (scriptType) {
        case 'python':
            return generatePythonScript(treeData);
        case 'batch':
            return generateBatchScript(treeData);
        case 'powershell':
            return generatePowerShellScript(treeData);
        case 'shell':
            return generateShellScript(treeData);
        case 'nodejs':
            return generateNodeScript(treeData);
        default:
            return `Script type '${scriptType}' is not supported yet.`;
    }
}

// サーバー起動コマンドの内容
const serverBatContent = 'python -m http.server 8000';
const gitignoreContent = 'server.bat';


// --- Python スクリプトジェネレーター (修正) ---
function generatePythonScript(root) {
    const lines = [
        'import os',
        'from pathlib import Path',
        '',
        `root_dir = Path("${root.name}")`,
        'root_dir.mkdir(exist_ok=True)',
        ''
    ];
    
    // server.batの作成処理を追加
    lines.push(`# Create server.bat`);
    lines.push(`(root_dir / "server.bat").write_text("${serverBatContent}", encoding='utf-8')`);
    lines.push(`(root_dir / ".gitignore").write_text("${gitignoreContent}", encoding='utf-8')`);
    lines.push('');

    function buildPy(node, path) {
        if (!node.children) return;
        node.children.forEach(child => {
            const currentPath = `${path}/${child.name}`;
            if (child.type === 'directory') {
                lines.push(`(root_dir / "${currentPath.substring(1)}").mkdir()`);
                buildPy(child, currentPath);
            } else {
                lines.push(`(root_dir / "${currentPath.substring(1)}").touch()`);
            }
        });
    }

    buildPy(root, '');
    lines.push('\nprint("Project structure created successfully.")')
    return lines.join('\n');
}


// --- Batch スクリプトジェネレーター (修正) ---
function generateBatchScript(root) {
    const lines = [
        '@echo off',
        `if exist "${root.name}" (`,
        `  echo Directory ${root.name} already exists.`,
        `  exit /b 1`,
        `)`,
        `mkdir "${root.name}"`,
        ''
    ];
    
    // server.batの作成処理を追加
    lines.push(`echo ${serverBatContent} > "${root.name}\\server.bat"`);
    lines.push(`cd "${root.name}"`);
    lines.push('');

    function buildBat(node, path) {
        if (!node.children) return;
        node.children.forEach(child => {
            const currentPath = path ? `${path}\\${child.name}` : child.name;
            if (child.type === 'directory') {
                lines.push(`mkdir "${currentPath}"`);
                buildBat(child, currentPath);
            } else {
                lines.push(`type nul > "${currentPath}"`); // echo. はリダイレクトで問題を起こすことがあるため変更
            }
        });
    }

    buildBat(root, '');
    lines.push('\necho Project structure created successfully.')
    lines.push('cd ..')
    return lines.join('\n');
}


// --- Shell スクリプトジェネレーター (修正) ---
function generateShellScript(root) {
    const lines = [
        '#!/bin/bash',
        `if [ -d "${root.name}" ]; then`,
        `  echo "Directory ${root.name} already exists."`,
        `  exit 1`,
        `fi`,
        `mkdir -p "${root.name}"`,
        ''
    ];
    
    // server.shの作成処理を追加
    lines.push(`echo "${serverShContent}" > "${root.name}/server.sh"`);
    lines.push(`chmod +x "${root.name}/server.sh" # Make it executable`);
    lines.push(`cd "${root.name}"`);
    lines.push('');
    
    function buildSh(node, path) {
        if (!node.children) return;
        node.children.forEach(child => {
            const currentPath = path ? `${path}/${child.name}` : child.name;
            if (child.type === 'directory') {
                lines.push(`mkdir -p "${currentPath}"`);
                buildSh(child, currentPath);
            } else {
                lines.push(`touch "${currentPath}"`);
            }
        });
    }
    
    buildSh(root, '');
    lines.push('\necho "Project structure created successfully."')
    lines.push('cd ..')
    return lines.join('\n');
}

// 他のジェネレーター（PowerShell, Node.js）も同様に追加可能
function generatePowerShellScript(root) { return "PowerShell script generation is not implemented yet."; }

function generateNodeScript(root) { return "Node.js script generation is not implemented yet."; }
