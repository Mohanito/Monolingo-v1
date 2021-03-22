const socket = io();
const peer = new Peer();
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;

// An object where: key = peerId, value = mediaConnection
const peerCalls = {};
// Keyboard-control helper
let recognitionLocked = false; 

// Speech-to-text with Web Speech API
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = 'zh';
recognition.interimResults = true;
recognition.maxAlternatives = 1;

window.addEventListener("keydown", function (event) {
    if (!recognitionLocked && event.code == 'Space') 
        recognition.start();
}, true)

document.querySelector('#record').addEventListener('click', () => {
    if (!recognitionLocked) 
        recognition.start();
})

recognition.onstart = () => {
    console.log('Web Speech API: Recognition starts');
    recognitionLocked = true;
    document.querySelector('#record').innerHTML = 'Recording...';
    document.querySelector('#record').classList.remove('btn-success');
    document.querySelector('#record').classList.add('btn-danger');
};

recognition.onend = () => {
    console.log('Web Speech API: Recognition ends');
    recognitionLocked = false;
    document.querySelector('#record').innerHTML = 'Start Speaking';
    document.querySelector('#record').classList.remove('btn-danger');
    document.querySelector('#record').classList.add('btn-success');
};

recognition.onresult = (event) => {
    let result = event.results[0][0].transcript;
    document.querySelector('#subtitle').textContent = result;
}

recognition.onnomatch = () => {
    document.querySelector('#subtitle').textContent = 'Speech not recognized';
}

recognition.onspeechend = () => {
    recognition.stop();
}

recognition.onerror = (event) => {
    document.querySelector('#subtitle').textContent =
        event.error == 'no-speech' ? 'No speech detected' : 'Error occurred in recognition: ' + event.error;
    recognition.stop();
}

// Not used in this design b/c client-side bugs, but definitely should try after deploying.
function restart(recognition) {
    recognition.stop();
    setTimeout(() => {
        recognition.start();
    }, 400);
}


// Peer.js & Video Initialization
peer.on('open', (peerId) => {
    socket.emit('join-room', roomId, username, peerId);
});

const video = document.querySelector("#videoElement");

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(function (stream) {
        video.srcObject = stream;
        video.muted = true;

        socket.on('user-connected', (username, peerId) => {
            console.log(`${username} (peerId: ${peerId}) has joined the room`);
            callNewUser(username, peerId, stream);
        });

        peer.on('call', (mediaConnection) => {
            mediaConnection.answer(stream);
            onStream(mediaConnection, mediaConnection.peer);
            onClose(mediaConnection, mediaConnection.peer);
            peerCalls[mediaConnection.peer] = mediaConnection;
        });
    })
    .catch(function (error) {
        console.log('Failed to get local stream', error);
    })

socket.on('user-disconnected', (username, peerId) => {
    console.log(`Socket.io: ${username} (peerId: ${peerId}) left.`)
    if (peerCalls[peerId])
        peerCalls[peerId].close();
});

function callNewUser(username, peerId, stream) {
    const mediaConnection = peer.call(peerId, stream);
    onStream(mediaConnection, peerId);
    onClose(mediaConnection, peerId);
    peerCalls[peerId] = mediaConnection;
};

function onStream(mediaConnection, peerId) {
    mediaConnection.on('stream', (remoteStream) => {
        appendVideo(remoteStream, peerId);
    });
}

function onClose(mediaConnection, peerId) {
    mediaConnection.on('close', () => {
        document.getElementById(`col-${peerId}`).remove();
    });
}

function appendVideo(remoteStream, peerId) {
    if (!document.getElementById(`video-${peerId}`)) {
        const column = document.createElement('div');
        column.setAttribute('class', 'col')
        column.id = `col-${peerId}`;
        const card = document.createElement('div');
        card.setAttribute('class', 'card mx-auto bg-dark');
        card.setAttribute('style', 'width: 348px');
        const newVideo = document.createElement('video');
        newVideo.srcObject = remoteStream;
        newVideo.autoplay = true;
        newVideo.id = `video-${peerId}`;
        newVideo.width = '348';
        newVideo.height = '261';
        const overlay = document.createElement('div');
        overlay.setAttribute('class', 'card-img-overlay');
        const overlayText = document.createElement('h6');
        overlayText.setAttribute('class', 'card-title text-white');
        overlayText.innerHTML = 'Random User';
        overlay.append(overlayText);
        const videoList = document.querySelector('#video-list');
        videoList.append(column);
        column.append(card);
        card.append(newVideo);
        card.append(overlay);
    }
}


/*
    Peer.js & Socket.io Logic:
        (1) When the first user joins the room:
            It emits 'join-room' event to server, where socket joins the channel specified by roomId.
            The socket then emits 'user-connected' to everyone in the channel (in this case, no one).

        (2) When a new user A joins the room:
            It emits 'join-room' event to server, where socket joins the channel specified by roomId.
            The socket then emits 'user-connected' to everyone in the channel.
            In this case, everyone in the room channel should receive the 'user-connected' emitted by socket A.
            Let B denote one of such user.
            B then starts a peer.call() to A: This is my video stream.
            After doing so, B waits for A's video stream - mediaConnection.on('stream').
            When A receives B's call, A answers the call with its video stream - mediaConnection.answer(stream).
            Finally, B receives A's video stream - mediaConnection.on('stream').

        *Firefox does not yet support mediaConnection.on('close').

    Peer.js mediaConnection.on('stream') gets called twice if the stream contains 2 tracks: audio and video.
    https://github.com/peers/peerjs/issues/609
*/