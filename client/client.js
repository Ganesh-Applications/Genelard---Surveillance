var jbody = $('body');
var currentPage = 'home';
var currentInstructionsSlide = 0;
var numInstructionsSlides = $('#instructions .slides .slide').length;
var socket;

const MISSION_START_TIME = 30;
// const MISSION_START_TIME = 5;

const NUM_BOXES = 4; // tmp
const NUM_LEDS_PER_BOX = 10; // tmp
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
        socket.on('alert', onSocketAlert);
        socket.on('end_of_game', onEndOfGame);

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

       $('.hand-simulator .box').click(clickHandSimulator);
       $('.object-simulator .box').click(clickObjectSimulator);
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
        
        setTimeout(function()
        {
            $('#game').removeClass('ended');
        }, 1000);
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

function onSocketMissionComplete(mission)
{
    console.log('onSocketMissionComplete', mission);
        missionComplete(mission);
}

function onSocketMissionFailed()
{
        console.log('Mission failed');
        
        // $('body').attr('data-alert-level', 0);
        
        // gotoPage('end');
        
        // $('#game').addClass('ended');
        // $('#game').addClass('pre-end');
        $('body').addClass('alert2');
        
        setTimeout(function()
        {
            $('body').removeClass('alert alert2');
            $('#game').addClass('ended');
            
        }, 3000);
}

function onSocketAlert(alertLevel)
{
        console.log('onsocketalert', alertLevel);
        $('body').addClass('alert');
}

// tmp
function onSocketUpdatePatrols(patrols)
{
        // console.log(patrols);

        leds.removeClass('patrol-over');
        leds.removeClass('patrol-over-active');

        for (let i in patrols)
        {
                let color = patrols[i];
                color = toCssHex(color);
                leds.eq(i).css('background', color);
        }
}

function onEndOfGame(success)
{
        console.log('onEndOfGame');
    
        stopGame();
        
        $('#game').addClass('ended');
        
        if (success)
            $('#game').addClass('success');
        else
            $('#game').addClass('failure');
}

function clickHandSimulator()
{
        let index = $(this).index();
        $(this).toggleClass('inside');
        let isInside = $(this).hasClass('inside');
        socket.emit('hand_in_box', index, isInside);
}

function clickObjectSimulator()
{
        let index = $(this).index();
        $(this).toggleClass('inside');
        let isInside = $(this).hasClass('inside');
        socket.emit('object_in_box', index, isInside);
}

/*
 * Pour le simulateur de leds
 */
function toCssHex(color) {
        let r = (color >>> 24) & 0xFF;
        let g = (color >>> 16) & 0xFF;
        let b = (color >>> 8)  & 0xFF;
        
        return `#${r.toString(16).padStart(2, '0')}`
                + `${g.toString(16).padStart(2, '0')}`
                + `${b.toString(16).padStart(2, '0')}`;
}
