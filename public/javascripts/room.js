const socket = io();
const peer = new Peer();

// An object where: key = peerId, value = mediaConnection
let peerCalls = {};

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
            onStream(mediaConnection);
            onClose(mediaConnection);
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
    onStream(mediaConnection);
    onClose(mediaConnection);
    peerCalls[peerId] = mediaConnection;
};

function onStream(mediaConnection) {
    mediaConnection.on('stream', (remoteStream) => {
        const video2 = document.querySelector("#videoElement2");
        video2.srcObject = remoteStream;
        // const user2 = document.querySelector("#user2");
        // user2.innerHTML = username;
    });
}

function onClose(mediaConnection) {
    mediaConnection.on('close', () => {
        document.querySelector("#user2").innerHTML = 'Disconnected';
        const video2 = document.querySelector("#videoElement2");
        // FIXME: video2 remove or change src after disconnection
    });
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
*/