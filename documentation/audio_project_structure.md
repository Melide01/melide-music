# Structure du projet audio

Ce document explique la structure principale de `data/audio_template.json`.

## 1. `tempo`

- Type : number
- Description : tempo global du projet en battements par minute (BPM).
- Exemple : `116`

## 2. `instruments`

Cette section liste les instruments disponibles dans le projet.
Chaque instrument contient :

- `type` : type d'instrument.
- `options` : options spécifiques à l'instrument.

### Types d'instruments

- `synth` : instrument synthétiseur.
- `drums` : instrument de batterie utilisant des échantillons.

### Exemple d'instrument `synth`

```json
"synthLead": {
  "type": "synth",
  "options": {
    "wave": "sawtooth",
    "adsr": {
      "attack": 0.0,
      "decay": 1,
      "sustain": 0.7,
      "release": 0.05
    },
    "fx": {
      "reverb": {
        "wet": 0.2,
        "length": 10,
        "damp": 3000,
        "feedback": 0.5
      }
    }
  }
}
```

### Exemple d'instrument `drums`

```json
"drums": {
  "type": "drums",
  "options": {
    "samples": {
      "36": "/assets/sounds/NGTN - Kick Tight Candy.mp3",
      "38": "/assets/sounds/825374__tboneaudio__snare-to-god.mp3"
    }
  }
}
```

### Options communes pour `synth`

- `wave` : forme d'onde (`sawtooth`, `square`, `sine`, etc.).
- `adsr` : enveloppe du synthétiseur.
  - `attack` : temps d'attaque.
  - `decay` : temps de décroissance.
  - `sustain` : niveau de sustain.
  - `release` : temps de relâchement.
- `fx` : effets appliqués à l'instrument.
  - `reverb` : configuration de la réverbération.

### Options pour `drums`

- `samples` : map note MIDI -> chemin de fichier audio.

## 3. `sections`

`sections` est un tableau d'objets, chacun représentant une partie de la composition.

Chaque section contient :

- `name` : nom de la section.
- `length` : durée de la section en temps (mesures ou unités de temps).
- `speed` : vitesse de lecture locale de la section.
- `volume` : niveau global de la section.
- `transpose` : transposition appliquée à toute la section.
- `loop` : booléen indiquant si la section doit boucler.
- `tracks` : pistes par instrument.

## Exemple d'une section

```json
{
  "name": "PC",
  "length": 32,
  "speed": 1,
  "volume": 1,
  "transpose": 5,
  "loop": false,
  "tracks": {
    "synthLead": [ ... ],
    "bass": [ ... ],
    "drums": [ ... ]
  }
}
```
