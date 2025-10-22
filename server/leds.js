import ESPHandler from "./esp-handler.js";
import {NUM_LEDS, NUM_LEDS_PER_BOX, PATROL_MODES} from "./constants.js";

export default class Leds extends ESPHandler
{
        init(name)
        {
                this.ledValues = [];
                
                this.flashValue = 0;
                this.flashDirection = 1;
                this.flashSpeed = 2;
                this.maxFlashValue = 20;
                
                this.activeBoxes = [0];
                
                for (let i = 0; i < NUM_LEDS; i++)
                {
                        this.ledValues[i] = 0;
                }
        }
        
        update(patrolsPos)
        {
                //-- on veut un entier ici
                patrolsPos = Math.round(patrolsPos);
                
                this.fadeToBlack();
                
                for (let activeBox in this.activeBoxes)
                        for (let i = this.activeBoxes[activeBox]*NUM_LEDS_PER_BOX; i < this.activeBoxes[activeBox]*NUM_LEDS_PER_BOX+NUM_LEDS_PER_BOX; i++)
                                this.ledValues[i] = this.getColor(255, 255, 0, this.flashValue);
                
                this.flashValue += this.flashDirection * this.flashSpeed;
                if (this.flashValue > this.maxFlashValue || this.flashValue <= 0)
                        this.flashDirection *= -1;
                
                this.ledValues[patrolsPos-1] = this.getColor(255, 0, 0);
                this.ledValues[patrolsPos] = this.getColor(255, 0, 0);
                this.ledValues[patrolsPos+1] = this.getColor(255, 0, 0);
                
                // console.log(this.ledValues);
                
                this.sendCommand('led', this.ledValues);
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
        
}