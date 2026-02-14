# Prehľad Projektu

Toto je full-stack JavaScript aplikácia pre systém správy parkovania, ktorá obsahuje backend v Node.js a frontend s vanillou JavaScriptom, HTML a Tailwind CSS.

## Backend

Backend je Node.js aplikácia postavená na Express.js.

-   **API:** Poskytuje REST API pre správu parkovacích miest, spracovanie rezervácií, spracovanie nahrávaných obrázkov z ESP32 kamery pre rozpoznávanie ŠPZ a ovládanie fyzickej parkovacej závory.
-   **Databáza:** Používa SQLite pre ukladanie dát. Schéma je definovaná v `database.js`.
-   **OCR:** Integruje `tesseract.js` pre optické rozpoznávanie znakov (OCR) na čítanie ŠPZ z obrázkov. Logika je primárne v `backend/services/ocrService.js`.
-   **Integrácia Hardvéru:** Komunikuje s mikrokontrolérom ESP32 na ovládanie parkovacej závory. Príkazy sa posielajú cez `GET /api/barrier/command`.
-   **Nahrávanie obrázkov:** Používa `multer` na spracovanie nahrávaných obrázkov z ESP32 kamery, ktoré sa ukladajú do adresára `backend/uploads`.
-   **Emailová služba:** Používa `nodemailer` na odosielanie potvrdzovacích emailov o rezervácii.

## Frontend

Frontend je statická webová stránka umiestnená v adresári `docs`.

-   **Technológia:** Vyvinutá s HTML, vanillou JavaScriptom a štylizovaná pomocou Tailwind CSS.
-   **Funkcionalita:** Umožňuje používateľom prezerať dostupné parkovacie miesta na interaktívnej mape, vybrať si miesto a pokračovať v rezervácii. Zahŕňa validáciu formulára na strane klienta, výpočet ceny v reálnom čase a komunikuje s backend API na načítanie údajov o miestach a odosielanie podrobností o rezervácii.
-   **Používateľské rozhranie:** Obsahuje dynamické zobrazenie parkovacích miest, rezervačný formulár s poľami pre kontakt, platbu a trvanie rezervácie a prepínač témy pre svetlý/tmavý režim.

# Vytváranie a Spúšťanie

## Backend

1.  Prejdite do adresára `backend`:
    ```bash
    cd backend
    ```
2.  Nainštalujte závislosti:
    ```bash
    npm install
    ```
3.  Spustite server:
    ```bash
    npm start
    ```
    Server pobeží na adrese `http://localhost:3000`.

## Frontend

Otvorte súbor `docs/index.html` vo webovom prehliadači. Pre frontend nie je potrebný žiadny špecifický krok kompilácie.

# Vývojové Konvencie

-   **Backend:** Kód backendu je štruktúrovaný tak, že `server.js` spracováva API cesty a integruje rôzne služby (napr. `ocrService.js`, `emailService.js`). Dodržiava modulový systém CommonJS (`require`/`module.exports`).
-   **Frontend:** JavaScript frontend (`docs/js/main.js`) používa funkcionálny štýl, zameraný na manipuláciu s DOM, spracovanie udalostí a priamu komunikáciu s backend API. Zahŕňa validáciu na strane klienta a dynamické aktualizácie používateľského rozhrania.
-   **API:** API je RESTful, s koncovými bodmi ako `GET /api/slots`, `POST /api/bookings` a špecifickými koncovými bodmi pre hardvérovú integráciu (`GET /api/barrier/command`) a spracovanie obrázkov OCR (`POST /api/check-reservation`).
-   **Štýlovanie:** Štýlovanie frontendu je riadené pomocou Tailwind CSS, konfigurovaného priamo v `docs/index.html` a doplneného súborom `docs/css/main.css`.
-   **Jazyk:** Komentáre kódu, správy pre používateľa a názvy premenných (kde je to vhodné) v codebase sú prevažne v slovenčine.
-   **Testovanie:** Na testovanie backendu sa používa Jest, ako naznačujú skripty v `package.json`. Príkladový testovací súbor je `backend/tests/api.test.js`.
