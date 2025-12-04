var socket;

$('.btn-activate-leds').click(clickActivateLeds);

setupIO();

function setupIO()
{
    socket = io();
    socket.on('esp_status', onEspStatus);
    socket.on('box_update_data', onBoxUpdateData);
}

function onEspStatus(data)
{
    let esp = $('.esp[data-id="' + data.id + '"]');
    esp.find('.esp-status').attr('data-status', data.status);
    
}

function onBoxUpdateData(data)
{
    console.log('onBoxUpdateData', data);
    
    let esp = $('.esp[data-id="' + data.id + '"]');
    let boxData = data.data;
    
    esp.find('.sensor.front .sensor-value').val(
        boxData.front_sensor_value
    );
    
    esp.find('.sensor.back .sensor-value').val(
        boxData.back_sensor_value
    );
    
    esp.find('.sensor.rfid .sensor-value').val(
        boxData.rfid_sensor_value
    );
}

function clickActivateLeds()
{
    console.log('testActivateLeds');
    socket.emit('activate_leds');
}