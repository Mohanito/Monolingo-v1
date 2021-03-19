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
*/


// socket.io and peer.js initialization
const socket = io();
const peer = new Peer();
// Emitted when a connection to the PeerServer is established.
peer.on('open', (peerId) => {
    socket.emit('join-room', roomId, username, peerId);
});

// An object where: key = peerId, value = mediaConnection(call)
let peerCalls = {};
// peer.call() if new user joins
const callNewUser = (username, peerId, stream) => {
    const mediaConnection = peer.call(peerId, stream);

    mediaConnection.on('stream', (remoteStream) => {
        // Show stream in some <video> element.
        const video2 = document.querySelector("#videoElement2");
        video2.srcObject = remoteStream;
        const user2 = document.querySelector("#user2");
        user2.innerHTML = username;
    });

    // Emitted when either you or the remote peer closes the media connection.
    // *Firefox does not yet support this event.
    mediaConnection.on('close', () => {
        console.log('a user disconnected!')
        const video2 = document.querySelector("#videoElement2");
        // video2.remove();
        // video2.srcObject = '';
        const user2 = document.querySelector("#user2");
        user2.innerHTML = 'Disconnected';
    });

    peerCalls[peerId] = mediaConnection;
};

socket.on('user-disconnected', (username, peerId) => {
    console.log(`Socket.io: ${username} (peerId: ${peerId}) left.`)
    if (peerCalls[peerId])
        peerCalls[peerId].close();
});

// Current User Video Initialization
const video = document.querySelector("#videoElement");

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(function (stream) {
        video.srcObject = stream;
        video.muted = true;

        // If a user joins the room that we are already in,
        // then we should peer.call() the new user with our video stream data
        socket.on('user-connected', (username, peerId) => {
            console.log(`${username} (peerId: ${peerId}) has joined the room`);
            callNewUser(username, peerId, stream);
        });

        // Emitted when a remote peer attempts to call you.
        peer.on('call', (mediaConnection) => {
            mediaConnection.answer(stream);
            mediaConnection.on('stream', (remoteStream) => {
                // Show stream in some <video> element.
                const video2 = document.querySelector("#videoElement2");
                video2.srcObject = remoteStream;
            });

            peerCalls[mediaConnection.peer] = mediaConnection;

            // Emitted when either you or the remote peer closes the media connection.
            // *Firefox does not yet support this event.
            mediaConnection.on('close', () => {
                console.log('a user disconnected!')
                const video2 = document.querySelector("#videoElement2");
                // video2.remove();
                // video2.srcObject = '';
                const user2 = document.querySelector("#user2");
                user2.innerHTML = 'Disconnected';
            });

        })

    })
    .catch(function (error) {
        console.log('Failed to get local stream', error);
    })