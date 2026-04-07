import { Instrument } from "/js/Instrument.js";
import { noteToFrequency } from "/js/Sequencer.js";
import { normalizeNote } from "/js/Sequencer.js";

export class SynthInstrument extends Instrument {
    constructor(context, options = {}) {
        super(context, options);
        this.wave = options.wave || 'sine';
    }

    playNote(note, time, duration, transpose = 0, secondsPerBeat) {
        const durationSec = duration * secondsPerBeat;

        const osc = this.c.createOscillator();
        const gain = this.c.createGain();

        const midi =
            normalizeNote(note.note) + transpose;

        osc.type = this.wave;
        osc.frequency.value =
            440 * Math.pow(2, (midi - 69) / 12);

        const a = this.adsr;

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(
            note.velocity,
            time + durationSec * a.attack
        );
        gain.gain.linearRampToValueAtTime(
            note.velocity * a.sustain,
            time + durationSec * (a.attack + a.decay)
        );
        gain.gain.linearRampToValueAtTime(
            0,
            time + durationSec + a.release
        );

        osc.connect(gain);
        gain.connect(this.fxInput);

        osc.start(time);
        osc.stop(time + durationSec + a.release);
    }
}
