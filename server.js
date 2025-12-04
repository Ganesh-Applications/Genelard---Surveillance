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
app.get('/monitoring', (req, res) =>
{
        res.sendFile(path.resolve('monitoring.html'));
});

// Traitement des fichiers statiques
app.use(express.static(path.resolve('./')));

// Gestion des connexions au socket
io.sockets.on('connection', function(socket)
{
        socket.emit('hello');
        
        //-- @todo temporaire pour lancer le jeu immédiatement si besoin
        // gameManager.startGame();
        
        socket.on('start_game', function(name)
        {
                console.log('start game');
                gameManager.startGame();
        });
        
        socket.on('stop_game', function(name)
        {
                console.log('stop game?');
                gameManager.stopGame();
        });
        
        socket.on('mission_expired', function(iMission)
        {
                console.log('missionExpired');
                gameManager.onMissionFailed(iMission, 'expired');
        });

        socket.on('hand_in_box', function(index, isInside)
        {
                console.log('Une main', isInside ? 'entre dans la boîte' : 'sort de la boîte', index);
                
                gameManager.setHandInBox(index, isInside);
        });

        socket.on('object_in_box', function(index, isInside)
        {
                console.log('Un objet', isInside ? 'entre dans la boîte' : 'sort de la boîte', index);
                gameManager.boxes[index].objectInside = isInside ? true : 'none';
        });

        socket.on('activate_leds', function()
        {
            
            console.log('socket receive activate_leds');
                gameManager.testActivateLeds();
        });
});

server.listen(3000, () => {
        console.log('listening on *:3000');
});