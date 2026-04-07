import { AudioProject } from '/js/AudioProject.js'

const audio_sequence = await loadProject('/data/audio_template.json');

window.audio_sequence = audio_sequence;

export async function loadProject(url) {
  const res = await fetch(url)
  const json = await res.json()
  return new AudioProject(json)
}