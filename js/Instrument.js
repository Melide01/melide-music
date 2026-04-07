export class Instrument {
    constructor(context, {
        adsr = { attack: 0.1, decay: 0.1, sustain: 0.7, release: 0.1 },
        volume = 1.0,
        fx = {}
    } = {}) {
        this.c = context;
        this.adsr = adsr;
        this.volume = volume;

        // Input
        this.fxInput = this.c.createGain();

        // Dry / Wet
        this.dryGain = this.c.createGain();
        this.wetGain = this.c.createGain();

        // Output
        this.output = this.c.createGain();
        this.output.gain.value = volume;

        // Default dry
        this.fxInput.connect(this.dryGain);
        this.dryGain.connect(this.output);

        // Build FX
        this._buildFXChain(fx);

        // Final
        this.output.connect(this.c.destination);
    }

    _buildFXChain({ delay = null, reverb = null } = {}) {
        let wetNode = this.fxInput;

        /* =======================
           DELAY (dry / wet)
        ======================= */
        if (delay) {
            const delayNode = this.c.createDelay();
            const feedback = this.c.createGain();

            delayNode.delayTime.value = delay.time ?? 0.25;
            feedback.gain.value = delay.feedback ?? 0.3;

            delayNode.connect(feedback);
            feedback.connect(delayNode);

            wetNode.connect(delayNode);
            wetNode = delayNode;

            this.wetGain.gain.value = delay.mix ?? 0.3;
        }

        /* =======================
           REVERB (algorithmic)
        ======================= */
        if (reverb) {
            const reverbNode = this._createReverb(reverb);
            wetNode.connect(reverbNode);
            wetNode = reverbNode;

            this.wetGain.gain.value = reverb.wet ?? 0.3;
        }

        // Wet to output
        wetNode.connect(this.wetGain);
        this.wetGain.connect(this.output);
    }

    /* =======================
       SIMPLE ALGO REVERB
    ======================= */
    _createReverb({
        length = 2.0,
        damp = 3000,
        feedback = 0.8
    } = {}) {
        const input = this.c.createGain();
        const output = this.c.createGain();

        const delayTimes = [0.0297, 0.0371, 0.0411, 0.0437];

        delayTimes.forEach(time => {
            const d = this.c.createDelay();
            const g = this.c.createGain();
            const f = this.c.createBiquadFilter();

            d.delayTime.value = time * length;
            g.gain.value = feedback;

            f.type = 'lowpass';
            f.frequency.value = damp;

            input.connect(d);
            d.connect(f);
            f.connect(g);
            g.connect(d);
            d.connect(output);
        });

        return Object.assign(input, { connect: output.connect.bind(output) });
    }

    playNote(note, time, duration, transpose) { }
}
