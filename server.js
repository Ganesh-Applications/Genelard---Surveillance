// Chargement des dépendances
import path from 'path';
import express from 'express';
import http from 'http';
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

import GameManager from './server/game-manager.js';
import {PATROLS_MODES} from "./server/constants.js";

const NUM_BOX = 4;
const NUM_LEDS_PER_BOX = 16; // tmp
const NUM_LEDS = NUM_LEDS_PER_BOX * NUM_BOX;

let patrolsPos = 0;
let patrolsSize = 4;
let patrolsDirection = 1;
let patrolsMode = PATROLS_MODES.HOLDING;
let patrolsHoldingBox = 0;

const gameManager = new GameManager();

app.get('/', (req, res) =>
{
        res.sendFile(path.resolve('index.html'));
});

// Traitement des fichiers statiques
app.use(express.static(path.resolve('./')));

setInterval(function()
{
        updatePatrols();
}, 100);

updatePatrolsMode();

// Gestion des connexions au socket
io.sockets.on('connection', function(socket)
{
        socket.emit('hello');
        
        socket.on('start_game', function(name)
        {
                console.log('start game');
        });
        
        socket.on('stop_game', function(name)
        {
                console.log('stop game');
        });

        /*let iMission = 0;
        let sendMissionInterval = setInterval(function()
        {
                socket.emit('new_mission', gameManager.currentMissions[iMission].clientData);
                iMission++;

                if (iMission == 4)
                        clearInterval(sendMissionInterval);
        }, 2000);*/
});

function updatePatrols()
{
        if (patrolsMode == PATROLS_MODES.PATROLLING || PATROLS_MODES.HOLDING)
        {
                patrolsSize = patrolsMode == PATROLS_MODES.PATROLLING
                        ? 1
                        : 1;

                let leftBound = patrolsMode == PATROLS_MODES.PATROLLING
                        ? 0
                        : patrolsHoldingBox * NUM_LEDS_PER_BOX;

                let rightBound = patrolsMode == PATROLS_MODES.PATROLLING
                        ? NUM_LEDS
                        : leftBound + NUM_LEDS_PER_BOX;

                patrolsPos += patrolsDirection;

                if (patrolsDirection == 1 && patrolsPos >= rightBound - patrolsSize)
                {
                        patrolsDirection = -1;
                }
                else if (patrolsDirection == -1 && patrolsPos <= leftBound)
                {
                        patrolsDirection = 1;
                }
        }
        else if (patrolsMode == PATROLS_MODES.HOLDING)
        {
                patrolsPos = patrolsHoldingBox * NUM_LEDS_PER_BOX;

                patrolsSize = 2;
        }
        else if (patrolsMode == PATROLS_MODES.ALERT)
        {
                patrolsSize = 8;
        }

        io.sockets.emit('update_patrols', {
                pos: patrolsPos,
                size: patrolsSize,
                mode: patrolsMode
        });
}

function updatePatrolsMode()
{
        let modes = Object.keys(PATROLS_MODES);
        let newMode = false;
        let incr = 0;

        do
        {
                newMode = PATROLS_MODES[modes[Math.floor(Math.random() * modes.length)]];
        }
        while (newMode == patrolsMode && ++incr < 100);

        if (newMode == PATROLS_MODES.HOLDING)
        {
                patrolsHoldingBox = Math.floor(patrolsPos / NUM_LEDS_PER_BOX);
        }

        patrolsMode = newMode;

        console.log('new mode ', patrolsMode);

        let newDelay = Math.random() * 5000 + 1000;
        setTimeout(updatePatrolsMode, newDelay);
}

server.listen(3000, () => {
        console.log('listening on *:3000');
});