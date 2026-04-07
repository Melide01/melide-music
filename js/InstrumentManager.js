export class InstrumentManager {
    constructor() {
        this.instruments = {};
    }

    add(name, instrument) {
        this.instruments[name] = instrument;
    }

    get(name) {
        return this.instruments[name];
    }
}