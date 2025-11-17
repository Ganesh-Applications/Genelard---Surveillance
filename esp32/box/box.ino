#include <Arduino.h>
#include <ArduinoJson.h>
#include <MFRC522.h>
#include <SPI.h>
#include <HardwareSerial.h>

// Broches utilisées pour l’UART
#define RX_PIN 5   // ESP32 reçoit ici (TX du FM-503)
#define TX_PIN 6   // ESP32 transmet ici (RX du FM-503)

//-- HC-SR04 Ultrasonic sensor
#define TRIG_FRONT 21   //-- HC-SR04 avant - Trig
#define ECHO_FRONT 20   //-- HC-SR04 avant - Echo

#define TRIG_BACK  0   //-- HC-SR04 arri�re - Trig
#define ECHO_BACK  1   //-- HC-SR04 arri�re - Echo

#define IR_SENSOR_FRONT 3 // Sharp IR GP2Y0A41SK0F Sensor

//-- Temps entre vérifications capteurs (en ms)
#define STATUS_DELAY 100  

#define RFID_POWER 10
//#define RFID_POWER 1 // pour le grand

String inputString = "";
unsigned long lastStatus = 0;
unsigned int currentDistanceSensor = 0;

//-- Variables capteurs (m�moire des derni�res valeurs envoy�es)
float frontSensorValue = -1;
float backSensorValue  = -1;
String rfidSensorValue     = "none";

bool valuesHaveChanged = false;


/**
 * Initialisation
 */
void setup()
{
  Serial.begin(115200);

  delay(1000);  // Attendre un peu pour la stabilité

  Serial1.begin(38400, SERIAL_8N1, RX_PIN, TX_PIN); // RX_PIN et TX_PIN à adapter selon ta configuration
  Serial.println("Attente de lecture du RFID...");
  delay(1000); // Attente pour que tout soit prêt

  pinMode(TRIG_FRONT, OUTPUT);
  pinMode(ECHO_FRONT, INPUT);

  pinMode(TRIG_BACK, OUTPUT);
  pinMode(ECHO_BACK, INPUT);

  setRfidPower(RFID_POWER);
}

/**
 * Boucle principale
 */
void loop()
{
  //-- Lire les commandes reçues caractère par caractère
  while (Serial.available())
  {
    char c = Serial.read();
    if (c == '\n')  
    {  
      execCommand(inputString);
      inputString = "";
    } 
    else 
    {
      inputString += c;
    }
  }

  //-- Vérifie l'état des capteurs toutes les STATUS_DELAY ms
  if (millis() - lastStatus > STATUS_DELAY) 
  {
    //-- Met à jour l'état des capteurs
    updateSensorsStatus();

    //-- Si il y a des changements dans les valeurs des capteurs (distance et rfid)
    if (true || valuesHaveChanged)
    {
        //-- Envoi JSON
        JsonDocument data;
        data["front_sensor_value"]   = frontSensorValue;
        data["back_sensor_value"]    = backSensorValue;

        /*if (frontSensorValue < 34 || frontSensorValue > 36)
            data["front_sensor"] = "MAIN DETECTEE";
        else
            data["front_sensor"] = "PAS DE MAIN...";

        if (backSensorValue < 35 || backSensorValue > 38)
            data["back_sensor"] = "MAIN DETECTEE";
        else
            data["back_sensor"] = "PAS DE MAIN...";*/

        data["rfid_sensor_value"]    = rfidSensorValue;

        serializeJson(data, Serial);
        Serial.println();

      valuesHaveChanged = false;
    }

    lastStatus =    millis();
  }
}

/**
 * Traite une commande JSON reçue du Raspberry Pi
 * Exemple attendu : {"cmd":"led","value":1}
 */
void execCommand(String line)
{
  JsonDocument data;
  DeserializationError error = deserializeJson(data, line);

  if (error) return;

  const char* cmd = data["cmd"];
  if (!cmd) return;

  if (strcmp(cmd, "led") == 0) 
  {
   // updateLED(data["value"]);
  }
}

