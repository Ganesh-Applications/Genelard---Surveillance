// Chargement des dépendances
import path from 'path';
import express from 'express';
import http from 'http';
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

import GameManager from './server/game-manager.js';

const gameManager = new GameManager(io);

app.get('/', (req, res) =>
{
        res.sendFile(path.resolve('index.html'));
});

// Traitement des fichiers statiques
app.use(express.static(path.resolve('./')));

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

        socket.on('hand_in_box', function(index, isInside)
        {
                console.log('Une main', isInside ? 'entre dans la boîte' : 'sort de la boîte', index);
        });

        socket.on('object_in_box', function(index, isInside)
        {
                console.log('Un objet', isInside ? 'entre dans la boîte' : 'sort de la boîte', index);
                gameManager.boxes[index].objectInside = isInside ? true : 'none';
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

server.listen(3000, () => {
        console.log('listening on *:3000');
});