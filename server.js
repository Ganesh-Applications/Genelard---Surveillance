// Chargement des dépendances
import path from 'path';
import express from 'express';
import http from 'http';
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

import GameManager from './server/game-manager.js';

const gameManager = new GameManager();

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
        
        setInterval(function()
        {
                socket.emit('new_mission', gameManager.currentMissions[0].clientData);
        }, 2000);
});

server.listen(3000, () => {
        console.log('listening on *:3000');
});