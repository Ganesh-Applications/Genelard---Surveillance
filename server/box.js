import ESPHandler from "./esp-handler.js";

const HISTORY_LENGTH = 11;

export default class Box extends ESPHandler
{       
        init()
        {
                this.frontSensor = {
                        name: "front",
                        currentValue: 0,
                        history: [],
                        idleMin: 80,
                        idleMax: 200,
                        inside: false
                }
                this.backSensor = {
                        name: "back",
                        currentValue: 0,
                        history: [],
                        idleMin: 80,
                        idleMax: 200,
                        inside: false
                }
                
                this.objectInside = false;
                
                this.handInside = false;
                
                this.eventListener = null;
        }
        
        updateData(json)
        {
                //console.log('updateData', json);
            
                // if (json.front_sensor_value !== this.frontSensor.currentValue)
                this.determineHandPresence(this.frontSensor, json.front_sensor_value);
                
                // if (json.back_sensor_value !== this.backSensor.currentValue)
                this.determineHandPresence(this.backSensor, json.back_sensor_value);
            
                this.handInside = this.frontSensor.inside || this.backSensor.inside;
                
                let rfidSensorValue = json.rfid_sensor_value.trim();
                
                if (rfidSensorValue == 'Q')
                        this.updateRfid(false);
                else if (rfidSensorValue !== this.objectInside)
                        this.updateRfid(rfidSensorValue);
                
                if (this.eventListener != null)
                        this.eventListener.onBoxUpdate();
                    
                this.io.emit('box_update_data', {
                    id: this.id,
                    data: json
                });
        }
        
        determineHandPresence(sensor, newValue)
        {
                sensor.currentValue = newValue;
                
                this.updateSensorHistory(sensor);
                
                let numUnderMin = 0;
                let numOverMax = 0;
                
                for (let i = 0; i < sensor.history.length; i++)
                {
                        if (sensor.history[i] < sensor.idleMin)
                                numUnderMin++;
                        if (sensor.history[i] > sensor.idleMax)
                                numOverMax++;
                }
                
                //-- Si plus de deux valeurs enregistrées sont en dehors de la plage idle, on considère qu’une main est présente
                let inside = numUnderMin > 2 || numOverMax > 2;
                
                if (inside)
                {
                    numUnderMin = 0;
                    numOverMax = 0;
                }
                
                //if (inside != sensor.inside)
                //console.log("Sensor ", sensor.name, sensor.history, "Num under min:", numUnderMin, "Num over max:", numOverMax, "Inside:", inside);
                
                sensor.inside = inside;
        }
        
        updateSensorHistory(sensor)
        {
                sensor.history.unshift(sensor.currentValue);
                
                //-- On supprime la valeur la plus ancienne si on dépasse la taille max
                if (sensor.history.length > HISTORY_LENGTH)
                        sensor.history.pop();
        }
        
        updateRfid(value)
        {
                this.objectInside = value;
                //console.log(this.id + ", RFID:", value);
        }
        
        // --- Commandes pratiques ---
        setLed(color)
        {
                this.sendCommand("led", {
                        R: color[0],
                        G: color[1],
                        B: color[2],
                });
        }
}