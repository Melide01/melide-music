const side_bar_backdrop = document.getElementById('side_bar_backdrop');
const side_bar = document.getElementById('side_bar');
const boot_splash = document.getElementById('boot_splash');
const menu = document.getElementById('menu');

const available_languages = {
  "fr-FR": "FR",
  "en-US": "EN",
  "es-ES": "ES",
  "ru-RU": "RU",
  "ja-JP": "JA"
}

const randomquote = {
  "music01": {
    lyricsquote: {
      FR: ["Quoique je fasse, l'amour envahit mon coeur et il y met pleins de bonheur."],
      EN: ["Whatever I do, love is invading my heart and it's putting a lot of hapiness."],
      ES: ["Haga lo que haga, el amor invade mi corazón y lo llena de felicidad."],
      RU: ["Что бы я ни делал, любовь вторгается в мое сердце и наполняет его счастьем."],
      JA: ["私が何をしても、愛が私の心に入り込み、幸せで満たしてくれます。"]
    },
    embbededlink: ""
  },
  "music02 - Elle veut que je la laisse": {
    lyricsquote: {
      FR: ["Je ne l'ai pas vu depuis son anniv."],
      EN: ["I haven't seen her since her birthday."],
      ES: ["No la he visto desde su cumpleaños."],
      RU: ["Я не видел ее с дня рождения."],
      JA: ["女の子の誕生日以来見ていない。"]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/4M4VUxW1ALaCLb0paB0ikb?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music03 - A-t-elle": {
    lyricsquote: {
      FR: [
        "J'ai juré avoir vu dans ses yeux des anges se balader.",
        "Elle voit des aurores boréales quand tu te retrouves dans sa vie.",
        "Mais on ne se reverra pas, à jamais mon amour."
      ],
      EN: [
        "I swore I saw angels wandering in her eyes.",
        "She sees northern lights when you enter her life.",
        "But we will never see each other again, my love forever."
      ],
      ES: [
        "Juré que vi ángeles paseando en sus ojos.",
        "Ella ve auroras boreales cuando entras en su vida.",
        "Pero nunca nos volveremos a ver, mi amor para siempre."
      ],
      RU: [
        "Я поклялся, что видел ангелов, бродящих в ее глазах.",
        "Она видит северное сияние, когда ты появляешься в ее жизни.",
        "Но мы больше не увидимся, моя любовь навсегда."
      ],
      JA: [
        "女の子の目に宇宙人が歩いているのを見たと誓った。",
        "女の子は你が入ってきた時、北極光を見る。",
        "しかし私たちはもう会えない、永遠に愛する。"
      ]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/70X5ZgZlav9J5hKwWYl1n1?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music04 - Elle veut aller dans les states": {
    lyricsquote: {
      FR: [
        "Elle veut aller dans les states.",
        "Elle donne tout ce qu'elle a, quand elle danse, quand elle saigne.",
        "Elle veut vivre comme dans Disney."
      ],
      EN: [
        "She wants to go to the States.",
        "She gives everything she has when she dances, when she bleeds.",
        "She wants to live like in Disney."
      ],
      ES: [
        "Ella quiere ir a los Estados Unidos.",
        "Ella da todo lo que tiene cuando baila, cuando sangra.",
        "Ella quiere vivir como en Disney."
      ],
      RU: [
        "Она хочет поехать в Штаты.",
        "Она отдает все, что у нее есть, когда танцует, когда кровоточит.",
        "Она хочет жить, как в Диснее."
      ],
      JA: [
        "彼女はアメリカに行きたい。",
        "彼女は踊るとき、血を流すとき、全てを捧げる。",
        "彼女はディズニーのような生活を送りたい。"
      ]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/2y3OUY8MuiSdYkg2UffvuU?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music05 - Je ne rêve plus": {
    lyricsquote: {
      FR: [
        "Je me perds dans mes rêves, le seul endroit que j'aime.",
        "Je veux pas retourner dans mes rêves pour te revoir sans pouvoir te dire je t'aime."
      ],
      EN: [
        "I get lost in my dreams, the only place I love.",
        "I don't want to return to my dreams to see you again without being able to say I love you."
      ],
      ES: [
        "Me pierdo en mis sueños, el único lugar que amo.",
        "No quiero volver a mis sueños para verte de nuevo sin poder decirte que te amo."
      ],
      RU: [
        "Я теряюсь в своих снах, единственном месте, которое я люблю.",
        "Я не хочу возвращаться в свои сны, чтобы снова увидеть тебя, не имея возможности сказать, что люблю тебя."
      ],
      JA: [
        "夢の中で迷ってしまう、それが私の好きな唯一の場所。",
        "もう一度夢の中で君に会いたくない、愛してると言えないから。"
      ]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/09tbJ1vPb0MgHfFXPi6ROu?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music06 - Je rêve encore": {
    lyricsquote: {
      FR: ["Je me perds dans tes lèvres, le seul endroit que j'aime."],
      EN: ["I get lost in your lips, the only place I love."],
      ES: ["Me pierdo en tus labios, el único lugar que amo."],
      RU: ["Я теряюсь в твоих губах, единственном месте, которое я люблю."],
      JA: ["君の唇の中で迷ってしまう、それが私の好きな唯一の場所。"]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/7glNOd7sTQrwEruUfbwzPo?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music07 - Crush": {
    lyricsquote: {
      FR: ["Et dans mon cercueil je veux que tu sois, qu'on passe la mort à deux juste toi et moi."],
      EN: ["And in my coffin, I want you to be there, so we can spend death together, just you and me."],
      ES: ["Y en mi ataúd quiero que estés, que pasemos la muerte juntos, solo tú y yo."],
      RU: ["И в моем гробу я хочу, чтобы ты была, чтобы мы провели смерть вместе, только ты и я."],
      JA: ["棺の中に君がいてほしい、君と二人で死を過ごしたい。"]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/4IYcu9kBK2ReWXMBhMvw8B?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music08 - J’ai cessé de vous plaire": {
    lyricsquote: {
      FR: [
        "Nous y voilà encore.",
        "Je leur ai envoyé ma toute dernière musique, je crois mon art n'a pas trouvé ses auditeurs."
      ],
      EN: [
        "Here we are again.",
        "I sent them my very last song, I think my art hasn't found its audience."
      ],
      ES: [
        "Aquí estamos de nuevo.",
        "Les envié mi última canción, creo que mi arte no ha encontrado su audiencia."
      ],
      RU: [
        "Вот мы снова здесь.",
        "Я отправил им свою последнюю музыку, думаю, мое искусство не нашло свою аудиторию."
      ],
      JA: [
        "またここにいる。",
        "最後の曲を彼らに送ったけど、私の芸術は聴衆を見つけられなかったと思う。"
      ]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/5QI8WuEiasUdPGzne8YOIl?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music09 - Tout doux, démons": {
    lyricsquote: {
      FR: [
        "Seul avec mes démons, sur la PSP toute la nuit.",
        "Tout doux le loup...",
        "Ce sera le son préféré de personne..."
      ],
      EN: [
        "Alone with my demons, on the PSP all night.",
        "Easy, the wolf...",
        "This will be no one's favorite song..."
      ],
      ES: [
        "Solo con mis demonios, en la PSP toda la noche.",
        "Tranquilo, el lobo...",
        "Esta será la canción favorita de nadie..."
      ],
      RU: [
        "Один на один со своими демонами, всю ночь на PSP.",
        "Тише, волк...",
        "Эта песня не станет чьей-то любимой..."
      ],
      JA: [
        "悪魔と一緒に、PSPで一晩中。",
        "落ち着け、オオカミ...",
        "これは誰の好きな曲にもならない..."
      ]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/0ghCGMnWo5XAvEiXSLvNqP?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music10 - Tu me rends fier": {
    lyricsquote: {
      FR: ["Tu me rends fier!"],
      EN: ["You make me proud!"],
      ES: ["¡Me haces sentir orgulloso!"],
      RU: ["Ты заставляешь меня гордиться!"],
      JA: ["君は私を誇りに思わせる！"]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/3Ied8cyxuMdGLwVdVmS48K?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music11 - T cute": {
    lyricsquote: {
      FR: [
        "Et j'ai pas capté que tu étais beaucoup trop cute.",
        "Tout seul tard la nuit on faisait que kiffer, mais t'es l'enfant minuit moi je suis isolé."
      ],
      EN: [
        "And I didn't realize you were way too cute.",
        "Alone late at night, we were just having fun, but you’re the midnight child and I’m isolated."
      ],
      ES: [
        "Y no me di cuenta de que eras demasiado linda.",
        "Solo tarde en la noche, solo nos divertíamos, pero tú eres el niño de medianoche y yo estoy aislado."
      ],
      RU: [
        "И я не понял, что ты слишком мила.",
        "Один поздно ночью, мы просто кайфовали, но ты ребенок полуночи, а я в изоляции."
      ],
      JA: [
        "君がとても可愛すぎるって気づかなかった。",
        "深夜に一人で楽しんでいたけど、君は真夜中の子供で、僕は孤独だった。"
      ]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/1CNQL8KVLyPxE8h3D7YZ6s?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music23 - Larme Noire": {
    lyricsquote: {
      FR: ["Mes larmes coulent encore, noires comme le plomb."],
      EN: ["My tears are still flowing, black as lead."],
      ES: ["Mis lágrimas siguen fluyendo, negras como el plomo."],
      RU: ["Мои слезы все еще текут, черные как свинец."],
      JA: ["私の涙はまだ流れている、鉛のように黒い。"]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/24vvr2bczZ9IEnC6V8CvjT?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music24 - Roule avec moi": {
    lyricsquote: {
      FR: ["Ouais mais mon grand... t'es aussi grand que les étoiles."],
      EN: ["Yeah, but buddy... you are as big as the stars."],
      ES: ["Sí, pero mi amigo... eres tan grande como las estrellas."],
      RU: ["Да, но мой друг... ты так же велик, как звезды."],
      JA: ["そうだけど、友よ...君は星のように大きい。"]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/7kpJAGlxscD9NyDENbdzC3?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music25 - 1h11": {
    lyricsquote: {
      FR: [
        "Je me méprise plus que toi et lui y a pas plus bête.",
        "Si il est trop tard, ou du moins trop tôt et quand je pense à toi ma peine va et se repose."
      ],
      EN: [
        "I despise myself more than you and him, there's no one more foolish.",
        "If it's too late, or at least too early, and when I think of you, my sorrow comes and rests."
      ],
      ES: [
        "Me desprecio más que a ti y a él, no hay nadie más tonto.",
        "Si es demasiado tarde, o al menos demasiado temprano, y cuando pienso en ti, mi dolor viene y descansa."
      ],
      RU: [
        "Я презираю себя больше, чем тебя и его, нет никого глупее.",
        "Если слишком поздно, или по крайней мере слишком рано, и когда я думаю о тебе, моя боль приходит и отдыхает."
      ],
      JA: [
        "君や彼よりも自分を軽蔑している、もっと愚かな人はいない。",
        "遅すぎるのか、あるいは早すぎるのか、君を思うと痛みがやってきて休む。"
      ]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/3w9VotQOATtgih41EAzB1h?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music26 - Je veux pas te perdre": {
    lyricsquote: {
      FR: ["Mes pensées sont infectées, pour satan c'est un festin mais ta joie est infecte t'es la seule pour qui ça ne change rien."],
      EN: ["My thoughts are infected, for Satan it's a feast, but your joy is toxic, you're the only one who doesn't care."],
      ES: ["Mis pensamientos están infectados, para Satanás es un festín, pero tu alegría es tóxica, eres la única a la que no le importa."],
      RU: ["Мои мысли заражены, для Сатаны это пир, но твоя радость отравлена, ты единственная, кому все равно."],
      JA: ["私の思考は汚染されている、サタンにとっては宴だが、君の喜びは毒だ、気にしないのは君だけ。"]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/4eRHeshQn05kt2sXkwn4Ag?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music27 - Je suis vraiment mais alors tellement con": {
    lyricsquote: {
      FR: ["J'ai pris deux samples, je les ai bouclés, et vla tipa, j'ai terminé."],
      EN: ["I took two samples, looped them, and boom, I'm done."],
      ES: ["Tomé dos muestras, las puse en bucle y listo, terminé."],
      RU: ["Я взял два сэмпла, зациклил их, и вот, готово."],
      JA: ["二つのサンプルを取って、ループさせて、はい、完成。"]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/59KU5UNRi1T88aFmOiPqIH?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music28 - On se lève tard": {
    lyricsquote: {
      FR: [
        "Plus de passé juste toi et moi.",
        "J'veux que tu me trouves beau que tu sois ma go.",
        "Peut-être qu'on se verra ailleurs, là où l'amour n'existe pas."
      ],
      EN: [
        "No more past, just you and me.",
        "I want you to find me handsome, to be my girl.",
        "Maybe we'll see each other elsewhere, where love doesn’t exist."
      ],
      ES: [
        "No hay más pasado, solo tú y yo.",
        "Quiero que me encuentres guapo, que seas mi chica.",
        "Tal vez nos veamos en otro lugar, donde el amor no existe."
      ],
      RU: [
        "Больше нет прошлого, только ты и я.",
        "Я хочу, чтобы ты находила меня красивым, чтобы ты была моей девушкой.",
        "Может быть, мы встретимся где-то еще, где любви не существует."
      ],
      JA: [
        "もう過去はない、ただ君と僕。",
        "君にかっこいいと思われたい、僕の彼女になってほしい。",
        "もしかしたら、愛が存在しない別の場所で会えるかもしれない。"
      ]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/6Aryvk6E6IjjNFhzTZVRFj?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music29 - Est elle": {
    lyricsquote: {
      FR: [
        "T'as pris tout mon mal, tu l'as mis ailleurs.",
        "La vie est rose et je me pose si elle est amoureuse.",
      ],
      EN: [
        "You took all my pain and took it away.",
        "Life is rosy and I wonder if she is in love.",
      ],
      ES: [
        "Tomaste todo mi dolor y lo alejaste.",
        "La vida es color de rosa y me pregunto si ella está enamorada.",
      ],
      RU: [
        "Ты забрал всю мою боль и переместил ее в другое место..",
        "Жизнь прекрасна, и мне интересно, влюблена ли она.",
      ],
      JA: [
        "あなたは私の痛みをすべて取り除き、どこか別の場所に置いてくれました。",
        "人生はバラ色で、彼女は恋をしているのだろうか。",
      ],
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/5fogwT9YYkxtJ1t8xNsB5l?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music30 - Je crois que ça bug": {
    lyricsquote: {
      FR: [
        "Je vaut tellement moins que de la pierre, je ne suis pas fort ouais bien plus faible que du papier.",
        "Je veux ma place dans le ciel, sans jamais quitter la terre.",
        "Un jour je serai fier d'être rester sur terre.",
        "Je le savais pas quand j'étais con."
      ],
      EN: [
        "I'm worth so much less than stone, I'm not strong yeah much weaker than paper.",
        "I want my place in heaven, without ever leaving earth.",
        "One day I will be proud to have remained on earth.",
        "I didn't know that when I was dumb."
      ],
      ES: [
        "Valgo mucho menos que una piedra, no soy fuerte, sí, mucho más débil que el papel.",
        "Quiero mi lugar en el cielo, sin dejar nunca la tierra.",
        "Un día estaré orgulloso de haber permanecido en la tierra.",
        "No lo sabía cuando era estúpido."
      ],
      RU: [
        "Я стою гораздо меньше камня, я не сильный, да, гораздо слабее бумаги.",
        "Я хочу занять свое место на небесах, не покидая при этом землю.",
        "Однажды я буду гордиться тем, что остался на земле.",
        "Я не знал этого, когда был глупым."
      ],
      JA: [
        "私は石よりもずっと価値が低く、強くはなく、紙よりもずっと弱いです。",
        "私は地球を離れることなく、天国に居場所が欲しいのです。",
        "いつか私は地球に生き続けたことを誇りに思う日が来るでしょう。",
        "自分が愚かだったときはそのことを知らなかった。"
      ],
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/4n0gjhLHwXJPUUmuvh389W?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music31 - Mr Redman": {
    lyricsquote: {
      FR: [
        "Mr Redman, vous n'êtes pas comme les autres.",
        "Seriez-vous en train d'essayer de vous faire virer.",
        "Je me demande où est votre place dans la société, j'ai tout les pions mais j'sais pas où vous placé.",
      ],
      EN: [
        "Mr. Redman, you are not like the others.",
        "Are you trying to get fired?",
        "I wonder where your place is in society, I have all the pieces but I don't know where to place you.",
      ],
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/1Wh1P7uxQybHabnFcN73W9?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music32 - Je ferais avec": {
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
  "music33 - Je rêve encore": {
    lyricsquote: [
      "Quelle heure est t-il où tu habites, je rêve d'y être.",
      "C'est pas plus mal que de faire avec.",
      "De la tendresse où y en aura jamais.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/7glNOd7sTQrwEruUfbwzPo?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music34 - Dans ton panier": {
    lyricsquote: [
      "Encore un peu d'ombre dans la valée, la verité est dure à avaler.",
      "Arii un jour mais détrônné attends... j'ai pas trouver ma vahine.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/4ZFwAMS9GldgRUhbxlrtse?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music35 - J'ai plus d'espace": {
    lyricsquote: [
      "Mais du fond de mon coeur je voulais trop me la faire.",
      "Mais j'ai trop la flemme, je n'ai plus d'espace dans mon disque dur.",
      "Pas comme ces chanteurs qui se ferment dans des cases.",
      "Je vais te faire la meilleure des cames, tu vas la fumer en boucle.",
      "Je rêve souvent de mes musique avant de les faire.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/1LOpwEsKBkYy3RLBxd9XvQ?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music36 - Baby, qu'est ce que t'es": {
    lyricsquote: [
      "Même après la tempête je t'attends, tu danses encore avec lui sans vêtements.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/7CkPM3YdLaOs187d146FBA?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music37 - Sorcellerie": {
    lyricsquote: [
      "Ses caresses me séduisent mais je me retrouve seul dans son lit...",
      "C'est quoi cette sorcellerie, cette mélancolie.",
      "Mes démons se mélangent avec les siens."
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/7GCSRZzh53VkPL9QeLJv6d?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music38 - Don't Fight": {
    lyricsquote: [
      "I need to get out of here soon.",
      "It's in your head."
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/6PsKlxtIPhncgUdNKAf6BH?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music39 - I know you hate me": {
    lyricsquote: [
      "Why don't you try to kill me tonight.",
      "I'm dead now, oh I love your smile.",
      "Do not wear a mask, cause it won't look like you.",
      "All of this facade, just to make you smile.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/1VBf91pnNQ3YlBwRzd6t4M?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music40 - T'es encore là": {
    lyricsquote: [
      "Faaora ia'u.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/album/0jRmzfTkZe6CIcrMLQuF2D?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music41 - Derealisation": {
    lyricsquote: [
      "I don't wanna be awake anymore.",
      "nothing changed...",
      "something changed.",
      "There's a bee where there's a fool, it will sting when they will loose hope.",
      "Put me to sleep."
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/0b6NFWgFxC24v9OAJ3pmwU?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music42 - Childhood Cliché": {
    lyricsquote: [
      "She's bringing me joy, she's putting me down but there's nothing to worry about.",
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/1UHvFG8yFL9jdxY27eTvsV?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music43 - To Make the Pain Go Away": {
    lyricsquote: [
      "Paradise is looking after us, we've gone away.",
      "You had to fake your death to see if I really care.",
      "Playing with life and death to make the pain go away.",
      "I've created this song to make the pain go away."
    ],
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/5uwDMPGC9AZjOJq0JhNUmc?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  },
  "music44 - Thanks to Her": {
    lyricsquote: {
      FR: [
        "L'autre nuit, je marchais dans le cimetière, l'autre nuit, je te cherchais.",
        "Je crois en Dieu, mais toi?",
        "Je vois ton fantôme dans ma chambre. Dis-moi, que puis-je faire?"
      ],
      EN: [
        "The other night I was walking in the graveyard, the other night I was looking for you.",
        "I believe in God, but do you?",
        "I see your ghost in my room. Tell me, what can I do?"
      ],
      ES: [
        "La otra noche estaba caminando en el cementerio, la otra noche te estaba buscando.",
        "Creo en Dios, ¿y tú?",
        "Veo tu fantasma en mi habitación. Dime, ¿qué puedo hacer?"
      ],
      RU: [
        "Прошлой ночью я гулял по кладбищу, прошлой ночью я искал тебя.",
        "Я верю в Бога, а ты?",
        "Я вижу твое привидение в своей комнате. Скажи мне, что я могу сделать?"
      ],
      JA: [
        "昨夜、墓地を歩いていた、昨夜、君を探していた。",
        "私は神を信じている、君は？",
        "部屋の中に君の幽霊が見える。どうすればいい？"
      ]
    },
    embbededlink: `<iframe style="border-radius:12px" src="https://open.spotify.com/embed/track/0wY8BysFyJ8efw9GOoKJsb?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`
  }
};

const musicmanifest = {
  "Larmes Noires": {
    albumimage: "sngl_ln.jpg"
  },
  "Catnip": {
    albumimage: "sngl_ctnp.jpg"
  },
  "Don't Fight": {
    albumimage: "sngl_df.jpg"
  },
  "I Know You Hate Me": {
    albumimage: "sngl_ikyhm.jpg"
  },
  "Je ne rêve plus": {
    albumimage: "sngl_jnrp.jpg"
  },
  "T trop cute": {
    albumimage: "sngl_ttc.jpg"
  },
  "T'es encore là": {
    albumimage: "sngl_tel.jpg"
  },
  "Tout doux, démons": {
    albumimage: "sngl_tdd.jpg"
  },
  "Tu me rends fier": {
    albumimage: "sngl_tmrf.jpg"
  },

  "Je crois que ça bug": {
    albumimage: "albm_jdst.jpg"
  },
  "Est-elle": {
    albumimage: "albm_jdst.jpg"
  },
  "Laissez moi seule": {
    albumimage: "albm_jdst.jpg"
  },
  "On se lève tard": {
    albumimage: "albm_jdst.jpg"
  },
  "J'suis vraiment mais alors tellement con": {
    albumimage: "albm_jdst.jpg"
  },
  "Thanks - 2022 Remastered": {
    albumimage: "albm_jdst.jpg"
  },
  "Crush": {
    albumimage: "albm_jdst.jpg"
  },
  "Shot de Doliprane": {
    albumimage: "albm_jdst.jpg"
  },
  "Je veux pas te perdre": {
    albumimage: "albm_jdst.jpg"
  },
  "Ines": {
    albumimage: "albm_jdst.jpg"
  },
  "Piss Track": {
    albumimage: "albm_jdst.jpg"
  },
  "Derealisation": {
    albumimage: "albm_jdst.jpg"
  },
  "1h11": {
    albumimage: "albm_jdst.jpg"
  },
  "Elle veut aller dans les states": {
    albumimage: "sngl_evadls.jpg"
  },
  "J'ai cesser de vous plaire": {
    albumimage: "sngl_jcdvp.jpg"
  },
  "Roule avec moi": {
    albumimage: "sngl_ram.jpg"
  },
  "Mr Redman": {
    albumimage: "albm_ps.jpg"
  },
  "A-t-elle": {
    albumimage: "albm_ps.jpg"
  },
  "Je ferais avec": {
    albumimage: "albm_ps.jpg"
  },
  "Compliqué pour moi": {
    albumimage: "albm_ps.jpg"
  },
  "Du temps": {
    albumimage: "albm_ps.jpg"
  },
  "Childhood cliché": {
    albumimage: "albm_ps.jpg"
  },
  "To Make the Pain Go Away": {
    albumimage: "albm_ps.jpg"
  },
  "Elle veut que je la laisse": {
    albumimage: "albm_ps.jpg"
  },
  "Je rêve encore": {
    albumimage: "albm_ps.jpg"
  },
  "Thanks to Her": {
    albumimage: "albm_ps.jpg"
  },
  "Dans ton panier": {
    albumimage: "albm_ps.jpg"
  },
  "J'ai plus d'espace": {
    albumimage: "albm_ps.jpg"
  },
  "Baby, qu'est ce que t'es": {
    albumimage: "albm_ps.jpg"
  },
  "Sorcellerie": {
    albumimage: "albm_ps.jpg"
  }
};

function setLanguage(lang) {
  if (lang) navigator.userLanguage = lang;
}

document.addEventListener("DOMContentLoaded", () => {
  var local_language = navigator.language || navigator.userLanguage;
  var tokeylist = Object.keys(randomquote);
  var randomKeyIndex = Math.round(Math.random() * (tokeylist.length - 1));
  var quoteLength = randomquote[tokeylist[randomKeyIndex]].lyricsquote[available_languages[local_language]].length;
  var randomQuoteIndex = Math.round(Math.random() * (quoteLength - 1));
  console.log(randomKeyIndex, randomQuoteIndex, quoteLength);

  boot_splash.querySelector('i').textContent = "“ " + randomquote[tokeylist[randomKeyIndex]].lyricsquote[available_languages[local_language]][randomQuoteIndex] + " ”";
  boot_splash.querySelector('.embbeded_container').innerHTML = randomquote[tokeylist[randomKeyIndex]].embbededlink;
  setTimeout(() => {
    //boot_splash.classList.add("open");
  }, 1000);
});

search_bar.querySelector("input").addEventListener('keydown', function (event) {
  if (event.key) {
    search_bar.querySelector("button").click();
    console.log("click");
  };
});

menu.addEventListener("click", function (event) {
  if (event.target.tagName === "INPUT" && event.target.type === "button") {
    if (event.target.value === "Plus...") {
      displayResult(musicmanifest);
      toggleClass(side_bar, "peak");
    };
  };
});

side_bar_backdrop.addEventListener("click", function (event) {
  if (event.target === this) {
    side_bar_backdrop.classList.add('hide');
  }
});

boot_splash.addEventListener("click", function (event) {
  if (event.target === this) {
    boot_splash.classList.add("open")
  }
});

function toggleClass(el, cla) {
  if (el.classList.contains(cla)) {
    el.classList.remove(cla);
  } else {
    el.classList.add(cla);
  }
}

var lastactive = undefined;
function toggleActive(el) {
  if (el === lastactive) {
    el.classList.remove("active");
    lastactive = undefined;
    return;
  }
  if (!!lastactive) {
    lastactive.classList.remove("active");
  };
  el.classList.add("active");
  lastactive = el;
}

const grid_items = document.getElementById("content_list").querySelectorAll(".grid_item");
console.log(grid_items)

grid_items.forEach((element, index) => {
  element.addEventListener('click', function (e) {
    toggleActive(this);
  })
});

function displayResult(obj) {
  const asKey = Object.keys(obj);
  var output = `<div class="list_grid"><h1 onclick="toggleClass(parentElement, 'reduce')">Morceaux</h1>`;

  var existing_lists = content_list.querySelectorAll(".list_grid");

  for (l in existing_lists) {
    console.log(existing_lists[l])
    if (existing_lists[l] instanceof HTMLDivElement) {
      existing_lists[l].remove();
    };
  }

  // RANDOM SORT // asKey.sort(() => Math.random() - 0.5);
  asKey.sort((a, b) => b - a);

  asKey.forEach((k, i) => {
    console.log(obj[k].albumimage);

    output += `<div class="grid_item" onclick="toggleActive(this)"><img src="assets/album_covers/${obj[k].albumimage}"><div class="metadata"><p>${k}</p></div></div>`;
  });

  output += '</div>'
  content_list.innerHTML += output;
}