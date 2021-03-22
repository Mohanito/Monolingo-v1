var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition

var recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = true;
recognition.maxAlternatives = 1;

recognition.start();

recognition.onstart = () => {
    console.log('Recognition starts');
}
recognition.onresult = function (event) {
    var color = event.results[0][0].transcript;
    document.querySelector('#result').textContent = color;    // text content
    console.log('Confidence: ' + event.results[0][0].confidence);
}

recognition.onspeechend = function () {
    console.log('on speech end');
    recognition.stop();
    setTimeout(() => {
        recognition.start();
    }, 400);
}

recognition.onerror = function (event) {
    document.querySelector('#result').textContent = 'Error occurred in recognition: ' + event.error;
    recognition.stop();
    setTimeout(() => {
        recognition.start();
    }, 400);
}

const video = document.querySelector("#videoElement");

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(function (stream) {
        video.srcObject = stream;
        video.muted = true;
    })
    .catch(function (error) {
        console.log('Failed to get local stream', error);
    })
