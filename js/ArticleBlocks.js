function splitRow(line) {
    let value = line.trim();
    if (value.startsWith("|")) value = value.slice(1);
    if (value.endsWith("|")) value = value.slice(0, -1);
    return value.split("|").map(cell => cell.trim());
}

function isTableSeparator(line) {
    return /^\s*\|?\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
}

function isBlockStart(lines, index) {
    const line = lines[index];
    return /^\s*#{1,6}\s+/.test(line) ||
        /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line) ||
        /^\s*>\s?/.test(line) ||
        /^\s*(```|~~~)/.test(line) ||
        /^\s*(?:[-*]\s+|\d+[.)]\s+)/.test(line) ||
        /^\s*!\[[^\]]*\]\([^)]+\)\s*$/.test(line) ||
        /^\s*\[[^\]]+\]\([^)]+\)\s*$/.test(line) ||
        (index + 1 < lines.length && isTableSeparator(lines[index + 1]));
}

export function parseArticleBlocks(markdown = "") {
    const lines = String(markdown).replaceAll("\r\n", "\n").split("\n");
    const blocks = [];
    let index = 0;
    while (index < lines.length) {
        const line = lines[index];
        if (!line.trim()) {
            index++;
            continue;
        }
        const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
        const image = line.match(/^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$/);
        const link = line.match(/^\s*\[([^\]]+)\]\(([^)]+)\)\s*$/);
        const fence = line.match(/^\s*(```|~~~)(.*)$/);
        const list = line.match(/^\s*([-*]|\d+[.)])\s+(.+)$/);
        if (heading) {
            blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
            index++;
        } else if (image) {
            blocks.push({ type: "image", alt: image[1], url: image[2] });
            index++;
        } else if (link) {
            blocks.push({ type: "link", text: link[1], url: link[2] });
            index++;
        } else if (fence) {
            const code = [];
            index++;
            while (index < lines.length && !new RegExp(`^\\s*${fence[1]}\\s*$`).test(lines[index])) {
                code.push(lines[index++]);
            }
            if (index < lines.length) index++;
            blocks.push({ type: "code", text: code.join("\n") });
        } else if (/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
            blocks.push({ type: "rule" });
            index++;
        } else if (/^\s*>\s?/.test(line)) {
            const quote = [];
            while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
                quote.push(lines[index++].replace(/^\s*>\s?/, ""));
            }
            blocks.push({ type: "quote", text: quote.join("\n") });
        } else if (list) {
            const ordered = /^\d/.test(list[1]);
            const items = [];
            while (index < lines.length) {
                const match = lines[index].match(/^\s*([-*]|\d+[.)])\s+(.+)$/);
                if (!match || /^\d/.test(match[1]) !== ordered) break;
                items.push(match[2]);
                index++;
            }
            blocks.push({ type: "list", ordered, items });
        } else if (index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
            const rows = [splitRow(line)];
            index += 2;
            while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
                rows.push(splitRow(lines[index++]));
            }
            blocks.push({ type: "table", rows });
        } else {
            const paragraph = [line];
            index++;
            while (index < lines.length && lines[index].trim() && !isBlockStart(lines, index)) {
                paragraph.push(lines[index++]);
            }
            blocks.push({ type: "paragraph", text: paragraph.join("\n") });
        }
    }
    return blocks;
}

export function serializeArticleBlocks(blocks = []) {
    return blocks.map(block => {
        switch (block.type) {
            case "heading":
                return `${"#".repeat(Math.max(1, Math.min(6, Number(block.level) || 2)))} ${block.text || ""}`;
            case "list":
                return (block.items || []).map((item, index) => `${block.ordered ? `${index + 1}.` : "-"} ${item}`).join("\n");
            case "link":
                return `[${block.text || "Lien"}](${block.url || ""})`;
            case "image":
                return `![${block.alt || ""}](${block.url || ""})`;
            case "table": {
                const rows = (block.rows || []).map(row => row.map(cell => String(cell).replaceAll("|", "\\|")));
                if (!rows.length) return "";
                const separator = rows[0].map(() => "---");
                return [rows[0], separator, ...rows.slice(1)].map(row => `| ${row.join(" | ")} |`).join("\n");
            }
            case "quote":
                return String(block.text || "").split("\n").map(line => `> ${line}`).join("\n");
            case "code":
                return `\`\`\`\n${block.text || ""}\n\`\`\``;
            case "rule":
                return "---";
            default:
                return block.text || "";
        }
    }).filter(Boolean).join("\n\n");
}
