export class AudioEngine {
    static instance;

    constructor() {
        if (AudioEngine.instance) {
            return AudioEngine.instance;
        }

        this.context = new AudioContext();

        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);

        AudioEngine.instance = this;
    }

    resume() {
        if (this.context.state !== 'running') {
            this.context.resume();
        }
    }
}