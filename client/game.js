var numPassedOjects = 0;
var gameInterval = null;

function startGame()
{
        numPassedOjects = 0;
        $('.missions').empty();
        
        socket.emit('start_game');
        
        $('#game').removeClass('ended success failure');

        gameInterval = setInterval(everySecond, 1000);

        updateScore();
}

function stopGame()
{
    console.log('stop game');
    
        socket.emit('stop_game');

        clearInterval(gameInterval);
        
        $('.mission').removeAttr('data-time-status');

        //...
}

function everySecond()
{
        $('.mission:not(.expired):not(.success)').each(function()
        {
                let missionElt = $(this);
                let time = missionElt.data('time');
                time--;

                let timeKeyword = time > MISSION_START_TIME / 2
                        ? 'high'
                        : time > MISSION_START_TIME / 4
                                ? 'medium'
                                : 'low';
                
                if (time == 0)
                {
                        timeKeyword = 'expired';
                        time = 'Mission échouée';
                        
                        missionExpired(missionElt);
                }

                missionElt.attr('data-time-status', timeKeyword);
                missionElt.find('.mission-time').text(time);
                missionElt.data('time', time);
        });
}

function missionExpired(missionElt)
{
        console.log('Mission expired !');
        console.log(mission);
        
        let mission = missionElt.data('mission');
        socket.emit('mission_expired', mission);

        missionElt.addClass('expired');
        
        archiveMissionDelayed(missionElt);
}

function missionComplete(mission)
{
        console.log('Mission complete !');
        console.log(mission);
        
        let missionElt = $('.mission[data-mission-id=' + mission.id + ']');
        missionElt.addClass('success');
        missionElt.attr('data-time-status', 'success');
        missionElt.find('.mission-time').text('Mission réussie !');
        
        archiveMissionDelayed(missionElt);
        
        numPassedOjects++;

        updateScore();
}

function archiveMissionDelayed(missionElt)
{
        setTimeout(function()
        {
            missionElt.addClass('archived');
        }, 3000);
}

function missionFailure(mission)
{
        // $('#game').addClass('pre-end');
        
        // setTimeout(function()
        // {
            // $('#game').removeClass('pre-end').addClass('ended');
            
        // }, 2000);
        
        console.log('mission failure');
        
        stopGame();
        
}

function updateScore()
{
        $('.score .num').text(numPassedOjects);
}

function addMission(mission)
{
        let missionElt = $(''
                + '<div class="mission" data-time-status="high" data-mission-id="' + mission.id + '">'
                +       '<div class="mission-bar">'
                    +       '<div class="mission-title">'
                    +               'Cache ' + mission.object.name + ' ' + mission.boxName
                    +       '</div>'
                    +       '<div class="mission-time">'
                    +               MISSION_START_TIME
                    +       '</div>'
                    +       '<div class="alert-flash"></div>'
                +       '</div>'
                    +       '<div class="mission-image">'
                    +               '<img src="/client/img/objects/' + mission.object.key + '.svg" alt=""/>'
                    +       '</div>'
                + '</div>'
        );

        missionElt.data('id', mission.id);
        missionElt.data('time', MISSION_START_TIME);
        missionElt.data('mission', mission);

        $('#game .missions').prepend(missionElt);
        
        missionElt.hide().slideDown();
        
        let appearDuration = 400;
        
        setTimeout(function()
        {
                missionElt.addClass('visible');
        }, appearDuration);
}