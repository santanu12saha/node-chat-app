 
(function() {
    $.getJSON("./rooms-data.json", function( data ) {
        var template = jQuery('#room-list-template').html();
        var html = Mustache.render(template, {data});

        jQuery('#room-list').html(html);
    });
})();

function _selectRoom() {
    $('input[name="room"]').val($("#chat__available__rooms option:selected").text());
}