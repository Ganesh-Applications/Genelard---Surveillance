import Box from "./box.js";
import Mission from "./mission.js";
import {STEPS, LED_COLORS, OBJECTS, BOXES, NUM_LEDS_PER_BOX, NUM_BOX, NUM_OBJECTS} from './constants.js';
import Patrols from "./patrols.js";
import Leds from "./leds.js";

export default class GameManager
{
        constructor(io)
        {
                this.io = io;

                //-- création des boîtes
                this.boxes = [];
                for (let i in BOXES)
                        this.boxes.push(new Box(
                                BOXES[i].name,
                                BOXES[i].path,
                                this.io
                        ));
                        
                //-- liste d'objets restants (on en enlève au fur et à mesure des missions)
                this.remainingObjects = [];
                for (let o in OBJECTS)
                    this.remainingObjects.push(OBJECTS[o]);

                //-- création du gestionnaire de leds
                this.leds = new Leds("leds", "/dev/espLeds", this.io);
                this.leds.setBoxes(this.boxes);
                
                this.started = false;

                //-- pour ne pas tirer deux fois la même boîte d'affilée (en soi, exclut la boite 1 comme boîte de départ, mais c'est pas plus mal)
                this.previousBoxIndex = 0;

                //-- création des patrouilles
                this.patrols = new Patrols(this);
        }
        
        startGame()
        {
                this.started = true;
                
                this.alertLevel = 0;
                
                this.patrols.start();
                
                this.currentMissions = [];
                
                let gameManager = this;
                
                setTimeout(function()
                {
                    this.createNewMission();
                }.bind(this), 3000);
        }
        
        endOfGame(success)
        {
                console.log('END OF GAME !');
            
                this.stopGame();
                this.io.emit('end_of_game', success);
        }
        
        stopGame()
        {
                if (!this.started)
                    return;
            
                this.started = false;
                
                this.patrols.stop();
                
                this.currentMissions = [];
        }
        
        createNewMission()
        {
                let box = this.getRandomBox();
                
                let objectIndex = Math.floor(Math.random() * this.remainingObjects.length);
                let object = this.remainingObjects[objectIndex];
                
                console.log('new mission, box=', box.name, ', object=', objectIndex);
                console.log(object.name);
                
                const mission = new Mission(box, object);
                mission.eventListener = this;
                
                this.currentMissions.push(mission);
                
                //-- enlève l'objet du tableau des objets restants
                this.remainingObjects.splice(objectIndex, 1);
                
                this.io.emit('new_mission', mission.clientData);
                
                setTimeout(function()
                {
                    this.onMissionComplete(mission);
                    
                }.bind(this), 3000);
        }
        
        getRandomBox()
        {
                let inc = 0;
                let boxIndex = this.previousBoxIndex;
                
                do
                {
                    boxIndex = Math.floor(Math.random() * NUM_BOX);
                }
                while (boxIndex == this.previousBoxIndex && inc++ < 100);
                
                let box = this.boxes[boxIndex];
                return box;
        }
        
        onChangeStep(mission)
        {
                console.log(`Mission step changed: ${mission.step}`);
                
                if (mission.step === STEPS.COMPLETED)
                {
                        // mission.destroy();
                        
                        // setTimeout(() =>
                        // {
                                // this.createNewMission();
                        // }, 3000); // Attendre 5 secondes avant de créer une nouvelle mission
                }
                else if (mission.step === STEPS.FAILED)
                {
                    
                }
                else if (mission.step === STEPS.FAILED_OBJECT_STILL_INSIDE)
                {
                    
                }
        }
        
        /**
         * Evenement diffusé par le client via server.js
         * = mission expirée
         */
        onMissionFailed(mission, reason)
        {
                console.log('Mission failed', reason, mission.clientData);
                
                this.endMission(mission, false);
        }
        
        onMissionComplete(mission)
        {
                console.log(`Mission complete`);
                
                this.io.emit('mission_complete', mission.clientData);
                
                this.endMission(mission, true);
        }
        
        endMission(mission, success)
        {
                console.log(`Mission ended`);
                
                if (this.remainingObjects.length == 0)
                {
                        this.endOfGame(success);
                        return;
                }
                
                setTimeout(function()
                {                        
                        this.createNewMission();
                }.bind(this), 3000);
        }
        // onMissionExpired(mission)
        // {
                
                // let gameManager = this;
                
                // setTimeout(function()
                // {
                        // gameManager.createNewMission();
                // }, 2000);
        // }
        
        setHandInBox(index, isInside)
        {
                this.boxes[index].frontSensor.inside = isInside;
        }
        
        /**
         * Callback appelé par Patrols lorsque les patrouilles se déplacent
         */
        patrolsUpdated(patrolsPos)
        {
                if (!this.started)
                        return;
                
                //-- met à jour les LEDs
                this.leds.update(patrolsPos);
                
                //-- cherche quelle boîte est actuellement survolée par les patrouilles
                let currentBox = Math.floor(patrolsPos / NUM_LEDS_PER_BOX);
                
                if (currentBox < 0)
                        currentBox = 0;
                else if (currentBox > NUM_BOX-1)
                        currentBox = NUM_BOX-1;
                
                //-- vérifie si une main est dans une boîte survolée par une patrouille
                let frontInside = this.boxes[currentBox].frontSensor.inside;
                let backInside = this.boxes[currentBox].backSensor.inside;
                
                if (frontInside || backInside)
                {
                        console.log("ALERT ON BOX " + (currentBox+1), "alertLevel=", this.alertLevel);
                        
                        if (this.alertLevel < 50)
                        {
                                this.alertLevel++;
                                
                                this.io.emit('alert');
                        }
                        else
                        {
                                this.io.emit('mission_failed');
                                
                                this.stopGame();
                        }
                }
        }
}