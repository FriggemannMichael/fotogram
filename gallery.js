/**
 * Gallery Application - ARIA Optimized & CSS Classes Refactored
 * Features: Dynamic image gallery with lightbox, background slideshow, keyboard/touch navigation
 * Accessibility: Full ARIA support, screen reader announcements, keyboard navigation
 * Performance: Replaced inline styles with CSS classes for better performance and maintainability
 * Background: Hybrid approach - CSS classes for states, inline backgroundImage for dynamic content
 */

let galleryData = null;
let currentCountry = "";
let currentImageIndex = 0;
let backgroundInterval;
let currentBackgroundIndex = 0;
let activeBackground = 0;

const CSS_CLASSES = {
  LIGHTBOX_IMG_HIDDEN: 'lightbox-img--hidden',
  LIGHTBOX_IMG_VISIBLE: 'lightbox-img--visible',
  LIGHTBOX_IMG_LOADING: 'lightbox-img--loading',
  BODY_NO_SCROLL: 'body--no-scroll',
  BACKGROUND_ACTIVE: 'active',
  GALLERY_LOADING: 'gallery-loading',
  GALLERY_LOADED: 'gallery-loaded',
  LIGHTBOX_ACTIVE: 'active',
  LIGHTBOX_HIDDEN: 'lightbox--hidden',
  LIGHTBOX_VISIBLE: 'lightbox--visible',
  FADE_IN: 'fade-in',
  FADE_OUT: 'fade-out',
  SLIDE_IN_UP: 'slide-in-up',
  SLIDE_OUT_DOWN: 'slide-out-down'
};

function createGalleryItem(image, index, totalImages, options = {}) {
  const { itemClass = 'gallery-item', lightboxFunction = 'openLightbox', keydownFunction = 'handleGalleryItemKeydown' } = options;
  
  return `
    <div 
      class="${itemClass}" 
      onclick="${lightboxFunction}(${index})"
      onkeydown="${keydownFunction}(event, ${index})"
      role="button"
      tabindex="0"
      aria-label="Bild ${index + 1} von ${totalImages}: ${image.title} - Klicken zum Vergrößern"
    >
      <img src="${image.src}" alt="${image.title} - ${image.description}" role="img" />
    </div>
  `;
}

function generateGalleryHTML(images, options = {}) {
  return images.map((image, index) => 
    createGalleryItem(image, index, images.length, options)
  ).join('');
}

function applyLoadingState(container) {
  container.classList.add(CSS_CLASSES.GALLERY_LOADING);
}

function applyLoadedState(container) {
  container.classList.remove(CSS_CLASSES.GALLERY_LOADING);
  container.classList.add(CSS_CLASSES.GALLERY_LOADED, CSS_CLASSES.FADE_IN);
}

