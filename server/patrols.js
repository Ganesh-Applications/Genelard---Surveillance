import {NUM_LEDS, NUM_LEDS_PER_BOX, PATROL_MODES, PATROLLING, HOLDING} from "./constants.js";
import Leds from "./leds.js";

export default class Patrols
{
        constructor(gameManager)
        {
                this.gameManager = gameManager;
                this.patrolPos = 0;
                this.patrolSize = 4;
                this.patrolDirection = 1;
                this.patrolMode = PATROLLING;
                this.patrolsHoldingBox = 0;
                this.running = false;
                
                this.patrolsReachSpeed = this.patrolSpeed = 1;
        }
        
        start()
        {
                this.running = true;
                
                setTimeout(
                        this.updatePatrols.bind(this),
                        40
                );
                
                this.updatePatrolMode();
        }
        
        stop()
        {
                this.running = false;
        }
        
        updatePatrols()
        {
                if (!this.running)
                        return;
                
                // inertie sur la vitesse de déplacement des patrouilles
                let speedInertia = PATROL_MODES[this.patrolMode].inertia;
                
                this.patrolSpeed += (this.patrolsReachSpeed - this.patrolSpeed) * speedInertia;
                
                //-- déplace la patrouille en fonction de sa direction et de sa vitesse
                this.patrolPos += this.patrolDirection * this.patrolSpeed;
                
                let leftBound = 0;
                let rightBound = NUM_LEDS;
                
                //-- en mode holding, on ne se déplace que sur quelques cases autour du centre de la boîte actuellement survolée
                if (this.patrolMode == HOLDING)
                {
                        let numLedsMove = 2;
                        leftBound = this.patrolsHoldingBox * NUM_LEDS_PER_BOX + NUM_LEDS_PER_BOX / 2 - numLedsMove;
                        rightBound = leftBound + numLedsMove * 2;
                }
                
                //-- check les bounds de déplacement
                if (this.patrolDirection == 1 && this.patrolPos >= rightBound)
                {
                        //-- mode holding : repart dans l'autre sens
                        if (this.patrolMode == HOLDING)
                                this.patrolDirection = -1;
                        
                        //-- mode patrolling : soit repart dans l'autre sens, soit revient par l'autre côté
                        else
                                if (this.chance(2))
                                        this.patrolDirection = -1;
                                else
                                        this.patrolPos = 0;
                }
                else if (this.patrolDirection == -1 && this.patrolPos <= leftBound)
                {
                        //-- mode holding : repart dans l'autre sens
                        if (this.patrolMode == HOLDING)
                                this.patrolDirection = 1;
                        
                        //-- mode patrolling : soit repart dans l'autre sens, soit revient par l'autre côté
                        else
                                if (this.chance(2))
                                        this.patrolDirection = 1;
                                else
                                        this.patrolPos = rightBound;
                }
                
                /*io.sockets.emit('update_patrols', {
                        pos: this.patrolPos,
                        size: this.patrolSize,
                        mode: this.patrolMode
                });*/
                
                this.gameManager.patrolsUpdated(this.patrolPos);
                
                setTimeout(
                        this.updatePatrols.bind(this),
                        40
                );
        }
        
        updatePatrolMode()
        {
                let newMode = false;
                let incr = 0;
                
                /*do
                {
                        newMode = this.getRandomPatrolMode();
                        console.log(newMode);
                }
                while (newMode == this.patrolMode && ++incr < 100);*/
                
                //-- on alterne entre PATROLLING et HOLDING
                if (this.patrolMode == PATROLLING)
                {
                        this.patrolMode = HOLDING;
                        this.patrolsHoldingBox = Math.floor(this.patrolPos / NUM_LEDS_PER_BOX);
                }
                else
                {
                        this.patrolMode = PATROLLING;
                }
                
                //-- met à jour la vitesse de déplacement des patrouilles
                this.patrolsReachSpeed = PATROL_MODES[this.patrolMode].maxSpeed;
                
                console.log('new mode ', this.patrolMode);
                
                let newDelay = this.getNextPatrolModeUpdateDelay();
                setTimeout(this.updatePatrolMode.bind(this), newDelay);
        }
        
        getRandomPatrolMode()
        {
                const keys = Object.keys(PATROL_MODES);
                
                //-- calcule la somme totale des probabilités
                const totalProbability = keys.reduce((sum, key) => sum + PATROL_MODES[key].probability, 0);
                
                //-- tire un nombre au hasard entre 0 et totalProbability
                let random = Math.random() * totalProbability;
                
                //-- parcourt les modes jusqu’à tomber sur le bon intervalle
                for (const key of keys)
                {
                        random -= PATROL_MODES[key].probability;
                        if (random <= 0)
                                return key;
                }
        }
        
        getNextPatrolModeUpdateDelay()
        {
                if (this.patrolMode == PATROLLING)
                        return Math.random() * 5000 + 1000;
                else if (this.patrolMode == HOLDING)
                        return Math.random() * 8000 + 3000;
        }
        
        /**
         * Tire au hasard parmi "probability" valeurs
         */
        chance(probability)
        {
                return Math.floor(Math.random() * probability) == 0;
        }
}