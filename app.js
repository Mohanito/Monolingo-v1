const express = require('express');
const app = express();

// External JS Libraries
const { v4: uuid } = require('uuid');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const translate = require('translate');
translate.engine = 'libre';

// Helper Scripts
const { codeToLanguage, languageToCode } = require('./languages')

// Application settings
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
// Specifies the root directory from which to serve static assets
app.use(express.static('public'));
// Built-in middleware that parses incoming requests with urlencoded payloads
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Socket.io
io.on('connection', (socket) => {
    // console.log('Socket.io: New user connection');
    socket.on('join-room', (roomId, username, language, peerId) => {
        // A room is an arbitrary channel that sockets can join and leave. In this case, channel name = roomId
        socket.join(roomId);
        // console.log(`Socket.io: ${username} (peerId: ${peerId}) joined room ${roomId}`);
        socket.to(roomId).emit('user-connected', username, language, peerId, roomId); // broadcast

        socket.on('send-info', (username, language, peerId) => {
            socket.to(roomId).emit('send-info', username, language, peerId);
        });

        socket.on('send-message', (username, message, language) => {
            socket.to(roomId).emit('broadcast-message', username, message, language);
        });

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', username, peerId);
        })
    })
})


app.get('/', (req, res) => {
    res.render('home');
});

// Create Room
app.get('/room/new', (req, res) => {
    const roomId = uuid();
    res.redirect(`/join/${roomId}`);
})

app.get('/join/:roomId', (req, res) => {
    const { roomId } = req.params;
    res.render('join', { roomId });
})

app.post('/join/:roomId', (req, res) => {
    const { roomId } = req.params;
    const { username, language } = req.body;
    res.redirect(`/room/${roomId}?username=${username}&language=${language}`);
})

// Renders chatroom view
app.get('/room/:roomId', (req, res) => {
    const { roomId } = req.params;
    if (!req.query.username || !req.query.language) {
        res.redirect(`/join/${roomId}`);
    }
    else {
        const username = req.query.username || 'Anonymous User';
        const languageCode = req.query.language || 'en';
        const language = codeToLanguage[languageCode];
        res.render('room', { roomId, username, language, languageCode });
    }
});

app.post('/translate', async (req, res) => {
    const { message, language, fromLanguage } = req.body;
    // slice for zh-Hans & zh-Hant
    const text = await translate(message, {
        from: fromLanguage.slice(0, 2), to: language.slice(0, 2)
    });
    res.send(text);
})

// Error Handling
app.all('*', (req, res) => {
    res.status(400).render('error');
})

server.listen(process.env.PORT || '3000', () => {
    console.log('Listening on process.env.PORT || 3000')
});
