export class PianoRoll {
  constructor({
    container,
    beats = 16,
    centerNote = 60,
    keyRange = 48,
    beatWidth = 40,
    noteHeight = 16
  }) {
    this.container = container;
    this.beats = beats;
    this.centerNote = centerNote;
    this.keyRange = keyRange;

    this.beatWidth = beatWidth;
    this.noteHeight = noteHeight;

    this._recomputeNoteRange();

    this.notes = [];
    this.activeNote = null;
    this.mode = null;

    this._buildDOM();
    this._bindEvents();
    this._drawGrid();
  }

  /* ---------- RANGE ---------- */

  _recomputeNoteRange() {
    const half = Math.floor(this.keyRange / 2);
    this.minNote = this.centerNote - half;
    this.maxNote = this.centerNote + half;
  }

  setDuration(beats) {
    this.beats = Math.max(1, beats);
    this._resize();
    this._clampNotes();
  }

  setKeyRange(range) {
    this.keyRange = Math.max(12, range);
    this._recomputeNoteRange();
    this._resize();
    this._clampNotes();
  }

  _clampNotes() {
    this.notes.forEach(n => {
      n.time = Math.min(Math.max(0, n.time), this.beats - 0.25);
      n.duration = Math.min(n.duration, this.beats - n.time);
      this._updateNoteEl(n);
    });
  }


  /* ---------- DOM ---------- */

  _buildDOM() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    this.notesLayer = document.createElement('div');
    this.notesLayer.className = 'notes-layer';

    this.container.appendChild(this.canvas);
    this.container.appendChild(this.notesLayer);

    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this.canvas.width = this.beats * this.beatWidth;
    this.canvas.height = (this.maxNote - this.minNote + 1) * this.noteHeight;

    this.container.style.width = this.canvas.width + 'px';
    this.container.style.height = this.canvas.height + 'px';

    this._drawGrid();
  }

  /* ---------- Mapping ---------- */

  _beatToX(b) { return b * this.beatWidth; }

  _xToBeat(x) {
    return Math.round(x / this.beatWidth * 4) / 4;
  }

  _noteToY(n) {
    return (this.maxNote - n) * this.noteHeight;
  }

  _yToNote(y) {
    return Math.min(
      this.maxNote,
      Math.max(this.minNote,
        this.maxNote - Math.floor(y / this.noteHeight)
      )
    );
  }

  /* ---------- Grid ---------- */

  _drawGrid() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i <= this.beats; i++) {
      ctx.strokeStyle = i % 4 === 0 ? '#444' : '#222';
      ctx.beginPath();
      ctx.moveTo(i * this.beatWidth, 0);
      ctx.lineTo(i * this.beatWidth, this.canvas.height);
      ctx.stroke();
    }

    for (let n = this.minNote; n <= this.maxNote; n++) {
      const y = this._noteToY(n);
      ctx.strokeStyle = '#222';
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
      ctx.stroke();
    }
  }

  /* ---------- Notes ---------- */

  addNote(note) {
    note.time = Math.min(Math.max(0, note.time), this.beats - 0.25);
    note.note = Math.min(this.maxNote, Math.max(this.minNote, note.note));

    const el = document.createElement('div');
    el.className = 'note';
    note.el = el;

    this.notes.push(note);
    this.notesLayer.appendChild(el);
    this._updateNoteEl(note);

    el.addEventListener('mousedown', e => {
      e.stopPropagation();
      this.activeNote = note;
      this.mode = e.offsetX > el.clientWidth - 6 ? 'resize' : 'move';
      this.offsetX = e.offsetX;
      this.offsetY = e.offsetY;
    });

    el.addEventListener('dblclick', e => {
      e.stopPropagation();
      this._removeNote(note);
    });
  }

  _removeNote(note) {
    const i = this.notes.indexOf(note);
    if (i !== -1) this.notes.splice(i, 1);
    note.el.remove();
  }


  _updateNoteEl(note) {
    // Hide if outside range
    if (note.note < this.minNote || note.note > this.maxNote) {
      note.el.style.display = 'none';
      return;
    }

    note.el.style.display = 'block';

    note.el.style.left = this._beatToX(note.time) + 'px';
    note.el.style.top = this._noteToY(note.note) + 'px';
    note.el.style.width = this._beatToX(note.duration) + 'px';
  }


  /* ---------- Events ---------- */

  _bindEvents() {
    this.container.addEventListener('mousedown', e => {
      if (e.target.classList.contains('note')) return;

      const rect = this.container.getBoundingClientRect();
      const time = this._xToBeat(e.clientX - rect.left);
      const note = this._yToNote(e.clientY - rect.top);

      this.addNote({ time, duration: 1, note, velocity: 0.8 });
    });

    window.addEventListener('mousemove', e => {
      if (!this.activeNote) return;

      const rect = this.container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (this.mode === 'move') {
        this.activeNote.time = Math.min(
          this.beats - 0.25,
          Math.max(0, this._xToBeat(x - this.offsetX))
        );
        this.activeNote.note = this._yToNote(y);
      }

      if (this.mode === 'resize') {
        this.activeNote.duration = Math.min(
          this.beats - this.activeNote.time,
          Math.max(0.25, this._xToBeat(x) - this.activeNote.time)
        );
      }

      this._updateNoteEl(this.activeNote);
    });

    window.addEventListener('mouseup', () => {
      this.activeNote = null;
      this.mode = null;
    });
  }

  /* ---------- API ---------- */

  getNotes() {
    return this.notes.map(({ el, ...n }) => n);
  }
}