function renderGallery(images, containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container mit ID "${containerId}" nicht gefunden`);
    return;
  }
  
  applyLoadingState(container);
  container.innerHTML = generateGalleryHTML(images, options);
  setTimeout(() => applyLoadedState(container), 100);
}

function announceToScreenReader(message) {
  const announcer = document.getElementById('sr-announcements');
  if (!announcer) return;
  
  announcer.textContent = message;
  setTimeout(() => announcer.textContent = '', 1000);
}

async function loadGalleryData() {
  try {
    const response = await fetch("./gallerydata/gallerydata.json");
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    galleryData = await response.json();
    console.log("Gallery data loaded successfully");
    announceToScreenReader("Galerie-Daten erfolgreich geladen");
  } catch (error) {
    console.error("Fehler beim Laden der Gallery-Daten:", error);
    announceToScreenReader("Fehler beim Laden der Galerie-Daten");
  }
}

function validateBackgroundData(country, backgrounds, images) {
  if (!galleryData || !galleryData[country]) {
    console.error("Gallery data not loaded or country not found:", country);
    return false;
  }
  if (!images || images.length === 0) {
    console.error("No background images found for", country);
    return false;
  }
  if (backgrounds.length === 0) {
    console.error("No .background-image elements found in DOM");
    return false;
  }
  return true;
}

function setInitialBackground(backgrounds, images) {
  backgrounds[0].style.backgroundImage = `url('${images[0]}')`;
  backgrounds[0].classList.add(CSS_CLASSES.BACKGROUND_ACTIVE);
  currentBackgroundIndex = 1;
}

function createBackgroundInterval(backgrounds, images) {
  return setInterval(() => {
    const next = 1 - activeBackground;
    backgrounds[next].style.backgroundImage = `url('${images[currentBackgroundIndex]}')`;
    backgrounds[next].classList.add(CSS_CLASSES.BACKGROUND_ACTIVE);
    
    setTimeout(() => {
      backgrounds[activeBackground].classList.remove(CSS_CLASSES.BACKGROUND_ACTIVE);
      activeBackground = next;
    }, 50);
    
    currentBackgroundIndex = (currentBackgroundIndex + 1) % images.length;
  }, 3000);
}

function initBackground(country) {
  const backgrounds = document.querySelectorAll(".background-image");
  const images = galleryData[country].backgrounds;
  
  if (!validateBackgroundData(country, backgrounds, images)) return;
  
  if (backgroundInterval) clearInterval(backgroundInterval);
  
  setInitialBackground(backgrounds, images);
  backgroundInterval = createBackgroundInterval(backgrounds, images);
}

async function initGallery(country) {
  if (!galleryData) await loadGalleryData();
  
  if (!galleryData || !galleryData[country]) {
    console.error("Country data not found:", country);
    announceToScreenReader(`Galerie für ${country} konnte nicht geladen werden`);
    return;
  }

  currentCountry = country;
  const images = galleryData[country].images;
  
  renderGallery(images, "gallery");
  initBackground(country);
  announceToScreenReader(`${images.length} Bilder für ${country} geladen. Verwenden Sie Tab um durch die Bilder zu navigieren.`);
}

function handleGalleryItemKeydown(event, index) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openLightbox(index);
  }
}

function setupLightboxUI(lightbox, currentImage) {
  lightbox.setAttribute('aria-hidden', 'false');
  updateLightboxContent(currentImage);
  lightbox.classList.add(CSS_CLASSES.LIGHTBOX_ACTIVE);
}

function setupLightboxEvents(lightbox) {
  document.addEventListener("keydown", handleKeyPress);
  setTimeout(() => lightbox.addEventListener("click", handleLightboxClick), 100);
}

function openLightbox(index) {
  if (!galleryData || !galleryData[currentCountry]) {
    console.error("Gallery data not available");
    return;
  }

  currentImageIndex = index;
  const lightbox = document.getElementById("lightbox");
  const images = galleryData[currentCountry].images;
  const currentImage = images[index];

  setupLightboxUI(lightbox, currentImage);
  setTimeout(() => lightbox.focus(), 100);
  setupLightboxEvents(lightbox);
  document.body.classList.add(CSS_CLASSES.BODY_NO_SCROLL);
  announceToScreenReader(`Lightbox geöffnet. Bild ${index + 1} von ${images.length}: ${currentImage.title}. Drücken Sie Escape zum Schließen, Pfeiltasten zur Navigation.`);
}

function cleanupLightboxEvents(lightbox) {
  document.removeEventListener("keydown", handleKeyPress);
  lightbox.removeEventListener("click", handleLightboxClick);
}

function restoreFocusToGallery() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  if (galleryItems[currentImageIndex]) {
    galleryItems[currentImageIndex].focus();
  }
}

function closeLightbox() {
  const lightbox = document.getElementById("lightbox");
  
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.classList.remove(CSS_CLASSES.LIGHTBOX_ACTIVE);
  cleanupLightboxEvents(lightbox);
  document.body.classList.remove(CSS_CLASSES.BODY_NO_SCROLL);
  restoreFocusToGallery();
  announceToScreenReader("Lightbox geschlossen. Zurück zur Galerie.");
}

function handleLightboxClick(e) {
  const lightbox = document.getElementById("lightbox");
  if (e.target === lightbox) closeLightbox();
}

function calculateNewImageIndex(direction, currentIndex, totalImages) {
  let newIndex = currentIndex + direction;
  if (newIndex >= totalImages) return 0;
  if (newIndex < 0) return totalImages - 1;
  return newIndex;
}

function navigateLightbox(direction) {
  if (!galleryData || !galleryData[currentCountry]) return;

  const images = galleryData[currentCountry].images;
  currentImageIndex = calculateNewImageIndex(direction, currentImageIndex, images.length);
  
  updateLightboxContent(images[currentImageIndex]);
  
  const currentImage = images[currentImageIndex];
  const directionText = direction > 0 ? "Nächstes" : "Vorheriges";
  announceToScreenReader(`${directionText} Bild: ${currentImage.title}. Bild ${currentImageIndex + 1} von ${images.length}.`);
}

function applyImageTransition(img, hidden) {
  if (hidden) {
    img.classList.add(CSS_CLASSES.LIGHTBOX_IMG_HIDDEN);
    img.classList.remove(CSS_CLASSES.LIGHTBOX_IMG_VISIBLE);
  } else {
    img.classList.remove(CSS_CLASSES.LIGHTBOX_IMG_HIDDEN);
    img.classList.add(CSS_CLASSES.LIGHTBOX_IMG_VISIBLE);
  }
}

function updateImageContent(img, title, description, image) {
  img.src = image.src;
  img.alt = `${image.title} - ${image.description}`;
  title.textContent = image.title;
  description.textContent = image.description;
  img.setAttribute('aria-describedby', 'lightbox-description');
}

function updateLightboxContent(image) {
  const img = document.getElementById("lightbox-img");
  const title = document.getElementById("lightbox-title");
  const description = document.getElementById("lightbox-description");

  applyImageTransition(img, true);
  setTimeout(() => {
    updateImageContent(img, title, description, image);
    applyImageTransition(img, false);
  }, 150);
}

function handleEscapeKey() {
  closeLightbox();
}

function handleArrowKey(direction) {
  navigateLightbox(direction);
}

function handleHomeKey() {
  currentImageIndex = 0;
  updateLightboxContent(galleryData[currentCountry].images[0]);
  announceToScreenReader("Erstes Bild der Galerie");
}

function handleEndKey() {
  const images = galleryData[currentCountry].images;
  currentImageIndex = images.length - 1;
  updateLightboxContent(images[currentImageIndex]);
  announceToScreenReader("Letztes Bild der Galerie");
}

function handleKeyPress(e) {
  switch (e.key) {
    case "Escape":
      handleEscapeKey();
      break;
    case "ArrowLeft":
      e.preventDefault();
      handleArrowKey(-1);
      break;
    case "ArrowRight":
      e.preventDefault();
      handleArrowKey(1);
      break;
    case "Home":
      e.preventDefault();
      handleHomeKey();
      break;
    case "End":
      e.preventDefault();
      handleEndKey();
      break;
  }
}

let touchStartX = 0;
let touchEndX = 0;

function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
}

function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}

function handleSwipe() {
  const swipeThreshold = 50;
  const difference = touchStartX - touchEndX;

  if (Math.abs(difference) > swipeThreshold) {
    navigateLightbox(difference > 0 ? 1 : -1);
  }
}

function initializeTouchEvents() {
  const lightbox = document.getElementById("lightbox");
  if (!lightbox) return;
  
  lightbox.addEventListener("touchstart", handleTouchStart, { passive: true });
  lightbox.addEventListener("touchend", handleTouchEnd, { passive: true });
}

function createSkipLink() {
  const skipLink = document.createElement('a');
  skipLink.href = '#gallery';
  skipLink.textContent = 'Direkt zur Galerie springen';
  skipLink.className = 'skip-link';
  document.body.insertBefore(skipLink, document.body.firstChild);
}

async function initializeApp() {
  await loadGalleryData();
  initializeTouchEvents();
  createSkipLink();
}

function logBackgroundElements() {
  const backgrounds = document.querySelectorAll(".background-image");
  backgrounds.forEach((bg, index) => {
    console.log(`Background ${index}:`, {
      backgroundImage: bg.style.backgroundImage || "NOT SET",
      hasActive: bg.classList.contains('active'),
      opacity: window.getComputedStyle(bg).opacity
    });
  });
}

function logGalleryData() {
  console.log("Gallery data:", {
    loaded: !!galleryData,
    currentCountry: currentCountry,
    backgrounds: galleryData?.[currentCountry]?.backgrounds?.length || "None"
  });
}

function debugBackground() {
  console.log("=== BACKGROUND DEBUG ===");
  const backgrounds = document.querySelectorAll(".background-image");
  console.log("Background elements:", backgrounds.length);
  logBackgroundElements();
  logGalleryData();
}

function clearBackgroundElements() {
  const backgrounds = document.querySelectorAll(".background-image");
  backgrounds.forEach(bg => {
    bg.classList.remove('active');
    bg.style.backgroundImage = '';
  });
}

function resetBackground() {
  console.log("Background reset...");
  
  if (backgroundInterval) {
    clearInterval(backgroundInterval);
    backgroundInterval = null;
  }
  
  clearBackgroundElements();
  if (currentCountry) {
    setTimeout(() => initBackground(currentCountry), 100);
  }
}

document.addEventListener("DOMContentLoaded", initializeApp);

window.addEventListener("beforeunload", () => {
  if (backgroundInterval) clearInterval(backgroundInterval);
});