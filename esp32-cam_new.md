#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>

// ===== WIFI =====
const char* ssid = "domek";        // Váš názov WiFi siete (SSID)
const char* password = "domecek123"; // Vaše heslo k WiFi sieti

// ===== BACKEND API (VEREJNÝ SERVER) =====
const char* backendUrl = "http://34.118.57.6:3000/api/check-reservation";

// ===== AI THINKER ESP32-CAM PINY =====
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// ===== FUNKCIA: ODOSLANIE FOTKY NA BACKEND =====
// Prijíma ukazovateľ na frame buffer kamery
void sendPhotoToBackend(camera_fb_t *fb) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi nie je pripojené, POST preskočené.");
    return;
  }

  HTTPClient http;
  http.begin(backendUrl);
  http.addHeader("Content-Type", "image/jpeg"); // Dôležité: Označenie typu obsahu ako JPEG

  // Odoslanie dát obrázka priamo v tele POST požiadavky
  int httpCode = http.POST(fb->buf, fb->len);

  Serial.print("POST na backend, HTTP kód: ");
  Serial.println(httpCode);

  if (httpCode > 0) {
    String payload = http.getString();
    Serial.println("Odpoveď servera:");
    Serial.println(payload);
  } else {
    Serial.printf("POST na backend zlyhal, chyba: %s\n", http.errorToString(httpCode).c_str());
  }

  http.end(); // Ukončí HTTP pripojenie
}

void setup() {
  Serial.begin(115200);
  Serial.println("\nSpúšťam ESP32-CAM (Automatické odosielanie fotiek)...");

  // ===== CAMERA INIT =====
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // Stabilné nastavenia kamery
  config.frame_size = FRAMESIZE_SVGA; // SVGA (800x600) pre lepšie rozpoznávanie
  config.jpeg_quality = 10;           // Kvalita JPEG (0-63, nižšie číslo = vyššia kvalita)
  config.fb_count = 1;

  if (esp_camera_init(&config) != ESP_OK) {
    Serial.println("Inicializácia kamery zlyhala!");
    return;
  }
  Serial.println("Kamera inicializovaná OK.");

  // Nastavenie vlastností kamery
  sensor_t * s = esp_camera_sensor_get();
  s->set_vflip(s, 1);    // Vertikálne preklopenie obrazu (0 - vypnuté, 1 - zapnuté)
  s->set_hmirror(s, 1);  // Horizontálne zrkadlenie obrazu (0 - vypnuté, 1 - zapnuté)


  // ===== WIFI =====
  WiFi.begin(ssid, password);
  Serial.print("Pripájam sa k WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi pripojené.");
  Serial.print("ESP32-CAM IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  delay(5000); // Počkaj 5 sekúnd pred ďalším cyklom (simulácia intervalu snímania)

  Serial.println("Snímam fotografiu...");
  camera_fb_t *fb = esp_camera_fb_get(); // Získanie frame buffera
  if (!fb) {
    Serial.println("Snímanie fotografie zlyhalo!");
    return;
  }
  Serial.printf("Fotografia nasnímaná, veľkosť: %zu bajtov\n", fb->len);

  // Odoslanie nasnímanej fotografie na backend
  sendPhotoToBackend(fb);

  esp_camera_fb_return(fb); // Uvoľnenie frame buffera pre ďalšie použitie
}
