import { Instrument } from "/js/Instrument.js";

export class DrumKitInstrument extends Instrument {
    constructor(context, {
        samples = {},
        ...options
    }) {
        super(context, options);
        this.samples = {};

        this.ready = this.load(samples);
    }

    async load(samples) {
        for (const note in samples) {
            const src = samples[note];

            if (typeof src === 'string') {
                const res = await fetch(src);
                const buf = await res.arrayBuffer();
                this.samples[note] = await this.c.decodeAudioData(buf);
            } else if (src instanceof AudioBuffer) {
                this.samples[note] = src;
            }
        }
    }

    playNote(note, time) {
        const buffer = this.samples[note.note];
        if (!buffer) return;

        const src = this.c.createBufferSource();
        const gain = this.c.createGain();

        src.buffer = buffer;
        gain.gain.value = note.velocity;

        src.connect(gain);
        gain.connect(this.fxInput);

        src.start(time);
    }
}
