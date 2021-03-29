const dice = document.querySelector('#dice');

// Google Search adjectives for personality
const adjs = ['Ambitious', 'Sincere', 'Responsible', 'Sophisticated', 'Outspoken', 'Considerate', 'Modest', 'Eloquent', 
    'Energetic', 'Thoughtful', 'Obliging', 'Sociable', 'Assertive', 'Attentive', 'Outgoing', 'Pleasant', 'Gentle', 
    'Courteous', 'Punctual', 'Trustworthy', 'Cheerful', 'Easy-going', 'Well-behaved', 'Calm'];

// https://list25.com/25-most-popular-animals-on-google-search/
const animals = ['Dog', 'Cat', 'Horse', 'Chicken', 'Fish', 'Bear', 'Bird', 'Shark', 'Snake', 'Pig', 'Lion', 'Turkey',
    'Wolf', 'Spider', 'Rabbit', 'Duck', 'Deer', 'Cow', 'Monkey', 'Lobster', 'Ape', 'Pony', 'Eagle', 'Dolphin', 'Bison'];

dice.addEventListener('click', (event) => {
    event.preventDefault();
    const username = document.querySelector('#username');
    const adj = adjs[Math.floor(Math.random() * adjs.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    username.value = adj + ' ' + animal;
})