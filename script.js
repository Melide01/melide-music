const side_bar_backdrop = document.getElementById('side_bar_backdrop');
const side_bar = document.getElementById('side_bar');
const boot_splash = document.getElementById('boot_splash');
const menu = document.getElementById('menu');

const randomquote_old = [
    "Quoique je fasse, l'amour envahit mon coeur.",
    "Je ne l'ai pas vu depuis son anniv.",
    "J'ai juré avoir vu dans ses yeux des anges se balader.",
    "Elle voit des aurores boréales quand tu te retrouve dans sa vie.",
    "Mais on se reverra pas, à jamais mon amour.",
    "Elle veut aller dans les states.",
    "Elle donne tous ce qu'elle a, quand elle danse, quand elle saigne.",
    "Elle veut vivre comme dans Disney.",
    "Je me perd dans mes rêves, le seul endroit que j'aime.",
    "Je me perd dans tes lèvres, le seul endroit que j'aime.",
    "Je veux pas retourner dans mes rêves pour te revoir sans pouvoir te dire je t'aime.",
    "Et dans mon cerceuil je veux que tu sois, qu'on passe la mort à deux juste toi et moi.",
    "Nous y voilà encore.",
    "Je leur ai envoyé ma toute dernière musique, je crois mon art n'a pas trouvé ses auditeurs.",
    "Seul avec mes démons, sur la psp toute la nuit.",
    "Tout doux le loup...",
    "Ce sera le son préféré de personne...",
    "Tu me rends fier!",
    "Et j'ai pas capté que tu étais beaucoup trop cute.",
    "Tout seul tard la nuit on faisait que kiffer, mais t'es l'enfant minuit moi je suis isolé.",
    "Mes larmes coulent encore, noire comme le plomb.",
    "...Et parfois on est imposteurs dans le capitol.",
    "Ouais mais mon grand... t'es aussi grand que les étoiles.",
    "Je me méprise plus que toi et lui y a pas plus bête.",
    "Si il est trop tard, ou du moins trop tôt et quand je pense à toi ma peine va et se repose.",
    "On fait du fitness avant de faire la bise, vêtement que l'on baisse avant de faire la...",
    "Mes pensées sont infectées, pour satan c'est un festin mais ta joie est infecte t'es la seule pour qui ça ne change rien.",
    "Je me déteste même pour tout te dire.",
    "J'ai pris deux samples, je les ai bouclés, et vla tipa, j'ai terminé.",
    "Je poste bad mais je poste pas parce que mes yeux veulent pas regarder droit.",
    "Plus de passé juste toi et moi.",
    "J'veux que tu me trouves beau que tu sois ma go.",
    "Peut-être qu'on se verra ailleurs, là où l'amour n'existe pas.",
    "Je veux pas de vos regards, quand je met un maillot. Je veux pas de vos zeub, laissez moi seule.",
    "Je veux pas être toute seule.",
    "T'as pris tout mon mal, tu l'as mis ailleurs.",
    "La vie est rose et je me pose si elle est amoureuse.",
    "Je vaut tellement moins que de la pierre, je ne suis pas fort ouais bien plus faible que du papier.",
    "Je veux ma place dans le ciel, sans jamais quitter la terre.",
    "Un jour je serai fier d'être rester sur terre.",
    "Je le savais pas quand j'étais con.",
    "Mr Redman, vous n'êtes pas comme les autres.",
    "Seriez-vous en train d'essayer de vous faire virer.",
    "Je me demande où es votre place dans la société, j'ai tout les pions mais j'sais pas où vous placé.",
    "Mais elle en fait qu'à sa tête, alors je ferais avec.",
    "J'ai perdu mes potes dans des histoires de fantômes.",
    "Je ne vais pas rêver cette nuit.",
    "C'est un petit trop bien pour que ce soit réel.",
    "J'avale des cachets de doliprane avec mon café au sucre de cânnes, haldol et mionsérinne dans la bouche.",
    "Leurs mots étaient si jolies et mes pensées si fragiles, je leur ai confié toute ma vie je ne vais pas rêver cette nuit.",
    "Elle a fini par me détruire apparemment c'est mignon.",
    "Vous me faites passer le temps avec vos histoires à la con.",
    "Quite à me taire je vais m'enterrer six pied sous terre.",
    "Quelle heure est t-il où tu habites, je rêve d'y être.",
    "C'est pas plus mal que de faire avec.",
    "De la tendresse où y en aura jamais.",
    "Encore un peu d'ombre dans la valée, la verité est dure à avaler.",
    "Arii un jour mais détrônné attends... j'ai pas trouver ma vahine.",
    "Mais du fond de mon coeur je voulais trop me la faire.",
    "Mais j'ai trop la flemme, je n'ai plus d'espace dans mon disque dur.",
    "Pas comme ces chanteurs qui se ferment dans des cases.",
    "Je vais te faire la meilleure des cames, tu vas la fumer en boucle.",
    "Je rêve souvent de mes musique avant de les faire.",
    "Même après la tempête je t'attends, tu danses encore avec lui sans vêtements.",
    "Ses caresses me séduisent mais je me retrouve seul dans son lit...",
    "C'est quoi cette sorcellerie, cette mélancolie.",
    "Mes démons se mélangent avec les siens.",
    "I need to get out of here soon.",
    "It's in your head.",
    "Why don't you try to kill me tonight.",
    "I'm dead now, oh I love your smile.",
    "Do not wear a mask, cause it won't look like you.",
    "All of this facade, just to make you smile.",
    "Faaora ia'u.",
    "I don't wanna be awake anymore.",
    "nothing changed...",
    "something changed.",
    "There's a bee where there's a fool, it will sting when they will loose hope.",
    "Put me to sleep.",
    "She's bringing me joy, she's putting me down but there's nothing to worry about.",
    "Paradise is looking after us, we've gone away.",
    "You had to fake your death to see if I really care.",
    "Playing with life and death to make the pain go away.",
    "I've created this song to make the pain go away.",
    "The other night I was walking in the graveyard, the other night I was looking for you.",
    "I believe in God but do you.",
    "I see your ghost in my room. Tell me what can i do."
]
const randomquote = {
    music01: {
      lyricsquote: ["Quoique je fasse, l'amour envahit mon coeur."],
      embbededlink: ""
    },
    music02: {
      lyricsquote: ["Je ne l'ai pas vu depuis son anniv."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/4M4VUxW1ALaCLb0paB0ikb?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music03: {
      lyricsquote: ["J'ai juré avoir vu dans ses yeux des anges se balader."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/70X5ZgZlav9J5hKwWYl1n1?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music04: {
      lyricsquote: ["Elle voit des aurores boréales quand tu te retrouves dans sa vie."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/70X5ZgZlav9J5hKwWYl1n1?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music05: {
      lyricsquote: ["Mais on ne se reverra pas, à jamais mon amour."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/70X5ZgZlav9J5hKwWYl1n1?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music06: {
      lyricsquote: ["Elle veut aller dans les states."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/2y3OUY8MuiSdYkg2UffvuU?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music07: {
      lyricsquote: ["Elle donne tout ce qu'elle a, quand elle danse, quand elle saigne."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/2y3OUY8MuiSdYkg2UffvuU?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music08: {
      lyricsquote: ["Elle veut vivre comme dans Disney."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/2y3OUY8MuiSdYkg2UffvuU?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music09: {
      lyricsquote: ["Je me perds dans mes rêves, le seul endroit que j'aime."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/09tbJ1vPb0MgHfFXPi6ROu?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music10: {
      lyricsquote: ["Je me perds dans tes lèvres, le seul endroit que j'aime."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/7glNOd7sTQrwEruUfbwzPo?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music11: {
      lyricsquote: ["Je veux pas retourner dans mes rêves pour te revoir sans pouvoir te dire je t'aime."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/09tbJ1vPb0MgHfFXPi6ROu?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music12: {
      lyricsquote: ["Et dans mon cercueil je veux que tu sois, qu'on passe la mort à deux juste toi et moi."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/4IYcu9kBK2ReWXMBhMvw8B?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music13: {
      lyricsquote: ["Nous y voilà encore."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/5QI8WuEiasUdPGzne8YOIl?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music14: {
      lyricsquote: ["Je leur ai envoyé ma toute dernière musique, je crois mon art n'a pas trouvé ses auditeurs."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/5QI8WuEiasUdPGzne8YOIl?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music15: {
      lyricsquote: ["Seul avec mes démons, sur la PSP toute la nuit."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/0ghCGMnWo5XAvEiXSLvNqP?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music16: {
      lyricsquote: ["Tout doux le loup..."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/0ghCGMnWo5XAvEiXSLvNqP?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music17: {
      lyricsquote: ["Ce sera le son préféré de personne..."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/0ghCGMnWo5XAvEiXSLvNqP?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music18: {
      lyricsquote: ["Tu me rends fier!"],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/3Ied8cyxuMdGLwVdVmS48K?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music19: {
      lyricsquote: ["Et j'ai pas capté que tu étais beaucoup trop cute."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/1CNQL8KVLyPxE8h3D7YZ6s?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    },
    music20: {
      lyricsquote: ["Tout seul tard la nuit on faisait que kiffer, mais t'es l'enfant minuit moi je suis isolé."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/1CNQL8KVLyPxE8h3D7YZ6s?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
    }
};

document.addEventListener("DOMContentLoaded", () => {
    var tokeylist = Object.keys(randomquote);
    var randomIndex = Math.round(Math.random() * tokeylist.length);
    boot_splash.querySelector('i').textContent = randomquote[tokeylist[randomIndex]].lyricsquote[0];
    boot_splash.querySelector('.embbeded_container').innerHTML = randomquote[tokeylist[randomIndex]].embbededlink;
    setTimeout(() => {
        //boot_splash.classList.add("open");
    }, 1000);
});

menu.addEventListener("click", function(event) {
    if (event.target.tagName === "INPUT" && event.target.type === "button") {
        if (event.target.value === "Plus...") {
            toggleClass(side_bar, "peak");
        }
    }
});

side_bar_backdrop.addEventListener("click", function(event) {
    if (event.target === this) {
        side_bar_backdrop.classList.add('hide');
    }
});

function toggleClass(el, cla) {
    if (el.classList.contains(cla)) {
        el.classList.remove(cla);
    } else {
        el.classList.add(cla);
    }
}