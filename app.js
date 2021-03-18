const express = require('express');
const app = express();

// External JS Libraries
const { v4: uuid } = require('uuid');
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Application settings
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
// Specifies the root directory from which to serve static assets
app.use(express.static('public'));
// Built-in middleware that parses incoming requests with urlencoded payloads
app.use(express.urlencoded({ extended: true }));




// Socket.io
io.on('connection', (socket) => {
    console.log('Socket.io: A user connected');
    socket.on('join-room', (roomId, username, peerId) => {
        // A room is an arbitrary channel that sockets can join and leave. In this case, channel name = roomId
        socket.join(roomId);
        console.log(`Socket.io: ${username} (peerId: ${peerId}) joined room ${roomId}`);
        socket.to(roomId).emit('user-connected', username, peerId, roomId); // broadcast

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', username, peerId);
        })
    })
})


app.get('/', (req, res) => {
    res.render('home');
});

// Single-user testing
app.get('/single', (req, res) => {
    res.render('single');
})

// From 'Create a Room' button
// Generate roomId; Pass username (in query) and roomId to chatroom middleware.
app.post('/room/new', (req, res) => {
    const { username } = req.body;
    const roomId = uuid();
    res.redirect(`/room/${roomId}?username=${username}`);
})

// Renders chatroom view
app.get('/room/:roomId', (req, res) => {
    const { roomId } = req.params;
    const username = req.query.username || 'Anonymous User';
    res.render('room', { roomId, username });
});

server.listen('3000', () => {
    console.log('Listening on port 3000...')
});
