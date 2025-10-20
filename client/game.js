var numPassedOjects = 0;
var gameInterval = null;

function startGame()
{
        numPassedOjects = 0;
        
        socket.emit('start_game');
        
        $('#game').removeClass('ended');

        gameInterval = setInterval(everySecond, 1000);

        updateScore();
}

function stopGame()
{
        socket.emit('stop_game');

        clearInterval(gameInterval);

        //...
}

function everySecond()
{
        $('.mission:not(.expired)').each(function()
        {
                let missionElt = $(this);
                let time = missionElt.data('time');
                time--;

                if (time == 0)
                {
                        missionExpired(missionElt);
                }
                else
                {
                        let timeKeyword = time > MISSION_START_TIME / 2
                                ? 'high'
                                : time > MISSION_START_TIME / 4
                                        ? 'medium'
                                        : 'low';

                        missionElt.attr('data-time-status', timeKeyword);
                        missionElt.find('.mission-time').text(time);
                        missionElt.data('time', time);
                }
        });
}

function missionExpired(missionElt)
{
        let mission = missionElt.data('mission');
        socket.emit('mission_expired', mission);

        missionElt.addClass('expired');
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
                + '<div class="mission" data-time-status="high">'
                +       '<div class="mission-image">'
                +               '<img src="img/objects/' + mission.object.key + '.svg" alt=""/>'
                +       '</div>'
                +       '<div class="mission-bar">'
                +       '<div class="mission-title">'
                +               'Cache ' + mission.object.name + ' ' + mission.boxName
                +       '</div>'
                +       '<div class="mission-time">'
                +               MISSION_START_TIME
                +       '</div>'
                + '</div>'
        );

        missionElt.data('time', MISSION_START_TIME);
        missionElt.data('mission', mission);

        $('#game .missions').append(missionElt);
        
        let appearDuration = 250;
        
        missionElt.hide().slideDown(appearDuration);
        
        setTimeout(function()
        {
                missionElt.addClass('visible');
        }, appearDuration);
}