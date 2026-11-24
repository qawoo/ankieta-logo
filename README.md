# Ankieta: pierwsze wrażenie o marce

Prosta ankieta internetowa do eksperymentu: każdy uczestnik widzi jedno z 8 logo (4 marki × wcześniejsza/nowsza wersja), ocenia je i odpowiada na dwa pytania o znajomość marki. Odpowiedzi trafiają do Arkusza Google.

## Pliki

| Plik | Co zawiera |
|---|---|
| `index.html` | Cała ankieta (HTML + CSS + JS). Tu wklejasz adres skryptu Google. |
| `img/` | Logo `A1.png` … `D2.png` (A = Škoda, B = Kia, C = Renault, D = Peugeot; 1 = wcześniejsza, 2 = nowsza). |
| `apps-script/Code.gs` | Kod Google Apps Script: losowanie wersji logo i zapis odpowiedzi do arkusza. |
| `test/test_losowania.js` | Test w Node: 64 przydziały → każdy kod dokładnie 8 razy; sprawdza też zapis i walidację. |

---

## Krok 1. Arkusz Google i skrypt

1. Wejdź na <https://sheets.google.com> i utwórz **pusty arkusz**. Nazwij go np. „Ankieta logo – wyniki”. Nic w nim nie wpisuj – nagłówki utworzy skrypt.
2. W arkuszu wybierz **Rozszerzenia → Apps Script**. Otworzy się edytor skryptu.
3. Usuń wszystko z pliku `Kod.gs` (lub `Code.gs`) i wklej całą zawartość pliku `apps-script/Code.gs` z tego repozytorium.
4. Kliknij ikonę dyskietki (**Zapisz**).
5. Na górze edytora, z listy funkcji wybierz **`test`** i kliknij **Uruchom**.
   - Za pierwszym razem Google poprosi o uprawnienia: **Przejrzyj uprawnienia** → wybierz swoje konto → jeśli pojawi się „Google nie zweryfikował tej aplikacji”, kliknij **Zaawansowane** → **Przejdź do projektu (niebezpieczne)** → **Zezwól**. To normalne dla własnych skryptów.
6. Na dole w **Dzienniku wykonania** powinno być widać m.in. `Zapis: {"ok":true}`, `Ponowny zapis (duplikat): {"ok":true,"duplikat":true}` i `Niepoprawne dane: {"ok":false,...}`.
7. Wróć do arkusza: powinien mieć wiersz nagłówków i **jeden** wiersz testowy (`pilot = 1`). Usuń ten wiersz testowy (cały wiersz 2, nagłówki zostaw).
8. W edytorze skryptu wybierz funkcję **`resetujLicznik`** i kliknij **Uruchom** (test zużył jedno miejsce w losowaniu – to je zeruje).

## Krok 2. Wdrożenie skryptu jako aplikacji internetowej

1. W edytorze Apps Script kliknij **Wdróż → Nowe wdrożenie** (*Deploy → New deployment*).
2. Kliknij ikonę koła zębatego obok „Wybierz typ” i wybierz **Aplikacja internetowa** (*Web app*).
3. Ustaw:
   - **Opis:** dowolny, np. „v1”,
   - **Wykonaj jako:** **Ja** (*Execute as: Me*),
   - **Kto ma dostęp:** **Każdy** (*Who has access: Anyone*) – nie „Każdy z kontem Google”.
4. Kliknij **Wdróż** i ewentualnie ponownie zezwól na uprawnienia.
5. Skopiuj **URL aplikacji internetowej** – kończy się na `/exec`.
6. Sprawdź go: wklej do przeglądarki adres z dopiskiem `?action=assign`, np.
   `https://script.google.com/macros/s/XXXX/exec?action=assign`
   Powinno się pokazać coś w rodzaju `{"kod":"C2"}`. (To też zużywa miejsce w losowaniu – wyzerujesz je po pilotażu.)

> **Ważne:** jeśli kiedyś zmienisz kod w `Code.gs`, samo zapisanie nie wystarczy. Wejdź w **Wdróż → Zarządzaj wdrożeniami → ołówek (Edytuj) → Wersja: Nowa wersja → Wdróż**. Adres URL się nie zmieni.

## Krok 3. Wklej adres do `index.html`

Otwórz `index.html` w dowolnym edytorze tekstu (np. Notatnik, VS Code) i znajdź na początku skryptu linię:

```js
const URL_SKRYPTU = 'WKLEJ_TUTAJ_URL_APLIKACJI_INTERNETOWEJ';
```

Zamień tekst w apostrofach na swój adres `/exec`, np.:

```js
const URL_SKRYPTU = 'https://script.google.com/macros/s/XXXX/exec';
```

Zapisz plik.

## Krok 4. Publikacja na GitHub Pages

Najprościej przez stronę GitHuba (bez instalowania czegokolwiek):

1. Zaloguj się na <https://github.com> i kliknij **New repository** (zielony przycisk / „+” w prawym górnym rogu).
2. Nazwa np. `ankieta-logo`, widoczność **Public** (darmowe GitHub Pages działa dla publicznych repozytoriów), kliknij **Create repository**.
3. Na stronie nowego repozytorium kliknij **uploading an existing file** (albo **Add file → Upload files**) i przeciągnij: `index.html`, folder `img`, folder `apps-script`, folder `test`, `README.md`. Kliknij **Commit changes**.
   - Sprawdź, że obrazki są w repozytorium w folderze `img/` (np. `img/A1.png`), a nie luzem.
