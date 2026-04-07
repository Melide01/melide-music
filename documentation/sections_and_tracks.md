# Sections, pistes et notes

Ce document décrit comment les sections sont organisées et comment fonctionnent les événements de note.

## 1. `tracks`

Dans chaque section, `tracks` est un objet où chaque clé est le nom d'un instrument.
Chaque instrument contient un tableau d'événements de notes.

Exemple :

```json
"tracks": {
  "synthLead": [ ... ],
  "bass": [ ... ],
  "drums": [ ... ]
}
```

## 2. Événement de note

Chaque item du tableau de piste représente une note ou un pattern de notes.

### Champs disponibles

- `time` : moment de départ de l'événement.
  - Peut être un nombre unique, par exemple `31`.
  - Peut être un tableau de valeurs, par exemple `[0.5, 1.5]`.
- `duration` : durée de l'événement.
- `note` : nom de la note (`"C4"`, `"A3"`) ou numéro de note MIDI (`36`, `38`).
- `transpose` : transposition appliquée à l'événement.
- `velocity` : intensité de la note.
- `repeat` : nombre de répétitions.
- `repeatEnd` : position de fin de répétition.

### Exemple de note simple

```json
{
  "time": 31,
  "duration": 0.45,
  "note": "C4",
  "transpose": -12,
  "velocity": 0.1,
  "repeat": 4
}
```

### Exemple de note avec `time` multiple

```json
{
  "time": [0.5, 1.5],
  "duration": 0.45,
  "note": "E4",
  "transpose": -24,
  "velocity": 0.2,
  "repeat": 4
}
```

## 3. Pistes de batterie

Pour un instrument `drums`, le champ `note` est généralement un numéro MIDI correspondant à un sample.

Exemple :

```json
{
  "time": 0,
  "duration": 1,
  "note": 36,
  "velocity": 0.7,
  "repeat": 2,
  "repeatEnd": 16
}
```

## 4. Boucles et répétitions

- `repeat` indique combien de fois un événement se répète.
- `repeatEnd` définit jusqu'où la répétition doit se prolonger.

Une note peut être jouée immédiatement puis répétée automatiquement dans la même section.

## 5. Règles générales

- Les noms d'instruments dans `tracks` doivent correspondre aux clés définies dans `instruments`.
- `transpose` peut être appliqué globalement à la section ou localement à chaque note.
- La durée et les timings sont exprimés en unités de temps compatibles avec le tempo global.
