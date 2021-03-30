const socket = io();
const peer = new Peer();
var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;

// An object where: key = peerId, value = mediaConnection
const peerCalls = {};
let myPeerId = '';
const peerInfo = {};
// Keyboard-control helper
let recognitionLocked = false;

// Copy Button
document.querySelector('#copy-btn').addEventListener('click', () => {
    let range = document.createRange();
    range.selectNode(document.querySelector("#room-link"));
    window.getSelection().removeAllRanges();    // clear current selection
    window.getSelection().addRange(range);      // to select text
    document.execCommand("copy");
    window.getSelection().removeAllRanges();    // to deselect
    // alert('Copied!');
})

// Text-to-speech 
let myVoice = undefined;
getVoicesPromise().then((voices) => {
    // console.log("Text-to-speech: Voices populated");
    populateVoiceList(voices);
});

document.querySelector('#voiceSelect').addEventListener('change', (event) => {
    let voices = speechSynthesis.getVoices();
    for (var i = 0; i < voices.length; i++) {
        if (voices[i].lang + voices[i].name === event.target.value) {
            myVoice = voices[i];
            break;
        }
    }
});

// Speech-to-text with Web Speech API
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = myLanguageCode;
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
    // console.log('Speech-to-text: Recognition starts');
    recognitionLocked = true;
    document.querySelector('#record').innerHTML = 'Recording...';
    document.querySelector('#record').classList.remove('btn-success');
    document.querySelector('#record').classList.add('btn-danger');
};

recognition.onend = () => {
    // console.log('Speech-to-text: Recognition ends');
    recognitionLocked = false;
    document.querySelector('#record').innerHTML = 'Start Speaking';
    document.querySelector('#record').classList.remove('btn-danger');
    document.querySelector('#record').classList.add('btn-success');
};

recognition.onresult = (event) => {
    let result = event.results[0][0].transcript;
    document.querySelector('#subtitle').textContent = result;
    if (event.results[0].isFinal) {
        const message = `${myUsername} (Original): ${result}`;
        appendMessage(message);
        socket.emit('send-message', myUsername, result, myLanguageCode);
    }
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

// Not used in this version b/c Web Speech API limitations, but definitely should try after deploying.
function restart(recognition) {
    recognition.stop();
    setTimeout(() => {
        recognition.start();
    }, 400);
}


// Peer.js & Video Initialization
peer.on('open', (peerId) => {
    socket.emit('join-room', roomId, myUsername, myLanguage, peerId);
    myPeerId = peerId;
});

const video = document.querySelector("#videoElement");

navigator.mediaDevices.getUserMedia({
    video: {
        width: 600,    // 16:9 / 3:2
        height: 400
    },
    audio: true
})
    .then(function (stream) {
        video.srcObject = stream;
        video.muted = true;

        socket.on('user-connected', (username, language, peerId) => {
            // console.log(`Socket.io: ${username} (peerId: ${peerId}) has joined the room`);
            appendMessage(`${username} joined the room!`, 'text-success');
            updatePeerInfo(username, language, peerId);
            socket.emit('send-info', myUsername, myLanguage, myPeerId);
            callNewUser(peerId, stream);
        });

        peer.on('call', (mediaConnection) => {
            mediaConnection.answer(stream);
            onStream(mediaConnection, mediaConnection.peer);
            onClose(mediaConnection, mediaConnection.peer);
            peerCalls[mediaConnection.peer] = mediaConnection;
        });
    })
    .catch(function (error) {
        console.log('getUserMedia: Failed to get local stream', error);
    })

socket.on('send-info', (username, language, peerId) => {
    updatePeerInfo(username, language, peerId);
})

socket.on('broadcast-message', async (username, message, fromLanguage) => {
    const msg = `${username} (Original): ${message}`;
    appendMessage(msg);
    const response = await fetch('/translate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'    // 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify({
            message, language: myLanguageCode, fromLanguage: fromLanguage
        }) // body data type must match "Content-Type" header
    });
    const result = await response.text();
    const msgTranslated = `${username} (Translated): ${result}`;
    appendMessage(msgTranslated);
    let utterThis = new SpeechSynthesisUtterance(result);
    utterThis.voice = myVoice;
    speechSynthesis.speak(utterThis);
})

