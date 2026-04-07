export class AudioTrack {
  constructor(context, {
    files = {},
    volume = 1.0,
    resync = 'section' // 'section' | 'bar' | 'beat'
  }) {
    this.c = context;
    this.files = {};
    this.volume = volume;
    this.resync = resync;

    this.output = this.c.createGain();
    this.output.gain.value = volume;
    this.output.connect(this.c.destination);

    this.activeSources = new Map(); // clipName → BufferSource
    this.ready = this._load(files);
  }

  async _load(files) {
    for (const key in files) {
      const res = await fetch(files[key]);
      const buf = await res.arrayBuffer();
      this.files[key] = await this.c.decodeAudioData(buf);
    }
  }

  stopClip(name) {
    const src = this.activeSources.get(name);
    if (src) {
      try { src.stop(); } catch {}
      this.activeSources.delete(name);
    }
  }

  /**
   * Called by the sequencer
   */
    playNote(note, time, durationBeats, transpose, secondsPerBeat) {
        const buffer = this.files[note.clip];
        if (!buffer) return;

        this.stopClip(note.clip);

        const src = this.c.createBufferSource();
        const gain = this.c.createGain();

        const offsetBeats = note.offset || 0;
        const offsetSec = offsetBeats * secondsPerBeat;

        const durBeats =
            typeof note.duration === 'number'
                ? note.duration
                : buffer.duration / secondsPerBeat;

        src.buffer = buffer;
        gain.gain.value = note.gain ?? 1.0;

        src.connect(gain);
        gain.connect(this.output);

        src.start(time, offsetSec);
        src.stop(time + durBeats * secondsPerBeat);

        this.activeSources.set(note.clip, src);
    }


  /**
   * Called explicitly by Sequencer on section loop
   */
  resyncAll() {
    for (const name of this.activeSources.keys()) {
      this.stopClip(name);
    }
  }
}
