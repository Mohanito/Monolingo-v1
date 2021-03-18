const video = document.querySelector("#videoElement");

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(function (stream) {
        video.srcObject = stream;
        video.muted = true;
    })
    .catch(function (error) {
        console.log('Failed to get local stream', error);
    })