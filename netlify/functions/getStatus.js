const fetch = require('node-fetch');
const cheerio = require('cheerio');

const KEYWORDS = [
    "五島", "福江", "青方", "厳原", "壱岐", "野母商船", "九州商船", 
    "五島産業汽船", "木口汽船", "黄島海運", "五島旅客船"
];

// Netlifyのサーバーレス関数としてエクスポート
exports.handler = async function(event, context) {
    try {
        const targetUrl = "http://www.norimono-info.com/group_main.php?type=ship";
        const response = await fetch(targetUrl);
        
        if (!response.ok) {
            throw new Error(`サイトへのアクセスに失敗しました: ${response.statusText}`);
        }
        
        const buffer = await response.buffer();
        const text = new TextDecoder('shift_jis').decode(buffer);

        const $ = cheerio.load(text);

        $('body').find('br').replaceWith('\\n');
        const allText = $('body').text();
        const lines = allText.split('\\n');
        
        let relevantInfo = [];
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (KEYWORDS.some(keyword => trimmedLine.includes(keyword))) {
                let highlightedLine = trimmedLine;
                KEYWORDS.forEach(keyword => {
                    const regex = new RegExp(keyword, 'g');
                    highlightedLine = highlightedLine.replace(regex, `<strong>${keyword}</strong>`);
                });
                relevantInfo.push({ original: trimmedLine, highlighted: highlightedLine });
            }
        }

        // 成功したレスポンスをJSON形式で返す
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                relevantInfo: relevantInfo
            })
        };

    } catch (error) {
        console.error(error);
        // エラーが発生した場合、エラーメッセージをJSON形式で返す
        return {
            statusCode: 500,
            body: JSON.stringify({
                timestamp: new Date().toISOString(),
                error: error.message
            })
        };
    }
};
