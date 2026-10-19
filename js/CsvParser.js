import { parseMarkdown } from '/js/Markdown.js';

export class CsvParser {
    constructor(
        content,
        delimiter = ","
    ) {
        this.content = content;
        this.delimiter = delimiter;
        this.data = this.load();
    }

    load() {
        const rows = this.content.split("\n");
        this.data = rows.map(row => row.split(this.delimiter));
        return this.data;
    }

    find_col_index(key) {
        this.load();
        return this.data[0].indexOf(key);
    }

    get(row, col, default_value = "") {
        this.load();
        return this.data[row][this.find_col_index(col)] || default_value;
    }

    set(row, col, value) {
        this.load();
        this.data[row][this.find_col_index(col)] = value;
        return this.data;
    }

    parse_back() {
        return this.data.map(row => row.join(this.delimiter)).join("\n");
    }

    build_table() {
        this.load();
        var md_content = this.data.map(row => `| ${row.join(" | ")} |`).join("\n");
        var separator = `| ${this.data[0].map(() => "---").join(" | ")} |`;
        md_content = `${md_content.split("\n")[0]}\n${separator}\n${md_content.split("\n").slice(1).join("\n")}`;
        return parseMarkdown(md_content);
    }
}