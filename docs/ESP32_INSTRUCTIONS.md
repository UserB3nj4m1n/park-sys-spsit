# Inštrukcie pre ESP32 Server

Tento dokument popisuje, ako nastaviť ESP32 server na komunikáciu s parkovacím systémom.

## 1. Posielanie Obrázku na Backend

Vaša ESP32 kamera musí poslať obrázok ŠPZ na backend server pre overenie rezervácie.

**Endpoint:** `POST http://<IP_ADRESA_BACKENDU>:3000/api/check-reservation`

- Nahraďte `<IP_ADRESA_BACKENDU>` s IP adresou počítača, na ktorom beží backend server.
- Request musí byť typu `multipart/form-data`.
- Obrázok musí byť v poli (field) s názvom `image`.

**Príklad (curl):**
```bash
curl -X POST -F "image=@/cesta/k/obrazku.jpg" http://192.168.1.100:3000/api/check-reservation
```

### Očakávané Odpovede od Backendu

- **200 OK (Rezervácia nájdená):**
  ```json
  {
    "message": "Rezervácia nájdená. Rampa sa otvára."
  }
  ```
- **404 Not Found (Rezervácia nenájdená):**
  ```json
  {
    "message": "Žiadna rezervácia pre túto ŠPZ na dnes nebola nájdená."
  }
  ```
- **400 Bad Request (Chyba v požiadavke):**
  ```json
  {
    "message": "Žiadny obrázok nebol nahraný." 
  }
  ```
  alebo
  ```json
  {
    "message": "Nepodarilo sa rozpoznať ŠPZ."
  }
  ```

## 2. Prijímanie Príkazu na Otvorenie Rampy

Backend po úspešnom overení rezervácie pošle HTTP GET request na vašu ESP32 pre otvorenie rampy. Vaša ESP32 preto musí hosťovať jednoduchý webový server.

**Endpoint na ESP32:** `GET http://<IP_ADRESA_ESP32>/open-barrier`
- Backend zavolá tento endpoint na vašej ESP32.
- Nahraďte `<IP_ADRESA_ESP32>` s IP adresou, ktorú má vaša ESP32. Túto IP adresu musíte nastaviť v backend súbore `backend/services/esp32Service.js`.

### Príklad Kódu pre ESP32 (Arduino)

Tu je jednoduchý príklad, ako môžete na ESP32 vytvoriť webový server a čakať na príkaz.

```cpp
#include <WiFi.h>
#include <WebServer.h>

// --- NASTAVENIA ---
const char* ssid = "NAZOV_VASEJ_WIFI";
const char* password = "HESLO_K_VASEJ_WIFI";
const int RAMP_PIN = 4; // GPIO pin, na ktorom je ovládaná rampa

WebServer server(80);

void handleOpenBarrier() {
  server.send(200, "text/plain", "Rampa sa otvara...");
  
  // Tu pridajte kód na fyzické otvorenie rampy
  digitalWrite(RAMP_PIN, HIGH);
  delay(1000); // Počká sekundu
  digitalWrite(RAMP_PIN, LOW); 
  
  Serial.println("Prikaz na otvorenie rampy prijaty.");
}

void setup() {
  Serial.begin(115200);
  pinMode(RAMP_PIN, OUTPUT);
  digitalWrite(RAMP_PIN, LOW);

  // Pripojenie k WiFi
  WiFi.begin(ssid, password);
  Serial.print("Pripajam sa k WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nPripojene!");
  Serial.print("IP Adresa: ");
  Serial.println(WiFi.localIP()); // Zobrazí IP adresu ESP32

  // Definovanie endpointu
  server.on("/open-barrier", HTTP_GET, handleOpenBarrier);

  // Spustenie servera
  server.begin();
  Serial.println("HTTP server spusteny.");
}

void loop() {
  server.handleClient();
}
```

## 3. Konfigurácia IP Adries

Je dôležité správne nastaviť IP adresy na oboch stranách.

1.  **V `backend/services/esp32Service.js`:**
    -   Otvorte súbor `backend/services/esp32Service.js`.
    -   Nájdite konštantu `BARRIER_ESP32_IP`.
    -   Zmeňte hodnotu `const BARRIER_ESP32_IP = '192.168.1.101';` na IP adresu vašej ESP32.

2.  **V kóde pre ESP32:**
    -   Zistite IP adresu počítača, na ktorom beží backend.
    -   Túto IP adresu použite pri posielaní POST requestu na `http://<IP_ADRESA_BACKENDU>:3000/api/check-reservation`.

Dúfam, že tieto inštrukcie pomôžu! Ak máte ďalšie otázky, dajte vedieť.
