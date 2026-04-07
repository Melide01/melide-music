import { AudioEngine } from '/js/AudioEngine.js'
import { AudioPlayer } from '/js/AudioPlayer.js'
import { AudioTrack } from '/js/AudioTrack.js'

import { Sequencer } from '/js/Sequencer.js'
import { InstrumentManager } from '/js/InstrumentManager.js'

import { SynthInstrument } from '/js/instruments/SynthInstrument.js'
import { SamplerInstrument } from '/js/instruments/SamplerInstrument.js'
import { DrumKitInstrument } from '/js/instruments/DrumKitInstrument.js'

export class AudioProject {
    constructor(data) {
        this.engine = new AudioEngine()
        this.instrumentManager = new InstrumentManager(this.engine.context)
        this.data = data

        // Support both new { meta: { bpm } } and legacy { tempo } shapes
        const bpm = data.meta?.bpm ?? data.tempo ?? 120

        const instruments = this._buildInstruments()

        this.sequencer = new Sequencer(
            this.engine.context,
            bpm,
            instruments,
            data.sections,
            data.patterns || []
        )
    }

    _buildInstruments() {
        const map = {}

        if (!this.data.instruments) {
            console.warn('No instruments defined in project')
            return map
        }

        // instruments can be an object map { name: def } (both old and new format)
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
                    console.warn(`Unknown instrument type "${def.type}", defaulting to synth`)
                    instrument = new SynthInstrument(this.engine.context, {})
            }

            map[name] = instrument
        })

        return map
    }

    play() {
        this.sequencer.play()
    }

    stop() {
        this.sequencer.stop()
    }

    // Jump to a specific section by name or index
    goTo(nameOrIndex) {
        this.sequencer.setSection(nameOrIndex)
    }

    updateTrack(index, notes) {
        this.sequencer.updateTrack(index, notes)
    }
}
