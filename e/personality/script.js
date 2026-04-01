// const { createElement } = require("react");

class Question{
    constructor({
        category = "",
        category_index = 0,
        question_index = 0,
        answers = []
    }) {
        this.category = category;
        this.category_index = category_index;
        this.question_index = question_index;
        this.answers = answers;
    }

    populate(data) {
        for (const a of data) this.answers.push(a);
    }

    load() {
        update_line(this);
        test_question_title.textContent = full_data.content[this.category_index].questions[this.question_index].title;
        test_answer_container.innerHTML = "";
        for(const answer of this.answers) test_answer_container.appendChild(answer.create());
    }
}

class Answer{
    constructor({
        other = false,
        category = "",
        category_index = 0,
        axis = "",
        value = 0,

        question_index = 0,
        answer_index = 0
    }) {
        this.other = other;
        this.category = category;
        this.category_index = category_index;
        this.axis = axis;
        this.value = value;

        this.question_index = question_index;
        this.answer_index = answer_index;

        this.card;
    }

    create() {
        if (Array.isArray(this.value)) {
            this.value = full_data.content[this.category_index]
                .questions[this.question_index]
                .answers[this.answer_index].type;
        }
        // this.value = typeof this.value === "object" ? full_data.content[this.category_index].questions[this.question_index].answers[this.answer_index].type : this.value;
        
        if (this.card) return this.card;
        this.card = document.createElement("button");
        this.card.textContent = full_data.content[this.category_index].questions[this.question_index].answers[this.answer_index].title;
        this.card.addEventListener('click', () => { handle_send_answer(this); })
        return this.card;
    }
}

fetch('fr-data.json')
    .then(res => res.json())
    .then(data => { handle_load(data); })
    .catch(err => console.error(err))

function handle_load(data) {
    full_data = data;
    format_result_data(full_data['result-map']);
    
    for (const category_index in full_data.content) {

        const category = full_data.content[category_index]
        const category_name = category.from;

        for (const i in category.questions) {

            const question = category.questions[i];
            const answers = question.answers.map((v, _i) =>
                new Answer(
                    {
                        other: v.hasOwnProperty("type"),
                        category: category_name,
                        category_index: category_index,
                        axis: v.trigger,
                        value: full_data["result-map"].filter(_v => _v.name === category_name)[0]['axis-map'].filter(_v => _v.name === v.trigger)[0].value,
                        question_index: i,
                        answer_index: _i
                    }
                )
            )
            test_data.push(new Question({ category: category_name, category_index: category_index, question_index: i, answers: answers }));
        }
    }

    test_data = fisher_shuffle(test_data);
    // start_test();
}

function fisher_shuffle(arr) {
    var output = arr;
    
    for (let i = output.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let k = output[i];
        output[i] = output[j];
        output[j] = k;
    }

    return output;
}

var full_data;
var result_data = {};
var test_data = [];
var test_index = -1;

const welcome = document.getElementById('welcome');
const page = document.getElementById('page');
const page_meta = page.querySelector('.meta');
const page_title = page_meta.querySelector('h1');
const page_code = page_meta.querySelector('h2');
const page_locus = page_meta.querySelector('h5');
const page_description = page_meta.querySelector('span');

const terminal = document.querySelector('textarea');
const progress = document.getElementById('progress');
const test_env = document.getElementById("test_env");
const test_question_title = test_env.querySelector('h1');
const test_answer_container = test_env.querySelector('div.ver');

function format_result_data(data) {
    
    for (const key of data) {
        result_data[key.name] = { "value": [], "other": {} };
        let other_vector = key["axis-map"].filter(v => typeof v['value'] === "object");
        
        for (const vec of other_vector) {
            result_data[key.name].other[vec.name] = {"value": []}
        }
    
    }

    console.log(result_data);
}

function start_test() {
    test_index = -1;

    page.classList.add('close');
    welcome.classList.add('hide');

    line = "";
    disable_typewriter = false;
    typewriter_i = -1;
    
    setTimeout(() => {
        welcome.style.display = "none";
        test_env.classList.remove('close');
        handle_send_answer();
    }, 1000);
    
}

var line = "";
function update_line(data) {
    
    var notif = { type: "Lambda", message: "/" };
    if (data && data.constructor) notif.type = data.constructor.name;
    switch(notif.type) {
        
        case "Lambda": notif.message = ""; break;
        case "Question": notif.message = "/q " + `${data.category} ${data.question_index}`; break;
        case "Answer": notif.message = "/a " + `${data.category} ${data.axis} ${data.value}`; break;

    };

    line += "\n" + notif.message;
    if (typewriter_i < 0) animate_typewriter();
    // terminal.textContent += "\n" + notif.message;
}
document.addEventListener('resize', () => { terminal.scrollTo(0, terminal.scrollHeight) })

var typewriter_i = -1;
var disable_typewriter = false;
function animate_typewriter() {
    if (disable_typewriter) return;
    if (typewriter_i < line.length) typewriter_i+=1;
    terminal.textContent = line.slice(0, typewriter_i);
    terminal.scrollTo(0, terminal.scrollHeight);

    setTimeout(() => {
        if (!disable_typewriter) requestAnimationFrame(animate_typewriter);    
    }, Math.random() * 100);
};

