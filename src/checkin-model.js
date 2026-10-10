export const EMOTIONS = ['Anxious','Worried','Afraid','Overwhelmed','Restless','Tense','Irritable','Sad','Frustrated','Calm','Hopeful','Neutral','Something else'];
export const SYMPTOMS = ['Racing heart','Chest tightness','Shortness of breath','Dizziness/lightheadedness','Sweating','Shaking','Muscle tension','Stomach discomfort','Nausea/butterflies','Difficulty concentrating','Feeling hot/cold','Restlessness','Feeling detached/unreal','Something else','Nothing noticeable'];
export const CONTEXTS = ['Work / school','Social situation','Relationship','Health','Money','Family','Future','Performance','Being alone','Travel','Sleep','Online / social media',"I don't know",'Something else'];
export const BEHAVIORS = ['Stayed in the situation','Avoided it','Left early','Put it off','Asked someone for reassurance','Checked something repeatedly','Distracted myself','Used breathing or relaxation','Talked to someone','Tried to push the thoughts away','Did nothing different','Something else'];
export const AREAS = ['School/work','Social life','Relationships','Sleep','Eating','Leaving home','Concentration','Daily responsibilities','Something else'];
export const STORE_KEY = 'paasaa.checkins.v1';
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function newDraft() {
  return {
    schemaVersion: 1, checkInId: crypto.randomUUID(), patientId: null,
    timestamp: new Date().toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    localDate: localDate(), status: 'draft', step: 0,
    anxietyIntensity: null, emotions: [], physicalSymptoms: [], contextCategories: [], contextNarrative: '',
    automaticThought: '', thoughtBeliefStrength: null, behaviors: [], functionalImpact: null, interferenceAreas: [],
    notes: {}, voice: { used: false, transcription: null, patientApprovedVersion: '', sources: [] },
    completionDuration: 0, completedAt: null,
  };
}
const fields = ['emotions','physicalSymptoms','contextCategories','behaviors','interferenceAreas'];
export function validRecord(r) {
  return r && r.schemaVersion === 1 && typeof r.checkInId === 'string' && typeof r.timestamp === 'string'
    && typeof r.localDate === 'string' && typeof r.timezone === 'string'
    && Number.isFinite(r.completionDuration) && r.completionDuration >= 0
    && Number.isInteger(r.step) && r.step >= 0 && r.step <= 7
    && fields.every(f => Array.isArray(r[f]) && r[f].every(v => typeof v === 'string'))
    && ['contextNarrative','automaticThought'].every(f => typeof r[f] === 'string')
    && ['anxietyIntensity','functionalImpact'].every(f => r[f] === null || Number.isInteger(r[f]) && r[f] >= 0 && r[f] <= 10)
    && (r.thoughtBeliefStrength === null || Number.isInteger(r.thoughtBeliefStrength) && r.thoughtBeliefStrength >= 0 && r.thoughtBeliefStrength <= 100)
    && r.notes && typeof r.notes === 'object' && r.voice && Array.isArray(r.voice.sources);
}
export class CheckInStore {
  constructor(storage) {
    this.storage = storage; this.mode = 'session'; this.draft = null; this.records = []; this.error = '';
    try {
      const raw = storage?.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.version !== 1 || !Array.isArray(saved.records) || !saved.records.every(validRecord) || saved.draft && !validRecord(saved.draft)) throw Error('Invalid saved data');
        this.mode = 'device'; this.draft = saved.draft; this.records = saved.records;
      }
    } catch { this.error = 'Saved check-ins could not be loaded. They have not been overwritten. Use session-only mode or clear saved data.'; this.blocked = true; }
  }
  persist() {
    if (this.mode !== 'device' || this.blocked) return false;
    try {
      this.storage.setItem(STORE_KEY, JSON.stringify({ version: 1, draft: this.draft, records: this.records }));
      this.error = ''; return true;
    } catch { this.error = 'This browser could not save changes. Keep this tab open; your current answers remain in memory.'; return false; }
  }
  complete() {
    if (!this.draft) return null;
    const record = structuredClone(this.draft);
    record.status = 'complete'; record.completedAt = new Date().toISOString(); record.step = 7;
    this.records = [...this.records.filter(r => r.checkInId !== record.checkInId), record];
    this.draft = null; this.persist(); return record;
  }
  clear() {
    this.draft = null; this.records = []; this.mode = 'session';
    try { this.storage?.removeItem(STORE_KEY); this.error = ''; this.blocked = false; }
    catch { this.error = 'Browser deletion failed. Clear this site’s data in browser settings before leaving a shared device.'; }
  }
}
export function toggleChoice(values, choice, exclusive = null) {
  if (values.includes(choice)) return values.filter(v => v !== choice);
  if (choice === exclusive) return [choice];
  return [...values.filter(v => v !== exclusive), choice];
}

