document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const structureInput = document.getElementById('structure-input');
    const parseButton = document.getElementById('parse-button');
    const visualTreeContainer = document.getElementById('visual-tree-container');
    const scriptTypeSelect = document.getElementById('script-type-select');
    const generatedScriptOutput = document.getElementById('generated-script');
    const copyScriptButton = document.getElementById('copy-script-button');

    // --- メイン関数 ---

    /**
     * 現在のツリーデータと選択されたタイプに基づいてスクリプトを更新する
     */
    function updateGeneratedScript() {
        const currentTree = getTreeData();
        const scriptType = scriptTypeSelect.value;

        if (currentTree) {
            const script = generateScript(currentTree, scriptType);
            generatedScriptOutput.value = script;
        } else {
            generatedScriptOutput.value = 'Load or create a project structure in the editor.';
        }
    }

    // --- イベントリスナーの設定 ---

    // [Workspace 1] 「Load to Editor」ボタンがクリックされたとき
    parseButton.addEventListener('click', () => {
        const inputText = structureInput.value;
        const parsedTree = parseStructureText(inputText);
        displayTree(parsedTree, visualTreeContainer);
        updateGeneratedScript();
    });

    // [Workspace 2] エディタエリアのイベントを委譲
    // クリック（追加・削除）
    visualTreeContainer.addEventListener('click', (event) => {
        handleEditorClick(event);
        updateGeneratedScript(); // 構造が変更されたらスクリプトを更新
    });

    // ダブルクリック（名前変更）
    visualTreeContainer.addEventListener('dblclick', (event) => {
        handleEditorDoubleClick(event);
        // スクリプトの更新は、名前変更完了後のdisplayTree呼び出しに続く
        // ユーザーの一連の操作（クリック→更新）によってトリガーされる
    });

    // ドラッグ＆ドロップ
    visualTreeContainer.addEventListener('dragstart', handleDragStart);
    visualTreeContainer.addEventListener('dragover', handleDragOver);
    visualTreeContainer.addEventListener('dragleave', handleDragLeave);
    visualTreeContainer.addEventListener('drop', (event) => {
        handleDrop(event);
        updateGeneratedScript(); // 構造が変更されたらスクリプトを更新
    });
    visualTreeContainer.addEventListener('dragend', handleDragEnd);

    // [Workspace 3] スクリプトの種類が変更されたとき
    scriptTypeSelect.addEventListener('change', () => {
        updateGeneratedScript();
    });

    // [Workspace 3] 「Copy」ボタンがクリックされたとき
    copyScriptButton.addEventListener('click', () => {
        if (!generatedScriptOutput.value) return;

        navigator.clipboard.writeText(generatedScriptOutput.value).then(() => {
            // コピー成功時のフィードバック
            const originalText = copyScriptButton.textContent;
            copyScriptButton.textContent = 'Copied!';
            copyScriptButton.disabled = true;
            setTimeout(() => {
                copyScriptButton.textContent = originalText;
                copyScriptButton.disabled = false;
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy script to clipboard.');
        });
    });

    // --- 初期化 ---
    // アプリケーション起動時に一度スクリプトエリアを初期化
    updateGeneratedScript();
});