function handle_send_answer(answer = null) {
    update_line(answer);
    progress.style = "--percentage: " + test_index / (test_data.length-1) * 100 + "%";

    let load_next = false;

    if (test_index >= test_data.length -1) {
        
        page.classList.remove('close');
        test_env.classList.add('close');
        disable_typewriter = true;
        typewriter_i = -1;
        terminal.textContent = "";
        load_result(resolve_results(result_data, full_data["result-map"]));
    
    } else if (answer) {

        load_next = true;

        if (answer.other) {
            const axis_def = full_data["result-map"]
                .find(v => v.name === answer.category)["axis-map"]
                .find(v => v.name === answer.axis);
            
            var val;

            switch (axis_def.type) {
                case "operator":
                    val = axis_def.value[answer.value];
                    break;
                case "boolean":
                    val = axis_def.value[answer.value] ? 1 : 0;
                    break;
            }

            result_data[answer.category].other[answer.axis].value.push(val)

            result_data[answer.category].other[answer.axis].value.push(answer.value);
        } else {
            result_data[answer.category].value.push(answer.value);
        }
        
        // console.log(full_data['result-map'].filter(v => v.name === answer.category)[0]['axis-map'].filter(v => v.name === answer.axis)[0].value);
    } else {
        test_index+=1;
        test_data[test_index].load();
    }

    if (load_next) test_env.classList.add('hide');

    setTimeout(() => {
        if (load_next) {
            test_index+=1;
            test_data[test_index].load();
            test_env.classList.remove('hide');
        }
    }, 1000);

}

async function load_result(data) {
    const res = await fetch('fr-archetypes.json');
    const d = await res.json();

    var locus = d.main.find(v => v.match.includes(data.summary['emotional_trait'].axis));
    let mund = locus.variants.find(v => v.from_other === "mund-locu" && v.match.includes(data.summary.emotional_trait.other['mund-locu']));
    var archetype = locus.variants.find(v => v.match.includes(data.summary.character_axis.axis) && v.match.includes(data.summary.movement_caracteristic.axis))

    page_title.textContent = archetype.name + " " + mund.suffix;
    page_description.textContent = locus.description + archetype.description;
    page_code.textContent = data.code;
    page_locus.textContent = "Vous êtes dans " + locus.name;

    console.log(mund);
}

function resolve_results(result_data, result_map) {

    function sum(arr) {
        return arr.reduce((a, b) => a + b, 0);
    }

    function resolve_axis(value, axis_map) {
        // find closest axis based on value
        let closest = axis_map[0];
        let min_diff = Infinity;

        for (const axis of axis_map) {
            if (typeof axis.value !== "number") continue;
            const diff = Math.abs(value - axis.value);
            if (diff < min_diff) {
                min_diff = diff;
                closest = axis;
            }
        }

        return closest.name;
    }

    function resolve_operator(values) {
        let score = 0;
        
        for (const v of values) {
            if (v === "+") score += 1;
            if (v === "-") score -= 1;
        }

        return score >= 0 ? "+" : "-";
    }

    function resolve_boolean(values) {
        return values.includes(1);
    }

    function resolve_tone(data) {
        const tones = new Set(data.value); // ["de", "li", "me"]

        let order = [];

        if (tones.has("me")) order.push("Me");
        if (tones.has("li")) order.push("Li");
        if (tones.has("de")) order.push("De");

        // Umbra handling
        const hasUmbra = data.other?.umbra?.value?.includes(1);

        if (!hasUmbra) {
            order = order.reverse();
        }

        return order.join("");
    }

    const output = {
        code: "",
        summary: {},
        raw: result_data
    };

    let code_parts = [];

    for (const category of result_map) {

        const name = category.name;
        const data = result_data[name];
        const axis_map = category["axis-map"];

        const main_sum = sum(data.value || []);
        const main_axis = resolve_axis(main_sum, axis_map);

        output.summary[name] = {
            sum: main_sum,
            axis: main_axis,
            other: {}
        };

        // HANDLE "other" vectors
        for (const other_key in data.other) {
            const other_values = data.other[other_key].value;
            const axis_def = axis_map.find(v => v.name === other_key);

            if (!axis_def) continue;

            if (axis_def.type === "operator") {
                output.summary[name].other[other_key] = resolve_operator(other_values);
            }

            if (axis_def.type === "boolean") {
                output.summary[name].other[other_key] = resolve_boolean(other_values);
            }
        }

        // BUILD CODE PARTS

        if (name === "character_axis") {
            code_parts.push(main_axis.substring(0, 3));
        }

        if (name === "emotional_trait") {
            let part = main_axis.split("-")[0].substring(0, 3);

            const mund = output.summary[name].other["mund-locu"];
            if (mund) part += mund;

            code_parts.push(part);
        }

        if (name === "movement_caracteristic") {
            let part = main_axis.substring(0, 4);

            const temp = output.summary[name].other["temp"];
            if (temp === "-") part += "-";
            if (temp === "+") part += "+";

            code_parts.push(part);
        }

        if (name === "tone_profile") {
            code_parts.push(resolve_tone(data));
        }
    }

    output.code = code_parts.join("");

    return output;
}