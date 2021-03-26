const dice = document.querySelector('#dice');
const adjs = ['Grumpy', 'Old', 'Angry', 'Silent'];
const animals = ['Cat', 'Dog', 'Duck', 'Chicken'];

dice.addEventListener('click', (event) => {
    event.preventDefault();
    const username = document.querySelector('#username');
    const adj = adjs[Math.floor(Math.random() * adjs.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    username.value = adj + ' ' + animal;
})