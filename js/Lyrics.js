export function parseLyrics(value) {
    const sections = [];
    let current = { title: "", lines: [] };

    for (const rawLine of String(value || "").split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        const heading = line.match(/^#\s+(.+)$/);
        if (heading) {
            if (current.title || current.lines.length) sections.push(current);
            current = { title: heading[1].trim(), lines: [] };
            continue;
        }

        const timed = line.match(/^\{(\d+):([0-5]\d)\}\s*/);
        const timecode = timed ? timed[1] + ":" + timed[2] : "";
        const content = timed ? line.slice(timed[0].length) : line;
        const explanationMatch = content.match(/\s+\[([^\]]*)\]\s*$/);
        const lyric = explanationMatch ? content.slice(0, explanationMatch.index).trimEnd() : content;
        current.lines.push({
            timecode,
            text: lyric,
            explanation: explanationMatch ? explanationMatch[1] : ""
        });
    }

    if (current.title || current.lines.length) sections.push(current);
    return sections;
}

export function serializeLyrics(sections) {
    return sections.map(section => {
        const lines = section.lines.map(line => {
            const timecode = line.timecode.trim();
            const prefix = timecode ? `{${timecode}} ` : "";
            const text = line.text.trim().replace(/\s*\r?\n\s*/g, " ");
            const explanation = line.explanation.trim().replace(/\s*\r?\n\s*/g, " ");
            return `${prefix}${text}${explanation ? ` [${explanation}]` : ""}`;
        });
        const title = section.title.trim();
        return [title ? `# ${title}` : "", ...lines].filter(Boolean).join("\n");
    }).filter(Boolean).join("\n\n");
}
