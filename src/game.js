var numPassedOjects = 0;

function startGame()
{
        numPassedOjects = 0;
        
        socket.emit('start_game');
        
        $('#game').removeClass('ended');
        
        updateScore();
}

function stopGame()
{
        socket.emit('stop_game');
        //...
}

function missionComplete(mission)
{
        numPassedOjects++;
        
        updateScore();
}

function missionFailure(mission)
{
        stopGame();
        
        $('#game').addClass('ended');
}

function updateScore()
{
        $('.score .num').text(numPassedOjects);
}

function addMission(mission)
{
        let missionElt = $(''
                + '<div class="mission" data-time="high">'
                +       '<div class="mission-image">'
                +               '<img src="img/objects/lait.svg" alt=""/>'
                +       '</div>'
                +       '<div class="mission-bar">'
                +       '<div class="mission-title">'
                +               'Cache ' + mission.objectName + ' dans ' + mission.boxName
                +       '</div>'
                +       '<div class="mission-time">'
                +               MISSION_START_TIME
                +       '</div>'
                + '</div>'
        );
        
        $('#game .missions').append(missionElt);
        
        let appearDuration = 250;
        
        missionElt.hide().slideDown(appearDuration);
        
        setInterval(function()
        {
                missionElt.addClass('visible');
        }, appearDuration);
}