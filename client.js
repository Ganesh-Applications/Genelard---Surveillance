var jbody = $('body');
var currentPage = 'home';
var currentInstructionsSlide = 0;
var numInstructionsSlides = $('#instructions .slides .slide').length;
var socket;

const MISSION_START_TIME = 30;

const NUM_BOXES = 4; // tmp
const NUM_LEDS_PER_BOX = 16; // tmp
const NUM_LEDS = NUM_BOXES * NUM_LEDS_PER_BOX;
var leds = []; // tmp

setupIO();
setupLeds();
setEventListeners();

function setupIO()
{
        socket = io();
        socket.on('hello', onSocketHello);
        socket.on('new_mission', onSocketNewMission);
        socket.on('mission_complete', onSocketMissionComplete);
        socket.on('mission_failed', onSocketMissionFailed);

        socket.on('update_patrols', onSocketUpdatePatrols); // tmp
}

// tmp
function setupLeds()
{
        for (let i = 0; i < NUM_LEDS; i++)
        {
                let ledClasses = 'led';
                if (i > 0 && (i+1) % NUM_LEDS_PER_BOX == 0)
                        ledClasses += ' last-of-serie';

                let led = $('<div class="' + ledClasses + '"></div>');

                $('.led-simulator').append(led);
        }

        leds = $('.led');
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

// tmp
function onSocketUpdatePatrols(patrols)
{
        console.log(patrols);

        leds.removeClass('patrol-over');
        leds.removeClass('patrol-over-active');

        let patrolsPositions = [];

        /*if (patrols.mode == 'alert')
        {
                for (let i = 0; i < patrols.size; i++)
                {
                        let randomPos;
                        let incr = 0;

                        do
                        {
                                randomPos = Math.floor(Math.random() * NUM_LEDS);
                        }
                        while (patrolsPositions.includes(randomPos) && ++incr < 100);

                        patrolsPositions.push(randomPos);
                }
                console.log(patrolsPositions);
        }
        else
        {*/
                for (let i = patrols.pos ; i < patrols.pos + patrols.size; i++)
                        patrolsPositions.push(i);

                // let currentBox = Math.floor(patrols.pos / NUM_LEDS_PER_BOX);
                // leds.slice(currentBox * NUM_LEDS_PER_BOX, currentBox * NUM_LEDS_PER_BOX + NUM_LEDS_PER_BOX).addClass('patrol-over');
                // console.log(currentBox);
        //}

        leds.each(function(i)
        {
                if (patrolsPositions.includes(i))
                        $(this).addClass('patrol-over-active');
        });
}