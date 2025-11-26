#include <Arduino.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <HardwareSerial.h>

// Broches utilisées pour l’UART
#define RX_PIN 20   // ESP32 reçoit ici (TX du FM-503)
#define TX_PIN 21  // ESP32 transmet ici (RX du FM-503)

#define IR_SENSOR_FRONT 0 // Sharp IR GP2Y0A41SK0F Sensor
#define IR_SENSOR_BACK 1 // Sharp IR GP2Y0A41SK0F Sensor

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
    //-- (Conditions court-circuitée pour avoir les print en continu)
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

    lastStatus =  millis();
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
  float newFrontSensorValue = getDistance(IR_SENSOR_FRONT);
  float newBackSensorValue = getDistance(IR_SENSOR_BACK);


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
 * Retourne la distance mesur�e par un GP2Y0A41SK0F (cm)
 * Retourne -1 si aucune mesure valide
 */
float getDistance(int sensorPin)
{
  float volts = analogRead(sensorPin) * 0.0008056640625; // value from sensor * (3.3/4096)
  float sensorValue = 29.988 * pow( volts, -1.173);

  return sensorValue;
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
  // if (rfidData.length() > 0)
  // {
  //   Serial.print("Réponse du lecteur : ");
  //   Serial.println(rfidData);
  // }
  // else
  // {
  //   //Serial.println("Aucune donnée reçue ou timeout.");
  // }
  
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