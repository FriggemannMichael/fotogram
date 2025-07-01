/**
 * Background Slideshow
 * Features: Automatic cycling background images with smooth fade transitions
 * Changes background every 3 seconds using dual-layer technique for seamless transitions
 */

const backgroundImages = [
    'assets/img/norway2.jpg',
    'assets/img/iceland.jpg',
    'assets/img/iceland2.jpg',
    'assets/img/norway1.jpg',
    'assets/img/norway2.jpg',
    'assets/img/sweden2.jpg', 
    'assets/img/iceland2.jpg'
];

let currentImageIndex = 0;
let activeBackground = 0;

const backgrounds = document.querySelectorAll('.background-image');

function changeBackground() {
    const nextBackground = activeBackground === 0 ? 1 : 0;
    
    backgrounds[nextBackground].style.backgroundImage = `url('${backgroundImages[currentImageIndex]}')`;
    backgrounds[nextBackground].classList.add('active');
    
    setTimeout(() => {
        backgrounds[activeBackground].classList.remove('active');
        activeBackground = nextBackground;
    }, 50);
    
    currentImageIndex = (currentImageIndex + 1) % backgroundImages.length;
}

backgrounds[0].style.backgroundImage = `url('${backgroundImages[0]}')`;
backgrounds[0].classList.add('active');
currentImageIndex = 1;

setInterval(changeBackground, 3000);