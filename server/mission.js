import { STEPS, FAILED_REASONS } from './constants.js';

export default class Mission
{
        constructor(box, object)
        {
                this.id = new Date().getTime();
                this.box = box;
                this.object = object;
                this.step = STEPS.UNSTARTED;
                
                //-- Objet pour passer les infos de la mission au client
                this.clientData = {
                        id: this.id,
                        boxName: this.box.name,
                        object: this.object
                };
                
                //-- On s'abonne aux événements de la boîte
                this.box.gameManager = this;
                
                //-- Écouteur d'événements de la mission
                this.gameManager = null;
        }
        
        //@todo voir si on laisse ce mode dans mission ou non... pas forcément pertinent
        onBoxUpdate()
        {
                let giveSideInside = this.box.frontSensor.inside;
                let takeSideInside = this.box.backSensor.inside;
                let boxObject = this.box.rfidSensorValue;
                
                if (giveSideInside && takeSideInside
                        && this.step !== STEPS.FAILED
                        && this.step !== STEPS.FAILED_OBJECT_STILL_INSIDE)
                {
                        this.missionFailed(FAILED_REASONS.BOTH_SIDES_INSIDE);
                }
                
                if (this.step === STEPS.UNSTARTED)
                {
                        if (giveSideInside)
                        {
                                this.changeStep(STEPS.GIVE_SIDE_INSIDE)
                        }
                }
                else if (this.step === STEPS.GIVE_SIDE_INSIDE)
                {
                        if (!giveSideInside)
                        {
                                //-- le bon objet a été déposé
                                if (boxObject === this.object.id)
                                {
                                        this.changeStep(STEPS.OBJECT_DROPPED);
                                }
                                //-- le mauvais objet a été déposé, on échoue la mission
                                else if (boxObject !== "none")
                                {
                                        this.changeStep(STEPS.FAILED);
                                        this.missionFailed(FAILED_REASONS.WRONG_OBJECT);
                                }
                                //-- aucun objet n'a été déposé, on revient à l'état initial
                                else
                                {
                                        this.changeStep(STEPS.UNSTARTED);
                                }
                        }
                }
                else if (this.step === STEPS.OBJECT_DROPPED)
                {
                        //-- la main du receveur est dans la boîte
                        if (takeSideInside)
                        {
                                this.changeStep(STEPS.TAKE_SIDE_INSIDE);
                        }
                        else if (boxObject === "none")
                        {
                                //-- l'objet a été retiré de la boîte : on revient à l'état initial
                                this.changeStep(STEPS.UNSTARTED);
                        }
                }
                else if (this.step === STEPS.TAKE_SIDE_INSIDE)
                {
                        //-- la main du receveur est sortie de la boîte
                        if (!takeSideInside)
                        {
                                //-- l'objet a été pris : la mission est réussie
                                if (boxObject === "none")
                                {
                                        this.changeStep(STEPS.COMPLETED);
                                }
                                //-- l'objet n'a pas été pris : on revient à l'état précédent
                                else
                                {
                                        this.changeStep(STEPS.OBJECT_DROPPED);
                                }
                        }
                }
                /*else if (this.step == STEPS.FAILED)
                {
                        if (boxObject !== "none")
                        {
                                this.changeStep(STEPS.FAILED_OBJECT_STILL_INSIDE);
                        }
                        else
                        {
                                this.missionEnd();
                        }
                }*/
                else if (this.step == STEPS.FAILED_OBJECT_STILL_INSIDE)
                {
                        if (boxObject === "none")
                        {
                                // end mission ? à voir ce qu'on fait exactement...
                            
                                // this.endMission();
                        }
                }
        }
        
        missionFailed(reason)
        {
                let boxObject = this.box.rfidSensorValue;
                
                if (boxObject !== 'none')
                {
                        this.changeStep(STEPS.FAILED_OBJECT_STILL_INSIDE);
                        this.gameManager.onMissionFailed(this, reason);
                }
                else
                {
                        
                        this.changeStep(STEPS.FAILED);
                        this.gameManager.onMissionFailed(this, reason);
                }
                
        }
        
        changeStep(newStep)
        {
                this.step = newStep;
                
                this.gameManager.onChangeStep(this);
        }
}