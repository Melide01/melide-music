import { Instrument } from "/js/Instrument.js";
import { normalizeNote } from "/js/Sequencer.js";

export class SamplerInstrument extends Instrument {
    constructor(context, {
        buffer,
        rootNote = 60,
        ...options
    }) {
        super(context, options);
        this.rootNote = rootNote;
        this.buffer = null;


        this.ready = (async () => {
            if (typeof buffer === 'string') {
                const res = await fetch(buffer);
                const buf = await res.arrayBuffer();
                this.buffer = await this.c.decodeAudioData(buf);
            } else if (buffer instanceof AudioBuffer) {
                this.buffer = buffer;
            }
        })();
    }

    playNote(note, time, duration, transpose = 0, secondsPerBeat) {
        if (!this.buffer) return;

        const durationSec = duration * secondsPerBeat;

        const src = this.c.createBufferSource();
        const gain = this.c.createGain();

        const midi =
            normalizeNote(note.note) + transpose;

        src.buffer = this.buffer;
        src.playbackRate.value = Math.pow(
            2,
            (midi - this.rootNote) / 12
        );

        gain.gain.setValueAtTime(note.velocity, time);

        src.connect(gain);
        gain.connect(this.fxInput);

        src.start(time);
        src.stop(time + durationSec + this.adsr.release);
    }
}