socket.on('user-disconnected', (username, peerId) => {
    // console.log(`Socket.io: ${username} (peerId: ${peerId}) left.`)
    appendMessage(`${username} left.`, 'text-success');
    if (peerCalls[peerId])
        peerCalls[peerId].close();
});

function updatePeerInfo(username, language, peerId) {
    peerInfo[peerId] = {
        username,
        language
    };
}

function callNewUser(peerId, stream) {
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
        if (document.getElementById('video-list').childElementCount <= 2) {
            document.getElementById('waiting-for-user').setAttribute('style', 'display: flex');
        }
    });
}

function appendVideo(remoteStream, peerId) {
    document.getElementById('waiting-for-user').setAttribute('style', 'display: none');
    if (!document.getElementById(`col-${peerId}`)) {
        const column = document.createElement('div');
        column.setAttribute('class', 'col p-0')
        column.id = `col-${peerId}`;
        const card = document.createElement('div');
        card.setAttribute('class', 'card border-0');
        const titleOverlay = document.createElement('h6');
        titleOverlay.setAttribute('class', 'title-overlay card-title p-2');
        titleOverlay.innerHTML = `${peerInfo[peerId].username} - Speaks ${peerInfo[peerId].language}`;
        const overlay = document.createElement('div');
        overlay.setAttribute('class', 'card-img-overlay p-0');

        document.querySelector('#video-list').append(column);
        column.append(card);
        card.append(overlay);
        overlay.append(titleOverlay);
        card.append(createVideo(remoteStream, peerId));
    }
}

function createVideo(remoteStream) {
    const newVideo = document.createElement('video');
    newVideo.srcObject = remoteStream;
    newVideo.autoplay = true;
    return newVideo;
}

// Parameters: message: String, style: String
function appendMessage(message, style = undefined) {
    const messageBoard = document.querySelector('#message-board');
    const msg = document.createElement('p');
    msg.textContent = message;
    if (style)
        msg.setAttribute('class', style)
    messageBoard.append(msg);
    messageBoard.scrollTop = messageBoard.scrollHeight; // auto scroll
}

// Text-to-speech functions
function getVoicesPromise() {
    return new Promise((resolve, reject) => {
        let synth = window.speechSynthesis;
        let id;

        id = setInterval(() => {
            if (synth.getVoices().length !== 0) {
                resolve(synth.getVoices());
                clearInterval(id);
            }
        }, 10);
    });
};

function populateVoiceList(voices) {
    let langAssigned = false;
    for (var i = 0; i < voices.length; i++) {
        if (voices[i].lang.slice(0, 2) === myLanguageCode.slice(0, 2)) {
            if (!langAssigned) {
                myVoice = voices[i];
                langAssigned = true;
            }
            var option = document.createElement('option');
            option.textContent = voices[i].name + ' (' + voices[i].lang + ')';
            if (voices[i].default) {
                option.textContent += ' -- DEFAULT';
            }
            // different voices may share the same language code
            option.setAttribute('value', voices[i].lang + voices[i].name);
            document.querySelector('#voiceSelect').appendChild(option);
        }
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
            B first sends its information through socket event send-info to A (actually everyone in the room).
            B then starts a peer.call() to A: This is my video stream.
            After doing so, B waits for A's video stream - mediaConnection.on('stream').
            When A receives B's call, A answers the call with its video stream - mediaConnection.answer(stream).
            Finally, B receives A's video stream - mediaConnection.on('stream').

        *Firefox does not yet support mediaConnection.on('close').

    Peer.js mediaConnection.on('stream') gets called twice if the stream contains 2 tracks: audio and video.
    https://github.com/peers/peerjs/issues/609
*/