import Box from "./box.js";
import Mission from "./mission.js";
import {STEPS, LED_COLORS, OBJECTS, BOXES, NUM_LEDS_PER_BOX, NUM_BOX} from './constants.js';
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
                                BOXES[i].path
                        ));

                //-- création du gestionnaire de leds
                this.leds = new Leds("leds", "COM5");
                this.leds.setIO(io);
                this.leds.setBoxes(this.boxes);
                
                this.started = false;

                //-- création des patrouilles
                this.patrols = new Patrols(this);
        }
        
        startGame()
        {
                this.started = true;
                
                this.alertLevel = 0;
                
                this.patrols.start();
                
                this.currentMissions = [];
                this.createNewMission(this.boxes[0], OBJECTS[0]);
        }
        
        stopGame()
        {
                this.started = false;
                console.log("STOPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP");
                this.patrols.stop();
        }
        
        createNewMission(box, object)
        {
                const mission = new Mission(box, object);
                mission.eventListener = this;
                
                this.currentMissions.push(mission);
        }
        
        onChangeStep(mission)
        {
                console.log(`Mission step changed: ${mission.step}`);
                
                if (mission.step === STEPS.UNSTARTED)
                        mission.box.setLed(LED_COLORS.OFF);
                else if (mission.step === STEPS.GIVE_SIDE_INSIDE)
                        mission.box.setLed(LED_COLORS.YELLOW);
                else if (mission.step === STEPS.OBJECT_DROPPED)
                        mission.box.setLed(LED_COLORS.LIGHT_BLUE);
                else if (mission.step === STEPS.TAKE_SIDE_INSIDE)
                        mission.box.setLed(LED_COLORS.BLUE);
                else if (mission.step === STEPS.COMPLETED)
                {
                        mission.box.setLed(LED_COLORS.GREEN);
                        mission.destroy();
                        setTimeout(() =>
                        {
                                mission.box.setLed(LED_COLORS.OFF);
                                this.createNewMission();
                        }, 3000); // Attendre 5 secondes avant de créer une nouvelle mission
                }
                else if (mission.step === STEPS.FAILED)
                {
                        mission.box.setLed(LED_COLORS.RED);
                }
                else if (mission.step === STEPS.FAILED_OBJECT_STILL_INSIDE)
                {
                        mission.box.setLed(LED_COLORS.PURPLE);
                }
        }
        
        onMissionFailed(mission, reason)
        {
                console.log(`Mission failed: ${reason}`, new Date().getTime());
                //mission.destroy();
                
                //var gameManager = this;
                
                /*setTimeout(function()
                {
                        mission.box.setLed(LED_COLORS.OFF);

                        gameManager.createNewMission();
                }, 3000);*/
        }
        
        onMissionEnd(mission)
        {
                console.log(`Mission ended`);
                
                let gameManager = this;
                
                setTimeout(function()
                {
                        mission.box.setLed(LED_COLORS.OFF);
                        
                        gameManager.createNewMission();
                }, 3000);
        }
        
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
                        console.log("ALERT ON BOX " + (currentBox+1), "alertLevel=", Math.floor(this.alertLevel/20));
                        
                        if (this.alertLevel < 300)
                        {
                                this.alertLevel++;
                                console.log('alertLevel level ', this.alertLevel);
                                this.io.emit('alert', Math.floor(this.alertLevel/100));
                        }
                        else
                        {
                                this.io.emit('mission_failed');
                                
                                this.stopGame();
                        }
                }
        }
}