import ESPHandler from "./esp-handler.js";
import {NUM_BOX, NUM_LEDS, NUM_LEDS_PER_BOX, PATROL_MODES} from "./constants.js";

export default class Leds extends ESPHandler
{
        init(name)
        {
                this.ledValues = [];
                
                this.flashValue = 0;
                this.flashInc = 0;
                this.flashSpeed = 0.25;
                this.maxFlashValue = 255;

                this.ledValues = new Array(NUM_LEDS).fill(0);
                this.redFactors = new Array(NUM_LEDS).fill(0);
        }
        
        setBoxes(boxes)
        {
                this.boxes = boxes;
        }

        update(patrolsPos)
        {
                //-- on veut un entier ici
                patrolsPos = Math.round(patrolsPos);

                this.fadeToBlack();

                this.flashValue = (Math.sin(this.flashInc * this.flashSpeed) * 0.5 + 0.5) * this.maxFlashValue;
                this.flashInc++;

                //-- boîtes qui contiennent des objets : jaune
                for (let box in this.boxes)
                        if (this.boxes[box].objectInside != 'none')
                                for (let i = box * NUM_LEDS_PER_BOX; i < box * NUM_LEDS_PER_BOX + NUM_LEDS_PER_BOX; i++)
                                        this.ledValues[i] = this.getColor(255, 255 - this.redFactors[i], 0, this.flashValue);

                //-- définit les valeurs des leds
                const patrolIndices = [patrolsPos - 1, patrolsPos, patrolsPos + 1];
                for (let i of patrolIndices)
                        if (i >= 0 && i < this.ledValues.length)
                        {
                                this.redFactors[i] = 255; // <- pour le fade avec le jaune
                                this.ledValues[i] = this.getColor(255, 0, 0);
                        }
                
                //-- fade off des leds rouges
                for (let i in this.ledValues)
                {
                        this.redFactors[i] *= 0.7;
                }

                this.sendCommand('led', this.ledValues);
                
                this.io.emit('update_patrols', this.ledValues);
        }
        
        getColor(r, g, b, a = 255)
        {
                return ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;
        }
        
        fadeToBlack(factor = 0.7)
        {
                this.ledValues.forEach((color, i) =>
                {
                        const r = (color >> 24) & 0xFF;
                        const g = (color >> 16) & 0xFF;
                        const b = (color >> 8) & 0xFF;
                        const a = color & 0xFF;
                        
                        const nr = Math.max(0, Math.floor(r * factor));
                        const ng = Math.max(0, Math.floor(g * factor));
                        const nb = Math.max(0, Math.floor(b * factor));
                        
                        this.ledValues[i] = ((nr << 24) | (ng << 16) | (nb << 8) | a) >>> 0;
                });
        }
        
        testActivateLeds()
        {
                console.log('testActivateLeds');
            
                //-- fade off des leds rouges
                for (let i in this.ledValues)
                {
                        this.ledValues[i] = this.getColor(255, 0, 0);
                }
            
                this.sendCommand('led', this.ledValues);
        }
}