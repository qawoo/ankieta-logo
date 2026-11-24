const KODY = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2'];
const MARKI = { A: 'Skoda', B: 'Kia', C: 'Renault', D: 'Peugeot' };
const WERSJE = { '1': 'wczesniejsza', '2': 'nowsza' };
const ODPOWIEDZI_Q9 = ['tak', 'nie', 'nie_pamietam'];
const NAGLOWKI = [
  'czas_wyslania', 'id_odpowiedzi', 'kod_wersji', 'marka', 'wersja',
  'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9',
  'czas_wypelniania_s', 'urzadzenie', 'losowanie_awaryjne', 'pilot',
];

function doGet(e) {
  const akcja = e && e.parameter ? e.parameter.action : null;
  if (akcja === 'assign') {
    return odpowiedzJson({ kod: przydzielKod() });
  }
  return odpowiedzJson({ ok: false, blad: 'Nieznana akcja' });
}

function doPost(e) {
  let dane;
  try {
    dane = JSON.parse(e.postData.contents);
  } catch (err) {
    return odpowiedzJson({ ok: false, blad: 'Niepoprawny JSON' });
  }

  const blad = sprawdzDane(dane);
  if (blad) {
    return odpowiedzJson({ ok: false, blad: blad });
  }

  const blokada = LockService.getScriptLock();
  blokada.waitLock(20000);
  try {
    const arkusz = pobierzArkusz();
    if (czyJuzZapisano(arkusz, dane.id_odpowiedzi)) {
      return odpowiedzJson({ ok: true, duplikat: true });
    }
    arkusz.appendRow(zbudujWiersz(dane));
    return odpowiedzJson({ ok: true });
  } finally {
    blokada.releaseLock();
  }
}

function przydzielKod() {
  const blokada = LockService.getScriptLock();
  blokada.waitLock(20000);
  try {
    const wlasciwosci = PropertiesService.getScriptProperties();
    let lista = JSON.parse(wlasciwosci.getProperty('lista') || '[]');
    let indeks = Number(wlasciwosci.getProperty('indeks') || 0);
    if (lista.length !== KODY.length || indeks >= lista.length) {
      lista = potasuj(KODY.slice());
      indeks = 0;
    }
    const kod = lista[indeks];
    wlasciwosci.setProperties({ lista: JSON.stringify(lista), indeks: String(indeks + 1) });
    return kod;
  } finally {
    blokada.releaseLock();
  }
}

function potasuj(tablica) {
  for (let i = tablica.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = tablica[i];
    tablica[i] = tablica[j];
    tablica[j] = tmp;
  }
  return tablica;
}

function sprawdzDane(d) {
  if (!d || typeof d !== 'object') return 'Brak danych';
  if (typeof d.id_odpowiedzi !== 'string' || !/^[0-9a-f-]{36}$/i.test(d.id_odpowiedzi)) return 'Niepoprawne id_odpowiedzi';
  if (KODY.indexOf(d.kod_wersji) === -1) return 'Niepoprawny kod_wersji';
  for (let i = 1; i <= 7; i++) {
    if (!czyLiczbaZZakresu(d['q' + i], 1, 5)) return 'Niepoprawne q' + i;
  }
  if (!czyLiczbaZZakresu(d.q8, 1, 3)) return 'Niepoprawne q8';
  if (ODPOWIEDZI_Q9.indexOf(d.q9) === -1) return 'Niepoprawne q9';
  if (!czyLiczbaZZakresu(d.czas_wypelniania_s, 0, 86400)) return 'Niepoprawny czas_wypelniania_s';
  if (d.urzadzenie !== 'mobile' && d.urzadzenie !== 'desktop') return 'Niepoprawne urzadzenie';
  if (d.losowanie_awaryjne !== 0 && d.losowanie_awaryjne !== 1) return 'Niepoprawne losowanie_awaryjne';
  if (d.pilot !== 0 && d.pilot !== 1) return 'Niepoprawny pilot';
  return null;
}

function czyLiczbaZZakresu(x, min, max) {
  return typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;
}

function pobierzArkusz() {
  const arkusz = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (arkusz.getLastRow() === 0) {
    arkusz.appendRow(NAGLOWKI);
    arkusz.setFrozenRows(1);
  }
  return arkusz;
}

function czyJuzZapisano(arkusz, id) {
  const ostatni = arkusz.getLastRow();
  if (ostatni < 2) return false;
  const kolumnaId = NAGLOWKI.indexOf('id_odpowiedzi') + 1;
  return arkusz.getRange(2, kolumnaId, ostatni - 1, 1)
    .createTextFinder(id).matchEntireCell(true).findNext() !== null;
}

function zbudujWiersz(d) {
  const pelne = Object.assign({}, d, {
    czas_wyslania: new Date(),
    marka: MARKI[d.kod_wersji[0]],
    wersja: WERSJE[d.kod_wersji[1]],
  });
  return NAGLOWKI.map(function (kolumna) { return pelne[kolumna]; });
}

function odpowiedzJson(obiekt) {
  return ContentService.createTextOutput(JSON.stringify(obiekt))
    .setMimeType(ContentService.MimeType.JSON);
}

function resetujLicznik() {
  const wlasciwosci = PropertiesService.getScriptProperties();
  wlasciwosci.deleteProperty('lista');
  wlasciwosci.deleteProperty('indeks');
  Logger.log('Licznik losowania wyzerowany.');
}

function test() {
  Logger.log('Przydział: ' + doGet({ parameter: { action: 'assign' } }).getContent());
  const przyklad = {
    id_odpowiedzi: Utilities.getUuid(),
    kod_wersji: 'A1',
    q1: 3, q2: 4, q3: 5, q4: 2, q5: 1, q6: 3, q7: 4, q8: 2, q9: 'nie_pamietam',
    czas_wypelniania_s: 95,
    urzadzenie: 'desktop',
    losowanie_awaryjne: 0,
    pilot: 1,
  };
  const zdarzenie = { postData: { contents: JSON.stringify(przyklad) } };
  Logger.log('Zapis: ' + doPost(zdarzenie).getContent());
  Logger.log('Ponowny zapis (duplikat): ' + doPost(zdarzenie).getContent());
  Logger.log('Niepoprawne dane: ' + doPost({ postData: { contents: JSON.stringify(Object.assign({}, przyklad, { q1: 9 })) } }).getContent());
}
