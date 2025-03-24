// Wait for DOM content to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
  // Mobile navigation - Fix for menu not opening
  const hamburger = document.querySelector(".hamburger");
  const navLinks = document.querySelector(".nav-links");
  
  if (hamburger && navLinks) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navLinks.classList.toggle("active");
    });
    
    // Close mobile menu when clicking a link
    document.querySelectorAll(".nav-links a").forEach(n => {
      n.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navLinks.classList.remove("active");
      });
    });
  }
  
  // Shared Intersection Observer for animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate__animated', 'animate__fadeInUp');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Apply intersection observer to common elements across pages
  const animatedElements = document.querySelectorAll('.footer-column, .post-item, .mission-card, .vision-card, .team-member, .value-card, .contact-item, .form-container');
  animatedElements.forEach(el => {
    observer.observe(el);
  });
  
  // Form validation (edit route)
  const form = document.querySelector('form');
  if (form) {
    form.addEventListener('submit', function(event) {
      const title = document.getElementById('post-title');
      const description = document.getElementById('post-description');
      
      if (title && description && (title.value.trim() === '' || description.value.trim() === '')) {
        event.preventDefault();
        alert('Please fill in all required fields.');
      }
    });
    
    // Form animation
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
      formContainer.classList.add('animate__animated', 'animate__fadeIn');
    }
  }
  
  // Show More functionality (index route)
  document.querySelectorAll('.show-more-btn').forEach(button => {
    button.addEventListener('click', function() {
      const postId = this.getAttribute('data-post-id');
      const contentDiv = document.getElementById(`content-${postId}`);
      
      if (contentDiv.style.display === 'block') {
        contentDiv.style.display = 'none';
        this.textContent = 'Show More';
        this.classList.remove('active');
      } else {
        contentDiv.style.display = 'block';
        this.textContent = 'Show Less';
        this.classList.add('active');
      }
    });
  });
  
  // Image lightbox functionality
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxClose = document.querySelector('.lightbox-close');
  
  // Only set up lightbox if elements exist
  if (lightbox && lightboxImage && lightboxClose) {
    // Open lightbox when clicking on gallery images
    document.querySelectorAll('[data-lightbox="gallery"]').forEach(image => {
      image.addEventListener('click', () => {
        lightboxImage.src = image.src;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });
    
    // Close lightbox when clicking on close button or outside the image
    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
    
    // Close lightbox with escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });
  }
  
  // Lightbox close function
  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
});