const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/room', (req, res) => {
    res.render('room');
});

app.listen('3000', () => {
    console.log('Listening on port 3000...')
});
