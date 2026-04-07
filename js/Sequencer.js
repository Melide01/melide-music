export class Sequencer {
    constructor(context, bpm, instruments, sections, patterns = []) {
        this.c = context;
        this.bpm = bpm;
        this.secondsPerBeat = 60 / bpm;

        this.instruments = instruments;
        this.sections = sections;
        this.patterns = patterns;
        this.currentSection = sections[0].name;

        this.isPlaying = false;
        this.startTime = 0;
        this.lookahead = 0.1;
        this.interval = null;

        this.currentSectionIndex = 0;
        this.sectionStartTime = 0;
        this.sectionStartBeat = 0;
        this.lastScheduledBeat = -1;
        this.loopCounts = {};
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
        this.loopCounts[this.currentSectionIndex] = 0;
    }

    _nextSection() {
        this._onSectionChange(this.currentSectionIndex + 1);
    }

    _shouldLoopSection(section) {
        if (section.loop === true) return true;

        if (typeof section.loop === 'number' && section.loop > 0) {
            const loopKey = this.currentSectionIndex;
            const currentCount = this.loopCounts[loopKey] || 0;
            const nextCount = currentCount + 1;

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

        // Section length: explicit or computed from patterns
        const sectionLength = section.length ?? computeSectionLength(section, this.patterns);

        const elapsedSec = now - this.sectionStartTime;
        const elapsedBeats = elapsedSec / this.secondsPerBeat;

        // SECTION END
        if (elapsedBeats >= sectionLength) {
            const shouldLoop = this._shouldLoopSection(section);
            if (this.lockSection || shouldLoop) {
                this._onSectionChange(this.currentSectionIndex);
            } else {
                this._nextSection();
            }
            this._scheduleNotes(lookaheadTime);
            return;
        }

        const lookaheadBeats =
            (lookaheadTime - this.sectionStartTime) / this.secondsPerBeat +
            this.sectionStartBeat;

        const tracks = section.tracks;

        for (const track of tracks) {
            // Support single instrument string OR array of instruments
            const instrNames = Array.isArray(track.instrument)
                ? track.instrument
                : [track.instrument];

            // Support single pattern index OR array of sequential patterns
            const patternIndices = Array.isArray(track.pattern)
                ? track.pattern
                : [track.pattern];

            // Play patterns sequentially: accumulate time offset per pattern
            let patternOffset = 0;

            for (const patIdx of patternIndices) {
                const rawPattern = this.patterns[patIdx];
                if (!rawPattern) {
                    console.warn(`Pattern index ${patIdx} not found`);
                    continue;
                }

                // Pattern can be a plain notes array OR { notes, length }
                const notes = Array.isArray(rawPattern) ? rawPattern : rawPattern.notes;
                const patternLength = Array.isArray(rawPattern)
                    ? computePatternLength(notes)
                    : (rawPattern.length ?? computePatternLength(notes));

                // Apply this pattern to every instrument in the track
                for (const instrName of instrNames) {
                    const instrument = this.instruments[instrName];
                    if (!instrument) {
                        console.warn(`Instrument "${instrName}" not found`);
                        continue;
                    }

                    notes.forEach(note => {
                        // Expand repeats relative to pattern length, then shift by offset
                        const beats = expandNoteBeats(note, patternLength, patternOffset);
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
                                    typeof note.duration === 'number'
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

                patternOffset += patternLength;
            }
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
        this.loopCounts[this.currentSectionIndex] = 0;

        for (const inst of Object.values(this.instruments)) {
            if (typeof inst.resyncAll === 'function') {
                inst.resyncAll();
            }
        }
    }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Expand a note's beat times, applying repeat logic within the pattern's
 * local length, then shifting by patternOffset so they land correctly in
 * the section timeline.
 *
 * @param {object} note
 * @param {number} patternLength - length of the containing pattern in beats
 * @param {number} patternOffset - beat offset of this pattern within the section
 */
function expandNoteBeats(note, patternLength, patternOffset = 0) {
    const times = Array.isArray(note.time) ? note.time : [note.time];
    const repeat = typeof note.repeat === 'number' ? note.repeat : null;

    const beats = [];

    for (const baseTime of times) {
        if (!repeat) {
            beats.push(baseTime + patternOffset);
            continue;
        }

        const start =
            typeof note.repeatStart === 'number'
                ? note.repeatStart
                : baseTime;

        // repeatEnd is relative to the pattern, not the section
        const end =
            typeof note.repeatEnd === 'number'
                ? note.repeatEnd
                : patternLength;

        let b = Math.max(baseTime, start);

        while (b < end) {
            beats.push(b + patternOffset);
            b += repeat;
        }
    }

    return beats;
}

/**
 * Compute the natural length of a pattern from its notes.
 * Uses the highest effective end-beat (repeatEnd or time + duration).
 */
function computePatternLength(notes) {
    let max = 0;
    for (const note of notes) {
        const times = Array.isArray(note.time) ? note.time : [note.time];
        const baseMax = Math.max(...times);

        let end;
        if (typeof note.repeatEnd === 'number') {
            end = note.repeatEnd;
        } else if (typeof note.repeat === 'number') {
            end = baseMax + note.repeat;
        } else {
            end = baseMax + (note.duration ?? 1);
        }

        max = Math.max(max, end);
    }
    return max;
}

/**
 * Compute a section's total length from the sum of its longest track's
 * sequential patterns. Used when section.length is omitted.
 */
function computeSectionLength(section, patterns) {
    if (!section.tracks || !section.tracks.length) return 0;

    let maxLength = 0;

    for (const track of section.tracks) {
        const patternIndices = Array.isArray(track.pattern)
            ? track.pattern
            : [track.pattern];

        let totalLength = 0;

        for (const idx of patternIndices) {
            const raw = patterns[idx];
            if (!raw) continue;
            const notes = Array.isArray(raw) ? raw : raw.notes;
            const len = Array.isArray(raw)
                ? computePatternLength(notes)
                : (raw.length ?? computePatternLength(notes));
            totalLength += len;
        }

        maxLength = Math.max(maxLength, totalLength);
    }

    return maxLength;
}

// ─── Note utilities (exported for instruments) ──────────────────────────────

export function noteToFrequency(note) {
    const midi = typeof note === 'number'
        ? note
        : noteStringToMidi(note);

    return 440 * Math.pow(2, (midi - 69) / 12);
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
