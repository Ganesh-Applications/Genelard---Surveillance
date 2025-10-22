import { SerialPort } from "serialport";
import { ReadlineParser } from "@serialport/parser-readline";

export default class ESPHandler
{
        constructor(name, portPath, onSensorUpdate)
        {
                this.name = name;
                
                //-- Connexion série
                this.port = new SerialPort(
                        {
                                path: portPath,
                                baudRate: 115200
                        });
                
                this.parser = this.port.pipe(new ReadlineParser({ delimiter: "\r\n" }));
                
                this.port.on("open", () =>
                {
                        console.log(`[${this.name}] Port ouvert : ${portPath}`);
                });
                
                this.port.on("error", (err) =>
                {
                        console.error(`[${this.name}] Erreur série:`, err.message);
                });
                
                // -- Réception des données
                this.parser.on("data", (data) =>
                {
                        this.handleData(data);
                });
                
                this.init();
        }
        
        init()
        {
                // to be implemented in subclass
        }
        
        updateData(json)
        {
                // to be implemented in subclass
        }
        
        //--- Gestion de la réception ---
        handleData(data)
        {
                let json = null;
                
                try
                {
                        json = JSON.parse(data);
                }
                catch (e)
                {
                        //console.log(`[${this.name}] Non-JSON:`, data);
                        // console.log(`[${this.name}] :`, data);
                }
                
                if (json != null)
                        this.updateData(json);
        }
        
        //--- Envoi de commande JSON ---
        sendCommand(cmd, value)
        {
                const msg = JSON.stringify({ cmd, value });
                this.port.write(msg + "\n", (err) =>
                {
                        if (err)
                                return console.error(`[${this.name}] Erreur écriture:`, err.message);
                });
                //console.log(`[${this.name}] →`, msg);
        }
}