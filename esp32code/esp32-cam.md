#include "esp_camera.h"
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>

// ===== WIFI =====
const char* ssid = "domek";
const char* password = "domecek123";

// ===== BACKEND API (VEREJNÝ SERVER) =====
const char* backendUrl = "http://34.118.57.6:3000/api/check-reservation";

// ===== SERVER NA ESP32-CAM =====
WebServer server(80);

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
void sendPhotoToBackend(camera_fb_t fb) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, POST skipped");
    return;
  }

  HTTPClient http;
  http.begin(backendUrl);
  http.addHeader("Content-Type", "image/jpeg");

  int httpCode = http.POST(fb->buf, fb->len);

  Serial.print("POST to backend, HTTP code: ");
  Serial.println(httpCode);

  http.end();
}

// ===== CAPTURE ENDPOINT (/capture) =====
void handleCapture() {
  camera_fb_tfb = esp_camera_fb_get();
  if (!fb) {
    server.send(500, "text/plain", "Camera capture failed");
    return;
  }

  WiFiClient client = server.client();

  // HTTP odpoveď pre prehliadač
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: image/jpeg");
  client.print("Content-Length: ");
  client.println(fb->len);
  client.println("Connection: close");
  client.println();

  client.write(fb->buf, fb->len);

  // 🔥 NOVÉ: pošli fotku aj na backend
  sendPhotoToBackend(fb);

  esp_camera_fb_return(fb);
}

// ===== ROOT ENDPOINT =====
void handleRoot() {
  server.send(200, "text/plain", "ESP32-CAM bezi. Pouzi /capture");
}

void setup() {
  Serial.begin(115200);
  Serial.println("\nBOOT");

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

  // stabilné nastavenia
  config.frame_size = FRAMESIZE_QVGA;
  config.jpeg_quality = 12;
  config.fb_count = 1;

  if (esp_camera_init(&config) != ESP_OK) {
    Serial.println("Camera init FAILED");
    return;
  }

  Serial.println("Camera OK");

  // ===== WIFI =====
  WiFi.begin(ssid, password);
  Serial.print("WiFi connecting");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
  Serial.print("ESP32-CAM IP: ");
  Serial.println(WiFi.localIP());

  // ===== SERVER ROUTES =====
  server.on("/", handleRoot);
  server.on("/capture", handleCapture);
  server.begin();

  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
}