/**
 * ファイル構造のテキストを解析し、ツリーオブジェクトに変換する。
 * 'tree'形式、インデント形式に対応し、行頭およびインラインのコメントを無視する。
 * @param {string} text - 入力されたテキスト
 * @returns {object | null} - 解析されたルートノードオブジェクト、または失敗時にnull
 */
function parseStructureText(text) {
    // 1. 行頭コメントと空行を除外
    const lines = text.trim().split('\n').filter(line => {
        const trimmedLine = line.trim();
        return trimmedLine !== '' && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('//');
    });

    if (lines.length === 0) return null;

    // 2. ルートノードを決定
    let rootName = lines[0].trim().replace(/[/\\]$/, '');
    if (rootName === '.') rootName = 'project';
    const root = { name: rootName, type: 'directory', children: [] };

    // 3. 親ノードの階層を管理するスタック
    const parentStack = [{ node: root, indentation: -1 }];

    // 4. 各行を解析してツリーを構築
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const normalizedLine = line.replace(/\t/g, '    ');
        
        const match = normalizedLine.match(/^([│├└─\s]*)(.*)/);
        if (!match) continue;

        const indentation = match[1].length;
        let namePart = match[2]; // ここがファイル名＋コメント部分

        // インラインコメントマーカー (# または //) を探す
        const commentIndexSharp = namePart.indexOf('#');
        const commentIndexSlash = namePart.indexOf('//');
        
        let commentIndex = -1;

        // 両方のマーカーが存在する場合、より手前にある方を採用
        if (commentIndexSharp !== -1 && commentIndexSlash !== -1) {
            commentIndex = Math.min(commentIndexSharp, commentIndexSlash);
        } else if (commentIndexSharp !== -1) {
            commentIndex = commentIndexSharp;
        } else if (commentIndexSlash !== -1) {
            commentIndex = commentIndexSlash;
        }

        // コメントが見つかった場合、それより前の部分だけを切り出す
        if (commentIndex !== -1) {
            namePart = namePart.substring(0, commentIndex);
        }

        const rawName = namePart.trim();
        if (!rawName) continue; // コメントのみの行などで名前が空になった場合はスキップ

        const isDirectory = rawName.endsWith('/') || !rawName.match(/.*\..*/);
        const name = rawName.replace(/[/\\]$/, '');

        const node = {
            name: name,
            type: isDirectory ? 'directory' : 'file',
            children: isDirectory ? [] : null
        };

        // 5. 正しい親を見つける
        while (indentation <= parentStack[parentStack.length - 1].indentation && parentStack.length > 1) {
            parentStack.pop();
        }

        // 6. 親に子として追加
        const parent = parentStack[parentStack.length - 1].node;
        parent.children.push(node);

        // 7. このノードがディレクトリならスタックに追加
        if (isDirectory) {
            parentStack.push({ node: node, indentation: indentation });
        }
    }

    return root;
}