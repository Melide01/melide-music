export function setup_selection() {
    for (const choice of selection_choice_name) {
        // Setup the search selection filters
        if (!!!choice_map[choice[1]]) choice_map[choice[1]] = [];
        choice_map[choice[1]].push(document.querySelector(`[name="${choice[0]}"]`))
        choice_map["all"].push(document.querySelector(`[name="${choice[0]}"]`))
    }
}

export function toggle_selection(name = "all") {
    if (!choice_map[name]) return;
    for (const all of Object.entries(choice_map)) { for (const e of all[1]) e.style.display = "none" }
    for (const e of choice_map[name]) e.style.display = "flex";
}

const page_index = document.getElementById('page_index');
var section_search_index = 0;
export function section_results(dir = 0, index, amount = 7) {
    var nodes = filter_results();
    // nodes = sort_results(nodes, [ {key: "date", order: "desc"} ] )
    // const nodes = filter_results();
    const section_max = Math.ceil(nodes.length / amount);
    if (index > -1) section_search_index = index;
    if (dir) section_search_index += dir;
    
    if (section_search_index <= 0) {
        Array.from(page_arrow).filter(v => v.value === '>')[0].classList.remove('disable');
        Array.from(page_arrow).filter(v => v.value === '<')[0].classList.add('disable');
    }
    else if (section_search_index >= section_max - 1) {
        Array.from(page_arrow).filter(v => v.value === '<')[0].classList.remove('disable');
        Array.from(page_arrow).filter(v => v.value === '>')[0].classList.add('disable');
    } else {
        Array.from(page_arrow).filter(v => v.value === '>')[0].classList.remove('disable');
        Array.from(page_arrow).filter(v => v.value === '<')[0].classList.remove('disable');
    }

    page_index.innerHTML = "";
    for (let i=0; i<section_max; i++) {
        var is_out_of_bound = i < (section_search_index - 2) || i > (section_search_index + 2);
        var is_border = i === 0 || i === section_max -1;
        if (is_out_of_bound && !is_border) continue;
        page_index.innerHTML += `<label>${i}<input ${i === section_search_index ? "checked" : ""} onchange="section_results(0,${i})" name="page_index" type="radio"></label>`;
    }

    for (const index in global_nodes['tracks_data']) {
        const node = global_nodes['tracks_data'][index];
        var cap = amount + (section_search_index * amount);

        if (index > cap || index < section_search_index * amount || !nodes.includes(node)) {
            node.card.style.display = "none";
            continue;
        } else {
            node.card.style.display = "flex";
            node.card.parentElement.appendChild(node.card);
        }

    }
}
window.section_results = section_results;

function sort_results(results, sortArgs = []) {
    if (!sortArgs.length) return results;

    return [...results].sort((a, b) => {

        for (const rule of sortArgs) {
            const { key, value, order } = rule;

            // Priority match
            if (value !== undefined) {
                const aMatch = a[key] === value;
                const bMatch = b[key] === value;

                if (aMatch !== bMatch) return aMatch ? -1 : 1;
            }
            if (order) {
                
                let av = a[key];
                let bv = b[key];

                // handle date strings
                if (Date.parse(av) && Date.parse(bv)) {
                    av = new Date(av);
                    bv = new Date(bv);
                }

                if (av < bv) return order === "asc" ? -1 : 1;
                if (av > bv) return order === "asc" ? 1 : -1;
                
            }
        }

        return 0;
    });
}

function filter_results(args = []) {
    var results = global_nodes['tracks_data'];
    return results;

    if (!args.length) return results;
    results = results.filter(node => {
        var res = false;
        for (const arg of args) if (!res && node[arg["key"]] === arg["value"]) res = true;
        return res;
    });
    return results;
}