void updateLED(JsonDocument color)
{
  /*analogWrite(LED_R_PIN, color["R"]);
  analogWrite(LED_G_PIN, color["G"]);
  analogWrite(LED_B_PIN, color["B"]);*/
}

void updateSensorsStatus()
{
  //-- Mesures actuelles
  String newrfidSensorValue = getrfidSensorValue();

    float voltsFront = analogRead(IR_SENSOR_FRONT) * 0.0008056640625; // value from sensor * (3.3/4096)
    int newFrontSensorValue = 29.988 * pow( voltsFront, -1.173);

    Serial.print("front sensor : "); Serial.print(newFrontSensorValue);
    //Serial.print(", back sensor : "); Serial.print(newBackSensorValue);
    Serial.println();/**/

/*
  //-- Alternance entre les deux capteur de distance
  float newFrontSensorValue = frontSensorValue;
  float newBackSensorValue = backSensorValue;

  if (currentDistanceSensor == 0)
  {
    newFrontSensorValue = getDistance(TRIG_FRONT, ECHO_FRONT);
    currentDistanceSensor = 1;
  }
  else
  {
    newBackSensorValue  = getDistance(TRIG_BACK, ECHO_BACK);    
    currentDistanceSensor = 0;
  }

  //-- Comparer avec anciennes valeurs
  if (newFrontSensorValue != frontSensorValue)
  {
    frontSensorValue = newFrontSensorValue;
    valuesHaveChanged = true;
  }

  if (newBackSensorValue != backSensorValue)
  {
    backSensorValue = newBackSensorValue;
    valuesHaveChanged = true;
  }*/

  if (newrfidSensorValue != rfidSensorValue)
  {
    rfidSensorValue = newrfidSensorValue;
    valuesHaveChanged = true;
  }
}

/**
 * Retourne la distance mesur�e par un HC-SR04 (cm)
 * Retourne -1 si aucune mesure valide
 */
float getDistance(int trigPin, int echoPin)
{
  digitalWrite(trigPin, LOW);
  delayMicroseconds(5);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);


  long duration = pulseIn(echoPin, HIGH); // timeout 30 ms
  //float distance = duration * 0.0343 / 2;
  float distance = duration /29 / 2;

  if (duration == 0) return -1;

  //-- Arrondi au 1/2 cm près
  distance = round(distance * 2.0) / 2.0;

  return distance;
}

/**
 * Retourne l�UID de la carte RFID si pr�sente, sinon "none"
 */
String getrfidSensorValue()
{
  // Envoi de la commande "Q\r\n" au lecteur
    Serial1.print("Q\r\n");
    
  // Attente de la réponse du lecteur RFID
  String rfidData = "";
  
  // Attendre que le lecteur renvoie des données (il faut peut-être ajuster ce délai)
  unsigned long startTime = millis();
  while (millis() - startTime < 100) {  // Attente de 2 secondes (ajuster si nécessaire)
    if (Serial1.available()) {
      char c = Serial1.read();  // Lire le caractère reçu
      rfidData += c;  // Ajouter à la chaîne
    }
  }

  // Affichage de la réponsedu lecteur RFID
  if (rfidData.length() > 0)
  {
    Serial.print("Réponse du lecteur : ");
    Serial.println(rfidData);
  }
  else
  {
    //Serial.println("Aucune donnée reçue ou timeout.");
  }
  
  return rfidData;
}

void setRfidPower(int power)
{
    // Sécurité : bornage de la valeur
    if (power < -2) power = -2;
    if (power > 25) power = 25;

    // Conversion en valeur mappée 0x00 à 0x1B
    byte mappedValue = power + 2;

    // Conversion en chaîne hexadécimale (2 caractères, majuscules)
    char hexStr[3];
    sprintf(hexStr, "%02X", mappedValue);

    // Construction de la commande complète
    String cmd = "N1,";
    cmd += hexStr;  // ajoute la valeur hex
    cmd += "\r\n";  // fin de commande (optionnel selon protocole)

    Serial.println("send ");
    Serial.println(cmd);

    // Envoi de la commande "Q\r\n" au lecteur
    Serial1.print(cmd);

}