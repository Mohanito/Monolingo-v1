document.querySelector('#join-room').addEventListener('click', () => {
    if (document.querySelector('#room-id').value) {
        window.location.href = `/room/${document.querySelector('#room-id').value}`;
    }
});