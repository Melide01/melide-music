function parseMarkdown(string, separator = "\n", type = 'page') {
    const lines = string.replace(/\r/g, '').split(separator);
    let output = [];
    let buffer = [];
    let currentBlock = null;

    var yaml_data;

    var structures = { // HTML Structures
        details: {
            start: /^\/\/\s+(.+)/,
            end: /^\/\/$/,
            parse: lines => {
                const [summary, ...content] = lines;
                const details_el = document.createElement('details');
                const summary_el = document.createElement('summary');
                summary_el.textContent = String(summary).replace(/^\/\//, '').trim();
                details_el.appendChild(summary_el);
                for (const line of content) { details_el.appendChild(parseInline(line)); };
                return details_el;
            }
        },
        yaml: { // Yaml Metadata
            start: /^---$/,
            end: /^---$/,
            parse: lines => {
                const obj = {};
                
                for (const line of lines) {
                    const [key, ...rest] = line.split(':');
                    if (!key || rest.length === 0) continue;
                    obj[key.trim()] = rest.join(':').trim();
                };

                yaml_data = obj;

                const div_element = document.createElement('div');
                div_element.dataset.type = 'yaml'; div_element.dataset.content = JSON.stringify({title: obj.Titre, author: obj.Auteur}).replaceAll('"', '&quot;');
                div_element.classList.add('ver');
                div_element.style = "color: var(--gray); font-size: .7em; gap: 0; text-align: right;";

                const title_element = document.createElement('b');
                const author_element = document.createElement('p');

                title_element.dataset.type = 'text';
                title_element.dataset.content = obj.Titre;
                title_element.textContent = obj.Titre;
                author_element.dataset.type = 'text';
                author_element.dataset.content = obj.Auteur;
                author_element.textContent = obj.Auteur;

                div_element.appendChild(title_element);
                div_element.appendChild(author_element);
            
                return div_element
            }
        },
        code: { // Code Element : Might be risky to use in prod
            start: /^```/,
            end: /^```/,
            parse: lines => `<pre><code>${lines.join('\n')}</code></pre>`
        },
        div: {
            start: /^\(\[.*\]\)$/,
            match: /^\-\>(\{(.+)\})?\s+(.*)$/,
            parse: lines => {
                let [div, ...content] = lines;
                div = div.replace(/^\(\[(.*)\]\)$/, '$1').split('][');
                
                const parseContent = (content) => {
                    const attr = content.replace(/^\-\>(\{(.+)\})?\s+(.*)$/, '$2')
                    
                    const span_element = document.createElement('span');
                    let line_attributes_matches = [...attr.matchAll(/([^\s=]+)\s*=(['"])(.*?)\2/g)];
                    line_attributes_matches.forEach(a => span_element.setAttribute(a[1], a[3]));

                    const content_line = parseInline(content.replace(/^\-\>(\{(.+)\})?\s+(.*)$/, '$3'), true);
                    
                    if (content_line.length) {
                        content_line.forEach(line => {
                            if (typeof line !== 'string') {
                                span_element.appendChild(line);
                            } else {
                                const p_element = document.createElement('p');
                                p_element.textContent = line;
                                span_element.appendChild(p_element);
                            }
                        });
                    } else {
                        span_element.appendChild(content_line);
                    }
                    return span_element;
                };

                // Parse HTML
                const div_element = document.createElement('div');
                div_element.dataset.type = 'custom'; 
                div_element.dataset.content = JSON.stringify({ class: div[0], attributes: div[1], content: content }).replaceAll('"', '&quot;');
                
                div_element.classList = div[0];
                var attributes_matches = !!div[1] ? [...div[1].matchAll(/([^\s=]+)\s*=(['"])(.*?)\2/g)] : [];
                attributes_matches.forEach(attribute => div_element.setAttribute(attribute[1], attribute[3]));
                
                content.forEach(c => { div_element.appendChild(parseContent(c)); });
                return div_element;
            }
        },
        table: { // Table Element 
            match: line => /\|.*\|$/.test(line),
            parse: lines => {
                const [ headerLine, separatorLine, ...bodyLines ] = lines;
                const isAttributes = /^(\{(.*)\})?/.test(headerLine);
                let attributes = "";
                if (isAttributes) { attributes = headerLine.replace(/^\{(.*)\}(.*)/, (_, attribute, content) => {return attribute;} ) }
                
                const isHeader = /^(\|\s:?-+:?\s*)+\|?$/.test(separatorLine);
                
                const parseRow = ( row, cellTag) => {
                    const row_element = document.createElement('tr');
                    row_element.dataset.type = 'row';

                    row.replace(/^\||\|$/g, '').split('|').forEach(col => {
                        const cell_element = document.createElement(cellTag);
                        cell_element.dataset.type = 'text'; cell_element.dataset.content = col;
                        cell_element.textContent = col.trim();
                        row_element.appendChild(cell_element);
                    });
                    
                    return row_element;
                };

                let targetLines = lines;
                
                // HTML Parse
                const table_element = document.createElement('table');
                table_element.dataset.type = 'table'; table_element.dataset.content = lines.join('\n');

                const thead_element = document.createElement('thead');
                const tbody_element = document.createElement('tbody');
                thead_element.dataset.type = 'head';
                tbody_element.dataset.type = 'body';

                table_element.appendChild(thead_element); 
                table_element.appendChild(tbody_element);

                if (isHeader) {
                    thead_element.appendChild(parseRow(headerLine.replace(/^\{(.*)\}/, ''), 'th'));
                    targetLines = bodyLines;
                };
                
                targetLines.forEach(row => {
                    tbody_element.appendChild(parseRow(row, 'td'));
                });

                return table_element
            }
        },
        list: { // List Element : Incremented or Bullet
            match: line => /^(\*|\-|\d+\.)\s+(.*)/.test(line),
            parse: lines => {
                const isOrdered = /^\d+\./.test(lines[0]);
                const tag = isOrdered ? 'ol' : 'ul';

                const list_element = document.createElement(tag);
                list_element.dataset.type = 'list'; list_element.dataset.content = lines.join('\n').replaceAll('"', '&quot;');
                lines.forEach(line => {
                    const content = line.replace(/^(\*|\-|\d+\.)\s+/, '');
                    const _content = parseInline(content.trim(), false, 'li');
                    _content.dataset.type = 'text'; _content.dataset.content = content;
                    list_element.appendChild(_content);
                });
                
                return list_element;
            }
        }
    
    };
    var inlineParsers = [
        [
            /\{\=\[(.*?)\]\=\}/g,
            (_, type) => {
                if (type === "agenda") {
                    return smartLoadAgenda(global_agenda);
                } else if (type === "agenda-mini") {
                    return smartLoadAgenda(global_agenda, 'mini');
                } else if (type === "actualites") {
                    return `<iframe ${edit ? 'data-type="agenda"' : ""} src="" style="border:none; width:500px; height:430px; background: #eee;" allowtransparency="true" frameborder="0"></iframe>`;
                }
            }
        ],
        [ // Auto Link
            /\b((https?\:\/\/|www\.)[^\s<>()]+(?:\.[^\s<>()]+)*(?:\/[^\s<>()]*)?)/gi, 
            ([_, url]) => {
                const href = url.startsWith('http') ? url : 'https://' + url;
                const a_element = document.createElement('a');
                a_element.dataset.type = 'link'; a_element.dataset.content = JSON.stringify({text: url, url}).replaceAll('"', '&quot;');
                a_element.setAttribute('href', href);
                a_element.addEventListener('click', (e) => {
                    handleExternalLink(e, href);
                });
                a_element.textContent = url;
                return a_element;
            }
        ],
        [ // Header Titles
            /^(\#{1,6})\s+(.*)$/,
            ([_, hashes, content]) => {
                const level = hashes.length;
                const head_title_element = document.createElement('h' + level);
                head_title_element.dataset.type = 'title'; head_title_element.dataset.content = String(' ' + content).padStart((content.length + level + 1), '#');
                head_title_element.textContent = content;
                return head_title_element;
            }
        ],
        [ // Bold and Italic
            /(\*{1,2})(.+?)\1/g,
            ([_, stars, content]) => {
                const tag = stars.length === 1 ? 'i' : 'b';
                const var_element = document.createElement(tag);
                var_element.dataset.type = tag === 'i' ? 'italic' : 'bold'; var_element.dataset.content = content.replaceAll('"', '&quot;');
                var_element.textContent = content;
                return var_element;
            }
        ],
        [ // Italic Legacy
            /(\_)(.+?)\1/g,
            ([_, underscore, content]) => {
                const italic_element = document.createElement('em');
                italic_element.dataset.type = 'italic'; italic_element.dataset.content = content.replaceAll('"', '&quot;');
                italic_element.textContent = content;
                return italic_element;
            }
        ],
        [ // Absolute Link
            /\[(.+?)\]\((https?:\/\/[^\s]+)\)/g,
            ([_, text, url]) => {
                const href = url.startsWith('http') ? url : 'https://' + url;
                const a_element = document.createElement('a');
                a_element.dataset.type = 'link'; a_element.dataset.content = JSON.stringify({text, url}).replaceAll('"', '&quot;');
                a_element.setAttribute('href', href);
                a_element.addEventListener('click', (e) => { handleExternalLink(e, href) });
                a_element.textContent = text;
                return a_element;
            }
        ],
        [ // Img
            /\!\[([^\]]*)\]\(([^)]+\.(png|jpe?g|gif|svg|webp))\)(\{(.+?)\})?/gi,
            ([_, alt, src, mime, group, attribute]) => {
                const img_element = document.createElement('img');
                let _src = src;
                img_element.dataset.type = 'image'; img_element.dataset.content = JSON.stringify({alt, src, mime, group, attribute}).replaceAll('"', "&quot;");
                img_element.setAttribute('alt', alt); img_element.setAttribute('src', _src);
                var attributes_matches = !!attribute ? [...attribute.matchAll(/([^\s=]+)\s*=(['"])(.*?)\2/g)] : []; // attributes_matches.map(match => [ [match[1]], [match[3]] ]); // Match 1 = key, Match 3 = value;
                attributes_matches.forEach(match => { img_element.setAttribute(match[1], match[3]); });
                return img_element;
            }
        ],
        [ // Audio
            /\[(.*?)\]\(([^)]+\.(mp3|ogg|wav))\)/gi,
            ([_, label, src]) => {
                const audio_element = document.createElement('audio');
                audio_element.dataset.type = 'audio'; audio_element.dataset.content = JSON.stringify({label, src}).replaceAll('"', '&quot;');
                audio_element.controls;
                audio_element.src = src;
                audio_element.textContent = label;
                return audio_element;
            }
        ],
        [ // Video
            /\[(.*?)\]\(([^)]+\.(mp4|webm|mov))\)/gi,
            ([_, label, src]) => {
                const video_element = document.createElement('video');
                video_element.dataset.type = 'video'; video_element.dataset.value = JSON.stringify({label, src}).replaceAll('"', '&quot;');
                video_element.controls;
                video_element.src = src;
                video_element.textContent = label;
                return video_element;
            }
        ],
        [ // PageBreak
            /^===$/,
            ([_]) => {
                const break_element = document.createElement('div');
                break_element.dataset.type = 'break'; break_element.dataset.content = "===";
                break_element.classList.add('pagebreak');
                return break_element;
            }
        ],
    ];

    // SubParse Function

    function parseInline(line, fromStructure = false, tag_overwrite = 'p') {
        line = [line];

        for (const [regex, fn] of inlineParsers) {
            let i = 0;

            while (i < line.length) {
                const fragment = line[i];

                if (typeof fragment !== 'string') { i++; continue; } // First verif

                regex.lastIndex = 0;
                const matches = regex.flags.includes('g') ? Array.from(fragment.matchAll(regex)) : [];
                // let match;

                if (!regex.flags.includes('g')) {
                    const singleMatch = regex.exec(fragment);
                    if (singleMatch) matches.push(singleMatch);
                }

                if (matches.length === 0) { i++; continue; }

                // Replacing
                const newFragments = [];
                let cursor = 0;

                for (const match of matches) {
                    const start = match.index;
                    const end = start + match[0].length;
                    if (start > cursor) newFragments.push(fragment.slice(cursor, start));
                    newFragments.push(fn(match));
                    cursor = end;
                }

                if (cursor < fragment.length) newFragments.push(fragment.slice(cursor));
                line.splice(i, 1, ...newFragments);
            }
        }

        if (!fromStructure) {
            const p = document.createElement(tag_overwrite);
            p.dataset.type = 'text';
            p.dataset.content = line.map(frag => typeof frag === 'string' ? frag : frag.dataset?.content || '').join('').replaceAll('"', '&quot;');
            for (const frag of line) {
                p.appendChild(typeof frag === 'string' ? document.createTextNode(frag) : frag);
            }
            return p;
        }

        return line;
    }

    function flushBuffer() { // Flush text content for structures
        if (!currentBlock) return;
        // if (edit) edit_array_list.push(buffer.join('\n'));
        output.push(structures[currentBlock].parse(buffer));
        buffer = []; 
        currentBlock = null;
    }

    var edit_array_list = [];
    for (let line of lines) {
        if (line.trim() === '') {
            output.push(document.createElement('br'));
            continue;
        }

        if (currentBlock === 'details' || currentBlock === 'code' || currentBlock === 'yaml' || currentBlock === 'div') { // Called inside a structure
            if (!!structures[currentBlock]?.end && structures[currentBlock].end.test(line)) { flushBuffer(); continue; // Called at the end of a structure
            } else if (!!structures[currentBlock]?.match && !structures[currentBlock]?.match.test(line)) { flushBuffer();
            } else { buffer.push(line); continue; }; // Continue the structure
        }
        // Starts absolute closable structures
        if (!currentBlock && structures.details.start.test(line)) { flushBuffer(); currentBlock = 'details'; buffer = []; buffer.push(line); continue; }
        if (!currentBlock && structures.code.start.test(line)) { flushBuffer(); currentBlock = 'code'; buffer = []; continue; }
        if (!currentBlock && structures.yaml.start.test(line)) { flushBuffer(); currentBlock = 'yaml'; buffer = []; continue; }
        if (!currentBlock && structures.div.start.test(line)) { flushBuffer(); currentBlock = 'div'; buffer = []; buffer.push(line); continue; }
        if (!!currentBlock && !!structures[currentBlock].match && structures[currentBlock].match(line)) {
            buffer.push(line); continue; // Else inside structure; for non absolute closable
        }
        if (!currentBlock) { // If not inside a structure
            for (const key of [ 'table', 'list' ]) { // Call non absolute closable structures
                const s = structures[key]; // Get Set non absolute closable structures if matched
                if (s.match && s.match(line)) { flushBuffer(); currentBlock = key; buffer.push(line); break; }
            }
            if (currentBlock) continue; // Continue if errored
        }
        flushBuffer(); // Flushed inline if passed every non matched  structures
        
        // if (edit) edit_array_list.push(line);
        
        let handled = false;
        if (!handled && line.trim() !== '') {
            const parsed = parseInline(line);
            output.push(parseInline(line));
        } else if (handled) { output += line; } // Meant to be called to not parse inside specific structure, maybe deprecated
        // output += '<br/>'; // Escape with new line
        // output.push(document.createElement('br'));
    }

    flushBuffer(); // Final flush
    // var return_output = {
    //     metadata: yaml_data, 
    //     data: output
    // };
    // const yaml = edit_array_list.splice(0,1);
    // edit_array_list.unshift(`---\n${yaml}\n---`);
    // return_output["edit"] = edit_array_list.map((v, i) => { return { index: i, value: v } });
    return output; // Return yaml metadata and page html data
}