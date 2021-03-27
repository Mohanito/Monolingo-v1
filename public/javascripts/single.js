var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition

function getVoicesPromise() {
    return new Promise(
        function (resolve, reject) {
            let synth = window.speechSynthesis;
            let id;

            id = setInterval(() => {
                if (synth.getVoices().length !== 0) {
                    resolve(synth.getVoices());
                    clearInterval(id);
                }
            }, 10);
        }
    )
}

var recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = true;
recognition.maxAlternatives = 1;

let myVoice = undefined;
getVoicesPromise().then((voices) => {
    console.log("Voices populated");
    populateVoiceList(voices);
});

function populateVoiceList(voices) {
    let langAssigned = false;
    for (var i = 0; i < voices.length; i++) {
        if (voices[i].lang.slice(0, 2) === recognition.lang.slice(0, 2)) {
            if (!langAssigned) {
                myVoice = voices[i];
                langAssigned = true;
            }
            var option = document.createElement('option');
            option.textContent = voices[i].name + ' (' + voices[i].lang + ')';
            if (voices[i].default) {
                option.textContent += ' -- DEFAULT';
            }
            option.setAttribute('value', voices[i].lang);
            document.querySelector('#voiceSelect').appendChild(option);
        }
    }
}

document.querySelector('#voiceSelect').addEventListener('change', (event) => {
    console.log(event.target.value);
    voices = speechSynthesis.getVoices();
    for (var i = 0; i < voices.length; i++) {
        if (voices[i].lang === event.target.value) {
            myVoice = voices[i];
            break;
        }
    }
});


recognition.start();

recognition.onstart = () => {
    console.log('Recognition starts');
}
recognition.onresult = function (event) {
    var result = event.results[0][0].transcript;
    document.querySelector('#result').textContent = result;
    if (event.results[0].isFinal) {
        let utterThis = new SpeechSynthesisUtterance(result);
        utterThis.voice = myVoice;
        console.log(utterThis.voice);
        speechSynthesis.speak(utterThis);
    }
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
