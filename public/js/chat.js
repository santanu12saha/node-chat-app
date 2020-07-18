var socket = io();
var params = null;
let answersFrom = {};
let getCalled = false;

const existingCalls = [];

var sessionDescription = window.RTCSessionDescription ||
    window.mozRTCSessionDescription ||
    window.webkitRTCSessionDescription ||
    window.msRTCSessionDescription;

var pc = window.RTCPeerConnection ||
    window.mozRTCPeerConnection ||
    window.webkitRTCPeerConnection ||
    window.msRTCPeerConnection;

    navigator.getUserMedia  = navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia ||
    navigator.msGetUserMedia;    

const peerConnection = new pc();

var modalTemplate = jQuery('#modal-popup').html();
var modalHtml = Mustache.render(modalTemplate, {
    title: 'Available users in room'
});
jQuery('#modal-user-list').html(modalHtml);

function scrollToBottom () {
    //Selectors
    var messages = jQuery('#messages');
    var newMessages = messages.children('li:last-child');
    //Heights
    var clientHeight = messages.prop('clientHeight');
    var scrollTop = messages.prop('scrollTop');
    var scrollHeight = messages.prop('scrollHeight');
    var newMessageHeight = newMessages.innerHeight();
    var lastMessageHeight = newMessages.prev().innerHeight();
    
    if(clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight){
        messages.scrollTop(scrollHeight);
    }
}

socket.on('connect', function () {
    params = jQuery.deparam(window.location.search);

    socket.emit('join', params, function(err) {
        if (err) {
            alert(err);
            window.location.href = '/';
        }else{
            console.log('No error');
        }
    });
});

socket.on('updateUserList', function (users) {
    var template = jQuery('#user-list-template').html();
    var html = Mustache.render(template, {users});

    jQuery('#users').html(html);

    var filterUser = users.filter((v) => v !== params.name);
    var template = jQuery('#user-modal-list-template').html();
    var html = Mustache.render(template, {"users": filterUser});

    jQuery('.modal-content').html(html);
});

socket.on('updateRoomList', function (rooms) {
    console.log(rooms);
});

socket.on('disconnect', function () {
    console.log('Disconnected from server');
});

socket.on('newMessage', function (message) {
    var formattedTime = moment(message.createdAt).format('h:mm a');
    var template = jQuery('#message-template').html();
    var html = Mustache.render(template, {
        text: message.text,
        from: message.from,
        createdAt: formattedTime
    });

    jQuery('#messages').append(html);
    scrollToBottom();
});

socket.on('newLocationMessage', function (message) {
    var formattedTime = moment(message.createdAt).format('h:mm a');
    var template = jQuery('#location-message-template').html();
    var html = Mustache.render(template, {
        from: message.from,
        url: message.url,
        createdAt: formattedTime
    });

    jQuery('#messages').append(html);
    scrollToBottom();
});

jQuery('[name=message]').keydown(function (e) {
    socket.emit('typing', true);
   
});

jQuery('[name=message]').keyup(function (e) {
    if(e.target.value.length == 0){
        socket.emit('typing', false); 
    }
});

jQuery('#message-form').on('submit', function (e) {
    e.preventDefault();

    var messageTextbox = jQuery('[name=message]');
    
    socket.emit('createMessage', {
        text: messageTextbox.val()
    }, function () {
        messageTextbox.val('');
        socket.emit('typing', false); 
    });
});

socket.on('displayTypingName', function(data) {
    jQuery('#typing').text(data);
});

var locationButton = jQuery('#send-location');
locationButton.on('click', function () {
    if(!navigator.geolocation){
        return alert('Geolocation not supported by your browser.');
    }

    locationButton.attr('disabled', 'disabled').text('Sending location...');

    navigator.geolocation.getCurrentPosition(function (position) {
        locationButton.removeAttr('disabled').text('Send location');
        socket.emit('createLocationMessage', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        });
    }, function () {
        locationButton.removeAttr('disabled').text('Send location');
        alert('Unable to fetch the location.')
    });
});


