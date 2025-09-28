// Heritage Landing Page JavaScript
(function() {
    'use strict';

    // Configuration
    const config = {
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        intersectionThreshold: 0.1,
        quoteDuration: 5000,
        staggerDelay: 60
    };

    // State
    const state = {
        currentQuote: 0,
        quotesInterval: null,
        quotesPlaying: true,
        lightboxActive: false
    };

    // DOM Elements
    const elements = {
        progressBar: document.getElementById('progressBar'),
        stickyNav: document.getElementById('stickyNav'),
        navToggle: document.getElementById('navToggle'),
        navLinks: document.querySelectorAll('.nav-links a'),
        timelineProgress: document.getElementById('timelineProgress'),
        timelineItems: document.querySelectorAll('.timeline-item'),
        figureCards: document.querySelectorAll('.figure-card'),
        eventsCarousel: document.getElementById('eventsCarousel'),
        quotesCarousel: document.getElementById('quotesCarousel'),
        quoteSlides: document.querySelectorAll('.quote-slide'),
        quoteDots: document.querySelectorAll('.quote-dot'),
        quotePause: document.getElementById('quotePause'),
        galleryItems: document.querySelectorAll('.gallery-item'),
        lightbox: document.getElementById('lightbox'),
        lightboxImage: document.getElementById('lightboxImage'),
        lightboxCaption: document.getElementById('lightboxCaption'),
        lightboxClose: document.getElementById('lightboxClose'),
        fadeElements: document.querySelectorAll('.fade-in')
    };

    // Initialize application
    function init() {
        setupIntersectionObserver();
        setupScrollProgress();
        setupStickyNavigation();
        setupTimelineAnimation();
        setupQuotesCarousel();
        setupEventsCarousel();
        setupGalleryLightbox();
        setupSmoothScrolling();
        setupKeyboardNavigation();
        setupReducedMotionSupport();
        
        // Start animations if motion is allowed
        if (!config.reducedMotion) {
            startQuotesCarousel();
        }
    }

    // Intersection Observer for scroll animations
    function setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            entry.target.classList.add('visible');
                        }, index * config.staggerDelay);
                    }
                });
            },
            {
                threshold: config.intersectionThreshold,
                rootMargin: '50px 0px'
            }
        );

        // Observe timeline items
        elements.timelineItems.forEach(item => observer.observe(item));
        
        // Observe fade elements
        elements.fadeElements.forEach(item => observer.observe(item));
    }

    // Scroll progress bar
    function setupScrollProgress() {
        function updateProgress() {
            const scrolled = window.pageYOffset;
            const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrolled / maxScroll) * 100;
            
            if (elements.progressBar) {
                elements.progressBar.style.width = `${Math.min(progress, 100)}%`;
            }
        }

        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }

    // Sticky navigation
    function setupStickyNavigation() {
        let lastScrollY = window.pageYOffset;
        
        function updateNavigation() {
            const currentScrollY = window.pageYOffset;
            const heroHeight = document.querySelector('.hero')?.offsetHeight || 0;
            
            if (currentScrollY > heroHeight) {
                elements.stickyNav?.classList.add('visible');
            } else {
                elements.stickyNav?.classList.remove('visible');
            }
            
            // Update active nav link
            updateActiveNavLink();
            
            lastScrollY = currentScrollY;
        }

        window.addEventListener('scroll', updateNavigation, { passive: true });
        updateNavigation();
    }

    // Update active navigation link
    function updateActiveNavLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.pageYOffset + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-links a[href="#${sectionId}"]`);

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                elements.navLinks.forEach(link => link.classList.remove('active'));
                navLink?.classList.add('active');
            }
        });
    }

    // Timeline animation
    function setupTimelineAnimation() {
        function updateTimelineProgress() {
            const timelineSection = document.getElementById('timeline');
            if (!timelineSection || !elements.timelineProgress) return;

            const rect = timelineSection.getBoundingClientRect();
            const sectionHeight = timelineSection.offsetHeight;
            const viewportHeight = window.innerHeight;
            
            let progress = 0;
            
            if (rect.top < viewportHeight && rect.bottom > 0) {
                const visibleHeight = Math.min(viewportHeight - Math.max(rect.top, 0), sectionHeight);
                progress = (visibleHeight / sectionHeight) * 100;
            }
            
            elements.timelineProgress.style.height = `${Math.min(progress, 100)}%`;
        }

        window.addEventListener('scroll', updateTimelineProgress, { passive: true });
        updateTimelineProgress();
    }

    // Quotes carousel
    function setupQuotesCarousel() {
        if (!elements.quoteSlides.length) return;

        function showQuote(index) {
            elements.quoteSlides.forEach((slide, i) => {
                slide.classList.toggle('active', i === index);
            });
            
            elements.quoteDots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
            
            state.currentQuote = index;
        }

        function nextQuote() {
            const next = (state.currentQuote + 1) % elements.quoteSlides.length;
            showQuote(next);
        }

        function startQuotesCarousel() {
            if (config.reducedMotion) return;
            
            state.quotesInterval = setInterval(nextQuote, config.quoteDuration);
            state.quotesPlaying = true;
            
            if (elements.quotePause) {
                elements.quotePause.textContent = '⏸';
                elements.quotePause.setAttribute('aria-label', 'Pause quotes');
            }
        }

        function stopQuotesCarousel() {
            if (state.quotesInterval) {
                clearInterval(state.quotesInterval);
                state.quotesInterval = null;
            }
            state.quotesPlaying = false;
            
            if (elements.quotePause) {
                elements.quotePause.textContent = '▶';
                elements.quotePause.setAttribute('aria-label', 'Play quotes');
            }
        }

        // Quote dots click handlers
        elements.quoteDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showQuote(index);
                if (state.quotesPlaying) {
                    stopQuotesCarousel();
                    startQuotesCarousel();
                }
            });
        });

        // Pause/play button
        if (elements.quotePause) {
            elements.quotePause.addEventListener('click', () => {
                if (state.quotesPlaying) {
                    stopQuotesCarousel();
                } else {
                    startQuotesCarousel();
                }
            });
        }

        // Pause on hover
        if (elements.quotesCarousel && !config.reducedMotion) {
            elements.quotesCarousel.addEventListener('mouseenter', stopQuotesCarousel);
            elements.quotesCarousel.addEventListener('mouseleave', () => {
                if (state.quotesPlaying) startQuotesCarousel();
            });
        }

        // Store reference for external access
        window.startQuotesCarousel = startQuotesCarousel;
    }

    // Events carousel
    function setupEventsCarousel() {
        const carousel = elements.eventsCarousel;
        if (!carousel) return;

        const track = carousel.querySelector('.events-track');
        const prevBtn = carousel.querySelector('.carousel-prev');
        const nextBtn = carousel.querySelector('.carousel-next');
        
        if (!track || !prevBtn || !nextBtn) return;

        const slideWidth = 320; // 300px + 20px gap

        prevBtn.addEventListener('click', () => {
            track.scrollBy({ left: -slideWidth, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            track.scrollBy({ left: slideWidth, behavior: 'smooth' });
        });

        // Keyboard navigation
        track.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevBtn.click();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextBtn.click();
            }
        });
    }

    // Gallery lightbox
    function setupGalleryLightbox() {
        if (!elements.lightbox) return;

        function openLightbox(imageSrc, caption) {
            elements.lightboxImage.src = imageSrc;
            elements.lightboxCaption.textContent = caption;
            elements.lightbox.classList.add('active');
            elements.lightbox.setAttribute('aria-hidden', 'false');
            state.lightboxActive = true;
            
            // Focus management
            elements.lightboxClose.focus();
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            elements.lightbox.classList.remove('active');
            elements.lightbox.setAttribute('aria-hidden', 'true');
            state.lightboxActive = false;
            document.body.style.overflow = '';
        }

        // Gallery item click handlers
        elements.galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                const img = item.querySelector('img');
                const caption = item.querySelector('.gallery-caption');
                
                if (img) {
                    openLightbox(img.src, caption?.textContent || '');
                }
            });

            // Keyboard support
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });

        // Close lightbox handlers
        elements.lightboxClose?.addEventListener('click', closeLightbox);
        
        elements.lightbox.addEventListener('click', (e) => {
            if (e.target === elements.lightbox) {
                closeLightbox();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (state.lightboxActive && e.key === 'Escape') {
                closeLightbox();
            }
        });
    }

    // Smooth scrolling for anchor links
    function setupSmoothScrolling() {
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (!link) return;

            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }

    // Keyboard navigation support
    function setupKeyboardNavigation() {
        // Mobile nav toggle
        if (elements.navToggle) {
            elements.navToggle.addEventListener('click', () => {
                const expanded = elements.navToggle.getAttribute('aria-expanded') === 'true';
                elements.navToggle.setAttribute('aria-expanded', !expanded);
                // Add mobile menu logic here if needed
            });
        }

        // Figure cards keyboard support
        elements.figureCards.forEach(card => {
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    // Add modal or expanded view logic here
                    console.log('Figure card activated:', card);
                }
            });
        });

        // Timeline items keyboard support
        elements.timelineItems.forEach(item => {
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });
    }

    // Reduced motion support
    function setupReducedMotionSupport() {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        function handleReducedMotion(e) {
            config.reducedMotion = e.matches;
            
            if (e.matches) {
                // Stop animations
                if (state.quotesInterval) {
                    clearInterval(state.quotesInterval);
                    state.quotesInterval = null;
                }
                
                // Remove animation classes
                document.documentElement.style.setProperty('--duration-fast', '0ms');
                document.documentElement.style.setProperty('--duration-normal', '0ms');
                document.documentElement.style.setProperty('--duration-slow', '0ms');
            } else {
                // Restore animations
                document.documentElement.style.removeProperty('--duration-fast');
                document.documentElement.style.removeProperty('--duration-normal');
                document.documentElement.style.removeProperty('--duration-slow');
                
                if (state.quotesPlaying && window.startQuotesCarousel) {
                    window.startQuotesCarousel();
                }
            }
        }

        mediaQuery.addEventListener('change', handleReducedMotion);
        handleReducedMotion(mediaQuery);
    }

    // Visibility change handler (pause animations when tab is hidden)
    function setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                if (state.quotesInterval) {
                    clearInterval(state.quotesInterval);
                }
            } else {
                if (state.quotesPlaying && !config.reducedMotion && window.startQuotesCarousel) {
                    window.startQuotesCarousel();
                }
            }
        });
    }

    // Error handling
    function setupErrorHandling() {
        window.addEventListener('error', (e) => {
            console.error('Heritage Landing Page Error:', e.error);
        });

        // Handle image loading errors
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                e.target.style.display = 'none';
                console.warn('Image failed to load:', e.target.src);
            }
        }, true);
    }

    // Cleanup function
    function cleanup() {
        if (state.quotesInterval) {
            clearInterval(state.quotesInterval);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Setup additional handlers
    setupVisibilityHandler();
    setupErrorHandling();

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);

    // Expose public API
    window.HeritageApp = {
        showQuote: (index) => {
            if (elements.quoteSlides[index]) {
                elements.quoteSlides.forEach((slide, i) => {
                    slide.classList.toggle('active', i === index);
                });
                elements.quoteDots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === index);
                });
                state.currentQuote = index;
            }
        },
        toggleQuotes: () => {
            if (state.quotesPlaying) {
                if (state.quotesInterval) {
                    clearInterval(state.quotesInterval);
                    state.quotesInterval = null;
                }
                state.quotesPlaying = false;
            } else {
                if (window.startQuotesCarousel) {
                    window.startQuotesCarousel();
                }
            }
        },
        scrollToSection: (sectionId) => {
            const element = document.getElementById(sectionId);
            if (element) {
                const headerOffset = 80;
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        }
    };

})();