const message_feed = document.getElementById('message_feed');

const input_sender = document.getElementById('input_sender');

var users = ["left", "right"]

var opened_thread = document.getElementById('lastthread');
var last_thread = "left";
function sendMessage(dir, message) {
    const div_message_box = document.createElement('div'); div_message_box.classList.add('message_box');
    let dir_to_status = dir === "right" ? "send" : "receive";
    div_message_box.classList.add(dir_to_status);

    if (dir !== last_thread) {
        const div_thread = document.createElement('div'); div_thread.classList.add('thread');
        div_thread.classList.add(dir);
        opened_thread = div_thread;
        const img_pfp = document.createElement("img"); img_pfp.classList.add('pfp_icon');
        if (dir === "right") {
            img_pfp.src = "user1.png";
        } else {
            img_pfp.src = "user2.png";
        }
        div_message_box.appendChild(img_pfp);
    }

    last_thread = dir;
    const message_p = document.createElement("p"); message_p.textContent = message;

    
    div_message_box.appendChild(message_p);

    opened_thread.appendChild(div_message_box);
    message_feed.appendChild(opened_thread);
}