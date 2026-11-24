// Uruchom: node test/test_losowania.js
// Ładuje apps-script/Code.gs z atrapami usług Google i sprawdza losowanie oraz zapis.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const kod = fs.readFileSync(path.join(__dirname, '..', 'apps-script', 'Code.gs'), 'utf8');

function utworzSrodowisko() {
  const wlasciwosci = {};
  const wiersze = [];
  const arkusz = {
    getLastRow: () => wiersze.length,
    appendRow: w => wiersze.push(w),
    setFrozenRows: () => {},
    getRange: (wiersz, kolumna, ile) => ({
      createTextFinder: tekst => ({
        matchEntireCell: () => ({
          findNext: () => wiersze.slice(wiersz - 1, wiersz - 1 + ile).some(w => w[kolumna - 1] === tekst) ? {} : null,
        }),
      }),
    }),
  };
  const kontekst = {
    Logger: { log: () => {} },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: k => (k in wlasciwosci ? wlasciwosci[k] : null),
        setProperties: o => Object.assign(wlasciwosci, o),
        deleteProperty: k => { delete wlasciwosci[k]; },
      }),
    },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheets: () => [arkusz] }) },
    ContentService: {
      MimeType: { JSON: 'json' },
      createTextOutput: t => ({ setMimeType: () => ({ getContent: () => t }) }),
    },
    Utilities: { getUuid: () => require('crypto').randomUUID() },
  };
  vm.createContext(kontekst);
  vm.runInContext(kod, kontekst);
  return { gs: kontekst, wiersze, wlasciwosci };
}

const { gs, wiersze, wlasciwosci } = utworzSrodowisko();
const przydzial = () => JSON.parse(gs.doGet({ parameter: { action: 'assign' } }).getContent()).kod;

const wyniki = Array.from({ length: 64 }, przydzial);
const liczniki = {};
for (const k of wyniki) liczniki[k] = (liczniki[k] || 0) + 1;

console.log('64 przydziały:');
for (let b = 0; b < 8; b++) console.log(`  blok ${b + 1}: ${wyniki.slice(b * 8, b * 8 + 8).join(' ')}`);
console.log('Liczba wystąpień:', liczniki);

const KODY = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];
for (const k of KODY) assert.strictEqual(liczniki[k], 8, `${k} wypadł ${liczniki[k]} razy`);
for (let b = 0; b < 8; b++) {
  assert.deepStrictEqual(wyniki.slice(b * 8, b * 8 + 8).sort(), KODY, `blok ${b + 1} nie jest permutacją`);
}
console.log('OK: każdy kod dokładnie 8 razy, każdy blok 8 to permutacja.');

przydzial(); przydzial(); przydzial();
gs.resetujLicznik();
assert.ok(!('lista' in wlasciwosci) && !('indeks' in wlasciwosci));
const poResecie = Array.from({ length: 8 }, przydzial).sort();
assert.deepStrictEqual([...poResecie], KODY);
console.log('OK: resetujLicznik() zaczyna nowy blok 8.');

const przyklad = {
  id_odpowiedzi: '123e4567-e89b-42d3-a456-426614174000', kod_wersji: 'C2',
  q1: 1, q2: 2, q3: 3, q4: 4, q5: 5, q6: 1, q7: 3, q8: 3, q9: 'nie_pamietam',
  czas_wypelniania_s: 80, urzadzenie: 'mobile', losowanie_awaryjne: 0, pilot: 0,
};
const post = d => JSON.parse(gs.doPost({ postData: { contents: JSON.stringify(d) } }).getContent());

assert.deepStrictEqual(post(przyklad), { ok: true });
assert.deepStrictEqual(post(przyklad), { ok: true, duplikat: true });
assert.strictEqual(wiersze.length, 2);
assert.deepStrictEqual([...wiersze[0]], [...vm.runInContext('NAGLOWKI', gs)]);
assert.strictEqual(wiersze[1][3], 'Renault');
assert.strictEqual(wiersze[1][4], 'nowsza');
assert.deepStrictEqual(JSON.parse(JSON.stringify(wiersze[1].slice(1))), [
  przyklad.id_odpowiedzi, 'C2', 'Renault', 'nowsza', 1, 2, 3, 4, 5, 1, 3, 3, 'nie_pamietam', 80, 'mobile', 0, 0,
]);
console.log('OK: zapis wiersza, nagłówki, marka/wersja, pomijanie duplikatu.');

const zle = [
  { kod_wersji: 'E1' }, { q1: 6 }, { q7: 0 }, { q3: '3' }, { q8: 4 }, { q9: 'moze' },
  { urzadzenie: 'tablet' }, { pilot: 2 }, { losowanie_awaryjne: true }, { id_odpowiedzi: 'x' },
  { czas_wypelniania_s: -1 },
];
for (const zmiana of zle) {
  const id = require('crypto').randomUUID();
  const r = post({ ...przyklad, id_odpowiedzi: id, ...zmiana });
  assert.strictEqual(r.ok, false, 'przepuszczono: ' + JSON.stringify(zmiana));
}
assert.strictEqual(JSON.parse(gs.doPost({ postData: { contents: 'nie json' } }).getContent()).ok, false);
assert.strictEqual(wiersze.length, 2);
console.log(`OK: odrzucono ${zle.length + 1} niepoprawnych zgłoszeń.`);