4. Wejdź w **Settings → Pages**. W sekcji **Build and deployment** ustaw **Source: Deploy from a branch**, **Branch: main**, folder **/(root)** → **Save**.
5. Po 1–2 minutach na tej samej stronie pojawi się adres, np. `https://twoja-nazwa.github.io/ankieta-logo/`. To jest link do ankiety.

Jeśli później zmienisz `index.html`, wgraj go ponownie (**Add file → Upload files**, nadpisze stary). Strona odświeży się po minucie–dwóch.

> Kod frontendu (łącznie z adresem skryptu) jest publiczny – to normalne. Skrypt i tak przyjmuje tylko poprawne odpowiedzi i nie pozwala niczego odczytać z arkusza.

## Krok 5. Test lokalny (opcjonalnie, bez backendu)

W folderze z plikami uruchom prosty serwer, np. w PowerShell:

```powershell
python -m http.server 8000
```

i otwórz w przeglądarce:

- `http://localhost:8000/?mock=1` – cały przebieg bez backendu (losowanie lokalne, „zapis” tylko w konsoli przeglądarki, F12 → Console),
- `http://localhost:8000/?mock=1&kod=B1` – wymuszenie konkretnego logo (tak obejrzysz wszystkie 8: `A1` … `D2`).

W trybie `mock` blokada ponownego wypełnienia nie działa, więc możesz testować wielokrotnie. Widok telefonu: F12 → ikona telefonu (Toggle device toolbar).

Test losowania (wymaga Node.js):

```powershell
node test/test_losowania.js
```

## Krok 6. Pilotaż

1. Wyślij kilku osobom link z dopiskiem `?pilot=1`, np.
   `https://twoja-nazwa.github.io/ankieta-logo/?pilot=1`
   - Ankieta działa normalnie i zapisuje do arkusza, ale wiersze mają `pilot = 1`.
   - Nie ma blokady ponownego wypełnienia, więc ta sama osoba może przejść ankietę kilka razy.
   - `?pilot=1&kod=D2` wymusza konkretne logo (wtedy przydział nie zużywa miejsca w losowaniu).
2. Sprawdź w arkuszu, czy wiersze wyglądają dobrze.

## Krok 7. Po pilotażu: zerowanie licznika

Pilotaż „zużył” miejsca w blokach losowania. Przed badaniem właściwym:

1. W edytorze Apps Script wybierz funkcję **`resetujLicznik`** → **Uruchom**. Losowanie zacznie od nowego, pełnego bloku 8.
2. Wiersze z `pilot = 1` możesz usunąć z arkusza albo zostawić i odfiltrować przy analizie.

## Krok 8. Badanie właściwe

Rozsyłaj link **bez żadnych dopisków**: `https://twoja-nazwa.github.io/ankieta-logo/`

---

## Jak działa losowanie

- Skrypt trzyma w pamięci skryptu (`PropertiesService`) potasowaną listę 8 kodów i numer kolejnego miejsca.
- Każdy uczestnik, który przejdzie warunki udziału (ekran 1), dostaje kolejny kod z listy. Po wydaniu 8 kodów skrypt tasuje nową ósemkę (algorytm Fisher–Yates).
- Całość jest pod blokadą (`LockService`), więc dwie osoby w tej samej chwili nie dostaną tego samego miejsca.
- Jeśli przydział się nie uda (brak sieci, błąd Google), strona losuje kod sama i zapisuje `losowanie_awaryjne = 1`.
- Uwaga: blok jest „zużywany” w momencie przydziału, nie wysłania. Osoby, które zamkną ankietę w trakcie, sprawią, że liczności grup w arkuszu będą trochę nierówne – to normalne.

## Kolumny w arkuszu

| Kolumna | Znaczenie |
|---|---|
| `czas_wyslania` | data i godzina zapisu (czas serwera Google) |
| `id_odpowiedzi` | losowy identyfikator z przeglądarki; skrypt pomija powtórzone id |
| `kod_wersji` | A1 … D2 |
| `marka` | Skoda / Kia / Renault / Peugeot |
| `wersja` | wczesniejsza / nowsza |
| `q1`–`q6` | stwierdzenia 1–6, skala 1–5 (1 = zdecydowanie się nie zgadzam … 5 = zdecydowanie się zgadzam) |
| `q7` | liczba szczegółów: 1 = bardzo mała … 5 = bardzo duża |
| `q8` | znajomość marki: 1 = nie znam, 2 = znam, nie korzystałem/am, 3 = korzystałem/am |
| `q9` | widział(a) dokładnie ten znak: `tak` / `nie` / `nie_pamietam` |
| `czas_wypelniania_s` | sekundy od wyświetlenia ekranu 2 do kliknięcia „Wyślij” |
| `urzadzenie` | `mobile` (szerokość ekranu < 768 px) lub `desktop` |
| `losowanie_awaryjne` | 1 = kod wylosowany w przeglądarce, bo przydział z serwera się nie udał |
| `pilot` | 1 = odpowiedź z linku `?pilot=1` |

## Rozwiązywanie problemów

- **Wszystkie odpowiedzi mają `losowanie_awaryjne = 1`** – w `index.html` jest zły lub niewklejony `URL_SKRYPTU`, albo wdrożenie nie ma dostępu „Każdy”.
- **Po kliknięciu „Wyślij” pojawia się „Nie udało się wysłać odpowiedzi”** – jak wyżej; sprawdź też, czy po zmianie `Code.gs` zrobiłeś/aś nową wersję wdrożenia (Krok 2, ramka „Ważne”).
- **Chcę wypełnić ankietę jeszcze raz na tym samym telefonie** – użyj linku z `?pilot=1` albo wyczyść dane strony w przeglądarce.
