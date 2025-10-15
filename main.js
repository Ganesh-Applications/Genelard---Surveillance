var jbody = $('body');
var currentPage = 'home';
var currentInstructionsSlide = 0;
var numInstructionsSlides = $('#instructions .slides .slide').length;
var socket;

const MISSION_START_TIME = 30;

setupIO();
setEventListeners();

function setupIO()
{
        socket = io();
        socket.on('hello', onSocketHello);
        socket.on('new_mission', onSocketNewMission);
        socket.on('mission_complete', onSocketMissionComplete);
        socket.on('mission_failed', onSocketMissionFailed);
}

function setEventListeners()
{
       $('#home .btn').click(gotToInstructions);
       $('#instructions .btn.start-game').click(gotoGame);
       $('#instructions .slide-next').click(instructionsNextSlide);
       $('#instructions .slide-prev').click(instructionsPrevSlide);
       $('#game .btn.back-to-instructions').click(backToInstructions);
       $('#end .btn.replay').click(replay);
}

function gotoPage(page)
{
        if (jbody.hasClass('transiting'))
                return;
        
        currentPage = page;
        
        jbody.addClass('transiting');
        
        setTimeout(function()
        {
                $('.page').removeClass('current');
                $('#' + currentPage).addClass('current');
                
                jbody.removeClass('transiting');
                
        }, 1000);
        
}

function gotToInstructions()
{
        $('#instructions .slide').removeClass('current').first().addClass('current');
        currentInstructionsSlide = 0;
        
        gotoPage('instructions');
}

function instructionsNextSlide()
{
        let slides = $('#instructions .slide');
        
        if (++currentInstructionsSlide >= numInstructionsSlides)
                currentInstructionsSlide = 0;
        
        showCurrentInstructionsSlide();
}

function instructionsPrevSlide()
{
        if (--currentInstructionsSlide < 0)
                currentInstructionsSlide = numInstructionsSlides - 1;
        
        showCurrentInstructionsSlide();
}

function showCurrentInstructionsSlide()
{
        $('.slides .slide.current').removeClass('current');
        $('.slides .slide:eq(' + currentInstructionsSlide + ')').addClass('current');
        
        $('.slider-dots .dot').removeClass('current');
        $('.slider-dots .dot:eq(' + currentInstructionsSlide + ')').addClass('current');
}

function gotoGame()
{
        gotoPage('game');
        
        startGame();
}

function backToInstructions()
{
        stopGame();
        
        gotToInstructions();
}

function replay()
{
        gotToInstructions();
}


/*
 * SOCKET EVENTS
 */

function onSocketHello()
{
        console.log('Server IO connected !');
}

function onSocketNewMission(mission)
{
        console.log('New Mission !');
        console.log(mission);
        
        addMission(mission);
}

function onSocketMissionComplete()
{
        numPassedOjects++;
        
        updateScore();
}

function onSocketMissionFailed()
{
        console.log('Mission failed');
}