var call = jQuery('#call');

call.on('click', function () {
    $('#call-modal').toggleClass('is-visible');
    $('.modal').toggleClass('is-visible');
         
});

$('.modal-toggle').on('click', function(e) {
    e.preventDefault();
    $('#call-modal').toggleClass('is-visible');
    $('.modal').toggleClass('is-visible');
}); 

var videoCall = jQuery('#video-call');
videoCall.on('click', function () {
    var selectedUser = null;
    $.each($("input[name='users']:checked"), function(){
        selectedUser = $(this).val();
    });

    var callModalTemplate = jQuery('#video-modal-template').html();
    var html = Mustache.render(callModalTemplate, {
        user: selectedUser
    });
    jQuery('#modal-call-progress').html(html);
    $('#call-modal').toggleClass('is-visible');
    $('.video-modal-toggle').on('click', function(e) {
        e.preventDefault();
        $('#call-modal').toggleClass('is-visible');
    });
    invokeUserMedia("video");
    callUser(selectedUser);
    
});

function ScaleContentToDevice() {
    scroll(0, 0);
    var viewportHeight = $(window).height();
    var content = $("#contDiv");
    var contentMargins = content.outerHeight() - content.height();
    var contentheight = viewportHeight - contentMargins;
    content.height(contentheight);
};

$(document).on("pageshow", function () {
    ScaleContentToDevice();
});
$(window).on('resize orientationchange', function () {
    ScaleContentToDevice()
});

$(document).on('click', 'input[type="checkbox"]', function() {      
    $('input[type="checkbox"]').not(this).prop('checked', false);      
});

function invokeUserMedia(mediaType) {
    var mediaConstraintObject = null;
    switch(mediaType){
        case "video" :
            mediaConstraintObject = { video: true, audio: true };
            break;
        case "audio" :
            mediaConstraintObject = { video: false, audio: true };
            break;
        default: 
            break;    
    }

    navigator.getUserMedia(mediaConstraintObject, function(stream) {
        const localVideo = document.getElementById("local-video");
        if (localVideo) {
            localVideo.srcObject = stream;
        }
        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        $('.video-modal-toggle').on('click', function(e) {
            e.preventDefault();
           // stream.getTracks().forEach(function(track) { track.stop(); })
            getCalled = false;
        });
    
    }, function(error) {
        console.warn(error.message);
    })
    
}

function callUser(name) {
    peerConnection.createOffer(function (offer) {
        peerConnection.setLocalDescription(new sessionDescription(offer), function () {
            socket.emit("call-user", {
                offer,
                to: name
            });
        }, error);
    }, error);
}

socket.on("call-made", data => {
    if (getCalled) {
      const confirmed = confirm(
        `User ${data.name} wants to call you. Do accept this call?`
      );
  
      if (!confirmed) {
        socket.emit("reject-call", {
          from: data.socket
        });
  
        return;
      }
    }
  
    console.log(data);
    peerConnection.setRemoteDescription(new sessionDescription(data.offer), function () {
        peerConnection.createAnswer(function (answer) {
            peerConnection.setLocalDescription(new sessionDescription(answer), function () {
                socket.emit("make-answer", {
                    answer,
                    to: data.socket
                  });
            }, error);
        }, error);
    }, error);
    getCalled = true;
  });

  socket.on("answer-made", data => {
    peerConnection.setRemoteDescription(new sessionDescription(data.answer), function () {
        if (!answersFrom[data.socket]) {
            callUser(data.socket);
            answersFrom[data.socket] = true;
        }
    }, error);
  });

  socket.on("call-rejected", data => {
    alert(`User ${data.name} rejected your call.`);
  });

  peerConnection.ontrack = function({ streams: [stream] }) {
    const remoteVideo = document.getElementById("remote-video");
    if (remoteVideo) {
      remoteVideo.srcObject = stream;
    }
  };

function error(err) {
    console.warn('Error', err);
}
 

