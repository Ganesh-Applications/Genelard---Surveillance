import Box from "./box.js";
import Mission from "./mission.js";
import {STEPS, LED_COLORS, OBJECTS} from './constants.js';
import Patrols from "./patrols.js";

const box1 = new Box("dans la Cave à vin", "/dev/esp1");
const box2 = new Box("sous le Pont", "/dev/esp2");
const box3 = new Box("à la Poste", "/dev/esp3");
const box4 = new Box("dans le Grenier", "/dev/esp4");

export default class GameManager
{
        constructor(io)
        {
                this.io = io;
                
                this.currentMissions = [];
                this.createNewMission(box1, OBJECTS[0]);
                this.createNewMission(box2, OBJECTS[1]);
                this.createNewMission(box3, OBJECTS[2]);
                this.createNewMission(box4, OBJECTS[3]);
                
                this.patrols = new Patrols();
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
        
}