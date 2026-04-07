import { AudioEngine } from '/js/AudioEngine.js'
import { AudioPlayer } from '/js/AudioPlayer.js'
import { AudioTrack } from '/js/AudioTrack.js'

import { Sequencer } from '/js/Sequencer.js'
import { InstrumentManager } from '/js/InstrumentManager.js'

import { SynthInstrument } from '/js/instruments/SynthInstrument.js'
import { SamplerInstrument } from '/js/instruments/SamplerInstrument.js'
import { DrumKitInstrument } from '/js/instruments/DrumKitInstrument.js'

import { PianoRoll } from '/js/ui/PianoRoll.js'

export class AudioProject {
    constructor(data) {
        this.engine = new AudioEngine()
        this.instrumentManager = new InstrumentManager(this.engine.context)
        this.data = data

        // Build dependencies first
        const instrument = this._buildInstruments()

        this.sequencer = new Sequencer(
            this.engine.context,
            data.tempo || 120,
            instrument,
            data.sections
        )


        // this._load()
    }

    _buildInstruments() {
        const map = {}

        if (!this.data.instruments) {
            console.warn("No instruments defined in project")
            return map
        }

        Object.entries(this.data.instruments).forEach(([name, def]) => {
            let instrument

            switch (def.type) {
                case 'synth':
                    instrument = new SynthInstrument(this.engine.context, def.options || {})
                    break

                case 'sampler':
                    instrument = new SamplerInstrument(this.engine.context, def.options || {})
                    break

                case 'drums':
                    instrument = new DrumKitInstrument(this.engine.context, def.options || {})
                    break

                default:
                    instrument = new SynthInstrument(this.engine.context, {})
            }

            map[name] = instrument
        })

        return map
    }

    _buildTracksForSection(startBeat, length) {
        const tracks = {}

        this.data.tracks.forEach(track => {
            const name = track._instrumentName

            tracks[name] = track.notes.filter(n =>
                n.time >= startBeat &&
                n.time < startBeat + length
            )
        })

        return tracks
    }

    _load() {
        if (!this.data || !this.data.tracks) return

        this.data.tracks.forEach(track => {
            const instrument = this._createInstrument(track.instrument)

            this.sequencer.addTrack({
                instrument,
                notes: track.notes || []
            })
        })

        if (this.data.tempo) {
            this.sequencer.setTempo(this.data.tempo)
        }
    }

    play() {
        this.sequencer.play()
    }

    stop() {
        this.sequencer.stop()
    }

    updateTrack(index, notes) {
        this.sequencer.updateTrack(index, notes)
    }
}