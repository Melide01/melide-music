export class Sequencer {
    constructor(context, bpm, instruments, sections) {
        this.c = context;
        this.bpm = bpm;
        this.secondsPerBeat = 60 / bpm;

        this.instruments = instruments;
        this.sections = sections;
        this.currentSection = sections[0].name;

        this.isPlaying = false;
        this.startTime = 0;
        this.lookahead = 0.1;
        this.interval = null;

        this.currentSectionIndex = 0;
        this.sectionStartTime = 0;
        this.sectionStartBeat = 0;
        this.lastScheduledBeat = -1;
        this.loopCounts = {}; // Track loop iterations per section

    }

    play({ lockSection = false, goToSection = null } = {}) {
        if (goToSection !== null) {
            this.setSection(goToSection);
        }

        this.lockSection = lockSection;
        this.sectionStartTime = this.c.currentTime;
        this.lastScheduledBeat = -1;

        this.isPlaying = true;
        this._scheduleLoop();
    }


    stop() {
        this.isPlaying = false;
        clearInterval(this.interval);
    }

    setSection(nameOrIndex) {
        if (typeof nameOrIndex === 'number') {
            this.currentSectionIndex =
                (nameOrIndex + this.sections.length) % this.sections.length;
        } else {
            const idx = this.sections.findIndex(s => s.name === nameOrIndex);
            if (idx !== -1) this.currentSectionIndex = idx;
        }

        this.currentSection = this.sections[this.currentSectionIndex].name;
        this.sectionStartTime = this.c.currentTime;
        this.lastScheduledBeat = -1;
        this.loopCounts[this.currentSectionIndex] = 0; // Reset loop count
    }

    _nextSection() { // HERE
        this._onSectionChange(this.currentSectionIndex + 1);
    }

    _shouldLoopSection(section) {
        // If loop is true (boolean), loop infinitely
        if (section.loop === true) return true;

        // If loop is an integer > 0, check loop count
        if (typeof section.loop === 'number' && section.loop > 0) {
            const loopKey = this.currentSectionIndex;
            const currentCount = this.loopCounts[loopKey] || 0;
            const nextCount = currentCount + 1;

            // If we haven't reached the loop limit, loop once more
            if (nextCount < section.loop) {
                this.loopCounts[loopKey] = nextCount;
                return true;
            }
        }

        return false;
    }

    _scheduleLoop() {
        this.interval = setInterval(() => {
            if (!this.isPlaying) return;

            const now = this.c.currentTime;
            const lookaheadTime = now + this.lookahead;

            this._scheduleNotes(lookaheadTime);
        }, 25);
    }

    _scheduleNotes(lookaheadTime) {
        const section = this.sections[this.currentSectionIndex];
        const now = this.c.currentTime;

        const elapsedSec = now - this.sectionStartTime;
        const elapsedBeats = elapsedSec / this.secondsPerBeat;
        const sectionLength = section.length;

        // SECTION END
        if (elapsedBeats >= sectionLength) {
            const shouldLoop = this._shouldLoopSection(section);
            if (this.lockSection || shouldLoop) {
                this._onSectionChange(this.currentSectionIndex);
            } else {
                this._nextSection();
            }
            // Immediately reschedule for the new section to avoid audio gaps
            this._scheduleNotes(lookaheadTime);
            return;
        }

        const lookaheadBeats =
            (lookaheadTime - this.sectionStartTime) / this.secondsPerBeat +
            this.sectionStartBeat;

        for (const trackName in section.tracks) {
            const instrument = this.instruments[trackName];
            const notes = section.tracks[trackName];

            notes.forEach(note => {
                const beats = expandNoteBeats(note, sectionLength);
                const transpose = (section.transpose || 0) + (note.transpose || 0);

                beats.forEach(sectionBeat => {
                    const globalBeat = sectionBeat + this.sectionStartBeat;

                    if (
                        globalBeat >= this.sectionStartBeat &&
                        globalBeat >= this.lastScheduledBeat &&
                        globalBeat < lookaheadBeats
                    ) {
                        const time =
                            this.sectionStartTime +
                            (globalBeat - this.sectionStartBeat) *
                            this.secondsPerBeat;
                        
                        const durationBeats = 
                            typeof note.duration === "number"
                                ? note.duration
                                : 1;
                        
                        instrument.playNote(
                            note,
                            time,
                            durationBeats,
                            transpose,
                            this.secondsPerBeat,
                            this.sectionStartBeat
                        );
                    }
                });
            });
        }

        this.lastScheduledBeat = lookaheadBeats;
    }


    getVisualBar(num) {
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

    _onSectionChange(newSectionIndex) {
        this.currentSectionIndex =
            (newSectionIndex + this.sections.length) % this.sections.length;

        this.currentSection =
            this.sections[this.currentSectionIndex].name;

        this.sectionStartTime = this.c.currentTime;
        this.sectionStartBeat = 0;
        this.lastScheduledBeat = -1;
        this.loopCounts[this.currentSectionIndex] = 0; // Reset loop count for new section

        // 🔄 HARD RESYNC AUDIO TRACKS
        for (const inst of Object.values(this.instruments)) {
            if (typeof inst.resyncAll === 'function') {
                inst.resyncAll();
            }
        }
    }
}

export function noteToFrequency(note) {
    const midi = typeof note === 'number'
        ? note
        : noteStringToMidi(note);

    return 440 * Math.pow(2, (midi - 69) / 12);
}

function expandNoteBeats(note, sectionLength) {
    const times = Array.isArray(note.time) ? note.time : [note.time];
    const repeat = typeof note.repeat === 'number' ? note.repeat : null;

    const beats = [];

    for (const baseTime of times) {
        // No repeat → single hit
        if (!repeat) {
            beats.push(baseTime);
            continue;
        }

        const start =
            typeof note.repeatStart === 'number'
                ? note.repeatStart
                : baseTime;

        const end =
            typeof note.repeatEnd === 'number'
                ? note.repeatEnd
                : sectionLength;

        // Ensure sane bounds
        let b = Math.max(baseTime, start);

        while (b < end) {
            beats.push(b);
            b += repeat;
        }
    }

    return beats;
}

export function normalizeNote(note) {
    if (typeof note === 'number') return note;
    return noteStringToMidi(note);
}

export function noteStringToMidi(note) {
    if (typeof note !== 'string') return note;

    const noteMap = {
        C: 0, 'C#': 1,
        D: 2, 'D#': 3,
        E: 4,
        F: 5, 'F#': 6,
        G: 7, 'G#': 8,
        A: 9, 'A#': 10,
        B: 11
    };

    const match = note.match(/^([A-G]#?)(-?\d+)$/);
    if (!match) {
        console.warn('Invalid note string:', note);
        return 69; // fallback A4
    }

    const [, pitch, octave] = match;
    return noteMap[pitch] + (parseInt(octave, 10) + 1) * 12;
}
