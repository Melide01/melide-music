function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function isSafeMarkdownUrl(value, image = false) {
    const url = value.trim();
    if (!url || /[\u0000-\u001f\u007f\\]/.test(url) || url.startsWith("//")) return false;
    const protocol = url.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
    if (!protocol) return true;
    return image
        ? protocol === "https" || protocol === "http"
        : ["https", "http", "mailto", "tel"].includes(protocol);
}

function parseInline(value) {
    const tokens = [];
    const keep = (html) => {
        const token = `\u0000${tokens.length}\u0000`;
        tokens.push(html);
        return token;
    };

    let result = escapeHtml(value);
    result = result.replace(/`([^`]+)`/g, (_, code) => keep(`<code>${code}</code>`));
    result = result.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+["']([^"']*)["'])?\)/g,
        (_, alt, source, title) => isSafeMarkdownUrl(source, true)
            ? keep(`<img src="${source}" alt="${alt}"${title ? ` title="${title}"` : ''}>`)
            : alt);
    result = result.replace(/\[([^\]]+)\]\(([^\s)]+)(?:\s+["']([^"']*)["'])?\)/g,
        (_, label, href, title) => isSafeMarkdownUrl(href)
            ? keep(`<a href="${href}"${title ? ` title="${title}"` : ''}>${label}</a>`)
            : label);
    result = result.replace(/(\*\*|__)(.+?)\1/g, '<strong>$2</strong>');
    result = result.replace(/(~~)(.+?)\1/g, '<del>$2</del>');
    result = result.replace(/(?<!\w)(\*|_)([^*_\n]+?)\1(?!\w)/g, '<em>$2</em>');

    return result.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[index]);
}

function isTableRow(line) {
    return line.includes('|') && line.trim() !== '|';
}

function splitTableRow(line) {
    let row = line.trim();
    if (row.startsWith('|')) row = row.slice(1);
    if (row.endsWith('|')) row = row.slice(0, -1);
    return row.split('|').map(cell => cell.trim());
}

function isTableSeparator(line) {
    return /^\s*\|?\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
}

function renderTable(rows, header) {
    const renderRow = (cells, tag) => `<tr>${cells.map(cell => `<${tag}>${parseInline(cell)}</${tag}>`).join('')}</tr>`;
    const head = header ? `<thead>${renderRow(rows.shift(), 'th')}</thead>` : '';
    const body = rows.length ? `<tbody>${rows.map(row => renderRow(row, 'td')).join('')}</tbody>` : '';
    return `<table>${head}${body}</table>`;
}

function listMatch(line) {
    return line.match(/^(\s*)([*-])\s+(.+)$/) || line.match(/^(\s*)(\d+)(?:[.:]\s+|\s+)(.+)$/);
}

function renderList(lines, start, baseIndent) {
    const firstMatch = listMatch(lines[start]);
    const ordered = /^\d/.test(firstMatch[2]);
    const tag = ordered ? 'ol' : 'ul';
    const items = [];
    let index = start;

    while (index < lines.length) {
        const match = listMatch(lines[index]);
        if (!match || match[1].length < baseIndent || (match[1].length > baseIndent && !items.length)) break;
        if (match[1].length !== baseIndent || (/^\d/.test(match[2]) !== ordered)) break;

        let content = `<li>${parseInline(match[3])}`;
        index++;
        if (index < lines.length) {
            const child = listMatch(lines[index]);
            if (child && child[1].length > baseIndent) {
                const nested = renderList(lines, index, child[1].length);
                content += nested.html;
                index = nested.next;
            }
        }
        items.push(`${content}</li>`);
    }

    return { html: `<${tag}>${items.join('')}</${tag}>`, next: index };
}

function renderTableBlock(lines, start) {
    const hasHeader = start + 1 < lines.length && isTableSeparator(lines[start + 1]);
    const rows = [];
    let index = start + (hasHeader ? 2 : 0);
    if (hasHeader) rows.push(splitTableRow(lines[start]));
    while (index < lines.length && isTableRow(lines[index]) && !isTableSeparator(lines[index])) {
        rows.push(splitTableRow(lines[index]));
        index++;
    }
    return { html: renderTable(rows, hasHeader), next: index };
}

export function parseMarkdown(text) {
    const lines = String(text).replaceAll('\r\n', '\n').split('\n');
    const output = [];
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];
        const heading = line.match(/^\s*(#{1,6})\s+(.+?)\s*#*\s*$/);
        const list = listMatch(line);
        const fence = line.match(/^\s*(```|~~~)(.*)$/);
        const quote = line.match(/^\s*>\s?(.*)$/);

        if (!line.trim()) {
            index++;
        } else if (fence) {
            const code = [];
            index++;
            while (index < lines.length && !new RegExp(`^\\s*${fence[1]}\\s*$`).test(lines[index])) {
                code.push(lines[index]);
                index++;
            }
            if (index < lines.length) index++;
            output.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        } else if (heading) {
            output.push(`<h${heading[1].length}>${parseInline(heading[2])}</h${heading[1].length}>`);
            index++;
        } else if (/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
            output.push('<hr>');
            index++;
        } else if (quote) {
            const quoteLines = [];
            while (index < lines.length) {
                const nextQuote = lines[index].match(/^\s*>\s?(.*)$/);
                if (!nextQuote) break;
                quoteLines.push(parseInline(nextQuote[1]));
                index++;
            }
            output.push(`<blockquote>${quoteLines.join('<br>')}</blockquote>`);
        } else if (list && list[1].length === 0) {
            const rendered = renderList(lines, index, 0);
            output.push(rendered.html);
            index = rendered.next;
        } else if (isTableRow(line) && !isTableSeparator(line)) {
            const rendered = renderTableBlock(lines, index);
            output.push(rendered.html);
            index = rendered.next;
        } else {
            output.push(`<p>${parseInline(line)}</p>`);
            index++;
        }
    }

    return output.join('\n');
}