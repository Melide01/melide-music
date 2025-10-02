const input_text = document.getElementById('input_text');
const output_text = document.getElementById('output_text');
const render_container = document.getElementById('render_container');
const render_dialog = document.getElementById('render_dialog');

function handle_render() {
    var text = generate_output();
    render_dialog.open = true;
    console.log(parseMarkdown(text, '\\n'))
    render_container.innerHTML = parseMarkdown(text, '\\n');
}

function generate_output() {
    var text = String(input_text.value).trim().replaceAll('\r', "").replaceAll('\n', "\\n");
    return text;
}

function handle_copy() {
    var output = generate_output();
    output_text.value = output;
    navigator.clipboard.writeText(String(output))
        .then(() => notify('Success', 'Le texte a correctement été copier dans le presse-papier.', 'top', 'center', 'good'))
        .catch((err) => notify('Erreur', 'Oops : ' + err, 'center', 'center', 'bad'))
}

function handle_revert() {
    var text = String(output_text.value).trim().replaceAll('\r', "").replaceAll('\\n', "\n");
    input_text.value = text;
}