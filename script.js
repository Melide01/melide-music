const side_bar_backdrop = document.getElementById('side_bar_backdrop');
const side_bar = document.getElementById('side_bar');
const boot_splash = document.getElementById('boot_splash');
const menu = document.getElementById('menu');

const randomquote = {
  "music01": {
      lyricsquote: ["Quoique je fasse, l'amour envahit mon coeur."],
      embbededlink: ""
  },
  "music02 - Elle veut que je la laisse": {
      lyricsquote: ["Je ne l'ai pas vu depuis son anniv."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/4M4VUxW1ALaCLb0paB0ikb?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music03 - A-t-elle": {
      lyricsquote: [
          "J'ai juré avoir vu dans ses yeux des anges se balader.",
          "Elle voit des aurores boréales quand tu te retrouves dans sa vie.",
          "Mais on ne se reverra pas, à jamais mon amour."
      ],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/70X5ZgZlav9J5hKwWYl1n1?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music04 - Elle veut aller dans les states": {
      lyricsquote: [
          "Elle veut aller dans les states.",
          "Elle donne tout ce qu'elle a, quand elle danse, quand elle saigne.",
          "Elle veut vivre comme dans Disney."
      ],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/2y3OUY8MuiSdYkg2UffvuU?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music05 - Je ne rêve plus": {
      lyricsquote: [
          "Je me perds dans mes rêves, le seul endroit que j'aime.",
          "Je veux pas retourner dans mes rêves pour te revoir sans pouvoir te dire je t'aime."
      ],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/09tbJ1vPb0MgHfFXPi6ROu?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music06 - Je rêve encore": {
      lyricsquote: ["Je me perds dans tes lèvres, le seul endroit que j'aime."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/7glNOd7sTQrwEruUfbwzPo?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music07 - Crush": {
      lyricsquote: ["Et dans mon cercueil je veux que tu sois, qu'on passe la mort à deux juste toi et moi."],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/4IYcu9kBK2ReWXMBhMvw8B?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music08 - J’ai cessé de vous plaire": {
      lyricsquote: [
          "Nous y voilà encore.",
          "Je leur ai envoyé ma toute dernière musique, je crois mon art n'a pas trouvé ses auditeurs."
      ],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/5QI8WuEiasUdPGzne8YOIl?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music09 - Tout doux, démons": {
      lyricsquote: [
          "Seul avec mes démons, sur la PSP toute la nuit.",
          "Tout doux le loup...",
          "Ce sera le son préféré de personne..."
      ],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/0ghCGMnWo5XAvEiXSLvNqP?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music10 - Tu me rends fier": {
      lyricsquote: ["Tu me rends fier!"],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/3Ied8cyxuMdGLwVdVmS48K?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music11 - T cute": {
      lyricsquote: [
          "Et j'ai pas capté que tu étais beaucoup trop cute.",
          "Tout seul tard la nuit on faisait que kiffer, mais t'es l'enfant minuit moi je suis isolé."
      ],
      embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/1CNQL8KVLyPxE8h3D7YZ6s?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },





  
  "music23 - Larme Noire": {
    lyricsquote: ["Mes larmes coulent encore, noire comme le plomb."],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/24vvr2bczZ9IEnC6V8CvjT?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music24 - Roule avec moi": {
    lyricsquote: ["Ouais mais mon grand... t'es aussi grand que les étoiles."],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/7kpJAGlxscD9NyDENbdzC3?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music25 - 1h11": {
    lyricsquote: [
      "Je me méprise plus que toi et lui y a pas plus bête.",
      "Si il est trop tard, ou du moins trop tôt et quand je pense à toi ma peine va et se repose."
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/3w9VotQOATtgih41EAzB1h?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Je veux pas te perdre": {
    lyricsquote: ["Mes pensées sont infectées, pour satan c'est un festin mais ta joie est infecte t'es la seule pour qui ça ne change rien."],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/4eRHeshQn05kt2sXkwn4Ag?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Je suis vraiment mais alors tellement con": {
    lyricsquote: ["J'ai pris deux samples, je les ai bouclés, et vla tipa, j'ai terminé."],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/59KU5UNRi1T88aFmOiPqIH?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - On se lève tard": {
    lyricsquote: [
      "Plus de passé juste toi et moi.",
      "J'veux que tu me trouves beau que tu sois ma go.",
      "Peut-être qu'on se verra ailleurs, là où l'amour n'existe pas.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/6Aryvk6E6IjjNFhzTZVRFj?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Est elle": {
    lyricsquote: [
      "T'as pris tout mon mal, tu l'as mis ailleurs.",
      "La vie est rose et je me pose si elle est amoureuse.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/5fogwT9YYkxtJ1t8xNsB5l?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Je crois que ça bug": {
    lyricsquote: [
      "Je vaut tellement moins que de la pierre, je ne suis pas fort ouais bien plus faible que du papier.",
      "Je veux ma place dans le ciel, sans jamais quitter la terre.",
      "Un jour je serai fier d'être rester sur terre.",
      "Je le savais pas quand j'étais con."
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/4n0gjhLHwXJPUUmuvh389W?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Mr Redman": {
    lyricsquote: [
      "Mr Redman, vous n'êtes pas comme les autres.",
      "Seriez-vous en train d'essayer de vous faire virer.",
      "Je me demande où es votre place dans la société, j'ai tout les pions mais j'sais pas où vous placé.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/1Wh1P7uxQybHabnFcN73W9?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Je ferais avec": {
    lyricsquote: [
      "Mais elle en fait qu'à sa tête, alors je ferais avec.",
      "J'ai perdu mes potes dans des histoires de fantômes.",
      "Je ne vais pas rêver cette nuit.",
      "C'est un petit trop bien pour que ce soit réel.",
      "J'avale des cachets de doliprane avec mon café au sucre de cânnes, haldol et mionsérinne dans la bouche.",
      "Leurs mots étaient si jolies et mes pensées si fragiles, je leur ai confié toute ma vie je ne vais pas rêver cette nuit.",
      "Elle a fini par me détruire apparemment c'est mignon.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/6W9Z63WwZlwhXlpB7H4Mut?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Je rêve encore": {
    lyricsquote: [
      "Quelle heure est t-il où tu habites, je rêve d'y être.",
      "C'est pas plus mal que de faire avec.",
      "De la tendresse où y en aura jamais.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/7glNOd7sTQrwEruUfbwzPo?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Dans ton panier": {
    lyricsquote: [
      "Encore un peu d'ombre dans la valée, la verité est dure à avaler.",
      "Arii un jour mais détrônné attends... j'ai pas trouver ma vahine.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/4ZFwAMS9GldgRUhbxlrtse?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - J'ai plus d'espace": {
    lyricsquote: [
      "Mais du fond de mon coeur je voulais trop me la faire.",
      "Mais j'ai trop la flemme, je n'ai plus d'espace dans mon disque dur.",
      "Pas comme ces chanteurs qui se ferment dans des cases.",
      "Je vais te faire la meilleure des cames, tu vas la fumer en boucle.",
      "Je rêve souvent de mes musique avant de les faire.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/1LOpwEsKBkYy3RLBxd9XvQ?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Baby, qu'est ce que t'es": {
    lyricsquote: [
      "Même après la tempête je t'attends, tu danses encore avec lui sans vêtements.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/7CkPM3YdLaOs187d146FBA?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Sorcellerie": {
    lyricsquote: [
      "Ses caresses me séduisent mais je me retrouve seul dans son lit...",
      "C'est quoi cette sorcellerie, cette mélancolie.",
      "Mes démons se mélangent avec les siens."
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/7GCSRZzh53VkPL9QeLJv6d?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Don't Fight": {
    lyricsquote: [
      "I need to get out of here soon.",
      "It's in your head."
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/6PsKlxtIPhncgUdNKAf6BH?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - I know you hate me": {
    lyricsquote: [
      "Why don't you try to kill me tonight.",
      "I'm dead now, oh I love your smile.",
      "Do not wear a mask, cause it won't look like you.",
      "All of this facade, just to make you smile.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/1VBf91pnNQ3YlBwRzd6t4M?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - T'es encore là": {
    lyricsquote: [
      "Faaora ia'u.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/0jRmzfTkZe6CIcrMLQuF2D?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Derealisation": {
    lyricsquote: [
      "I don't wanna be awake anymore.",
      "nothing changed...",
      "something changed.",
      "There's a bee where there's a fool, it will sting when they will loose hope.",
      "Put me to sleep."
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/0b6NFWgFxC24v9OAJ3pmwU?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Childhood Cliché": {
    lyricsquote: [
      "She's bringing me joy, she's putting me down but there's nothing to worry about.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/1UHvFG8yFL9jdxY27eTvsV?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - To Make the Pain Go Away": {
    lyricsquote: [
      "Paradise is looking after us, we've gone away.",
      "You had to fake your death to see if I really care.",
      "Playing with life and death to make the pain go away.",
      "I've created this song to make the pain go away."
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/5uwDMPGC9AZjOJq0JhNUmc?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Thanks to Her": {
    lyricsquote: [
      "The other night I was walking in the graveyard, the other night I was looking for you.",
      "I believe in God but do you.",
      "I see your ghost in my room. Tell me what can i do."
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/0wY8BysFyJ8efw9GOoKJsb?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  }
};


document.addEventListener("DOMContentLoaded", () => {
    var tokeylist = Object.keys(randomquote);
    var randomKeyIndex = Math.round(Math.random() * (tokeylist.length - 1));
    var quoteLength = randomquote[tokeylist[randomKeyIndex]].lyricsquote.length;
    var randomQuoteIndex = Math.round(Math.random() * (quoteLength - 1));
    console.log(randomKeyIndex, randomQuoteIndex, quoteLength)
    boot_splash.querySelector('i').textContent = randomquote[tokeylist[randomKeyIndex]].lyricsquote[randomQuoteIndex];
    boot_splash.querySelector('.embbeded_container').innerHTML = randomquote[tokeylist[randomKeyIndex]].embbededlink;
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