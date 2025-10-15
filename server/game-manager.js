import Box from "./box.js";
import Mission from "./mission.js";
import { STEPS, LED_COLORS, OBJECTS } from './constants.js';

const box1 = new Box("la Cave à vin", "/dev/esp1");

export default class GameManager
{
        constructor()
        {
                this.currentMissions = [];
                this.createNewMission();
        }
        
        createNewMission(object)
        {
                const mission = new Mission(box1, OBJECTS[0]);
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