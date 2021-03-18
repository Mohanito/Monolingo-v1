const express = require('express');
const app = express();

// External JS Libraries
const { v4: uuid } = require('uuid');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
// Specifies the root directory from which to serve static assets
app.use(express.static('public'));
// Built-in middleware that parses incoming requests with urlencoded payloads
app.use(express.urlencoded({ extended: true }));





app.get('/', (req, res) => {
    res.render('home');
});

app.post('/room/new', (req, res) => {
    const { username } = req.body;
    console.log(username);
    const roomId = uuid();
    res.redirect(`/room/${roomId}?username=${username}`);
})

app.get('/room/:roomId', (req, res) => {
    const { roomId } = req.params;
    const { username } = req.query;
    res.render('room', { roomId, username });
});

app.listen('3000', () => {
    console.log('Listening on port 3000...')
});
