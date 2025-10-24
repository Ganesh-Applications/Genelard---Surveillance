#include <FastLED.h>
#include <ArduinoJson.h>
//#include <SPI.h>

#define LED_PIN 1
#define NUM_LEDS 40
#define BRIGHTNESS 255
#define LED_TYPE WS2812B
#define COLOR_ORDER GRB

struct RGBA {l
  uint8_t r, g, b, a;
};

RGBA ledValues[NUM_LEDS];
CRGB leds[NUM_LEDS];

String inputString = "";

void setup()
{
    Serial.begin(115200);

    FastLED.addLeds<LED_TYPE, LED_PIN, COLOR_ORDER>(leds, NUM_LEDS);
    FastLED.setBrightness(BRIGHTNESS);
}

void loop()
{
    if (Serial.available())
    {
        // Lit la ligne JSON complète
        String jsonString = Serial.readStringUntil('\n');

        if (jsonString.length() == 0)
            return;

        execCommand(jsonString);
    }

    //delay(100);
}

/**
 * Traite une commande JSON reçue du Raspberry Pi
 * Exemple attendu : {"cmd":"led","value":1}
 */
void execCommand(String jsonString)
{
    // Taille du buffer JSON (à ajuster selon le nombre de LED)
    StaticJsonDocument<4096> doc;

    DeserializationError error = deserializeJson(doc, jsonString);

    if (error)
    {
        Serial.print("Erreur JSON: ");
        Serial.println(error.c_str());
        Serial.println(jsonString);
        return;
    }

    const char* cmd = doc["cmd"];

    if (!cmd)
        return;

    if (strcmp(cmd, "led") == 0)
        updateLEDs(doc);
}

void updateLEDs(JsonDocument doc)
{
    //Serial.println("updateLEDs");

    //fill_solid(leds, NUM_LEDS, CRGB::Black);

    for (int i = 0; i < NUM_LEDS; i++)
    {
        uint32_t color = doc["value"][i];  // 0xRRGGBBAA
        uint8_t r = (color >> 24) & 0xFF;
        uint8_t g = (color >> 16) & 0xFF;
        uint8_t b = (color >> 8) & 0xFF;
        uint8_t a = color & 0xFF;

        /*Serial.print("Color : ");
        Serial.print(color);
        Serial.print(" - R : ");
        Serial.print(r);
        Serial.print(", G : ");
        Serial.print(g);
        Serial.print(", B : ");
        Serial.print(b);
        Serial.print(", A : ");
        Serial.print(a);
        Serial.println();*/

        leds[i] = CRGB(
            (r * a) >> 8,
            (g * a) >> 8,
            (b * a) >> 8
        );
    }

    //fadeToBlackBy(leds, NUM_LEDS, 60);

    //fill_solid(leds+ledPos, 1, CRGB::Red4);

    //float brightness = 127f;
    //fadeToBlackBy(&leds[20], 1, 255-brightness);

    FastLED.show();
}
