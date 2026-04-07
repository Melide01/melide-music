import { AudioEngine } from '/js/AudioEngine.js';
import { Sequencer } from '/js/Sequencer.js';

export class AudioPlayer {
    constructor(engine, src, autoplay, loop, bpm, key, instruments, sections) {
        this.engine = engine ? engine : new AudioEngine();
        this.c = this.engine.context;

        // Legacy buffer playback
        this.src = src;
        this.audio = null;

        // Transport
        this.bpm = bpm;
        this.key = key;

        this.isPlaying = false;
        this.isStopping = false;

        // Visuals
        this.analyser = this.c.createAnalyser();
        this.analyser.fftSize = 1024;
        this.analyser.smoothingTimeConstant = 0;

        if (instruments && sections) {
            
            this.sequencer = new Sequencer(
                this.c,
                bpm,
                instruments,
                sections
            );
        }

        if (src) this.load(src, autoplay);
    }

    async load(src, autoplay) {
        const res = await fetch(src);
        const buf = await res.arrayBuffer();
        this.audio = await this.c.decodeAudioData(buf);
        if (autoplay) this.playback();
    }

    async playback({ lockSection = false, goToSection = null } = {}) {
        await this.engine.resume();
        if (this.isPlaying) return;

        if (this.sequencer) {
            const ready = Object.values(this.sequencer.instruments)
                .map(i => i.ready || Promise.resolve());
            await Promise.all(ready);

            this.sequencer.play({ lockSection, goToSection });
            this.isPlaying = true;
        }
    }


    _playBuffer(offset = 0) {
        if (!this.audio) return;

        this.source = this.c.createBufferSource();
        this.source.buffer = this.audio;
        this.source.loop = this.loop;

        this.source.connect(this.analyser);
        this.analyser.connect(this.c.destination);

        this.startTime = this.c.currentTime;
        this.pauseTime = offset;
        this.isStopping = false;

        this.source.start(0, offset);
        this.isPlaying = true;

        this.source.onended = () => {
            if (this.isStopping) return;

            this.isPlaying = false;
            
            if (!this.loop) {
                this.pauseTime = 0;
            }
        };
    }

    pause() {
        if (!this.isPlaying) return;

        if (this.sequencer) this.sequencer.stop();

        if (this.source) {
            this.isStopping = true;

            const elapsed = this.c.currentTime - this.startTime;
            this.pauseTime += elapsed;

            this.source.stop();
            this.source.disconnect();
            this.source = null;
        }

        this.isPlaying = false;
    }

    seek(time) {
        const wasPlaying = this.isPlaying;
        this.pauseTime = Math.max(0, time);

        if (wasPlaying) {
            this.pause();
            
            setTimeout(() => {
                this.playback();    
            }, 100);
        }
    }

    getVisualBar(num = 8) {
        if (!this.analyser) return [];

        const buffer = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(buffer);

        const bars = new Array(num).fill(0);
        const step = Math.floor(buffer.length / num);

        for (let i = 0; i < num; i++) {
            let sum = 0;
            for (let j = 0; j < step; j++) {
                sum += buffer[i * step + j];
            }
            bars[i] = sum / step / 255;
        }

        return bars;
    }

    getDuration() {
        return this.audio ? this.audio.duration : 0;
    }

    getTime() {
        if (!this.isPlaying) {
            return this.pauseTime || 0;
        }

        return (this.pauseTime || 0) + (this.c.currentTime - this.startTime);
    }

}
