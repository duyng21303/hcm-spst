/* ==========================================================================
   VINTAGE HISTORY LANDING PAGE JAVASCRIPT
   Namespace: histApp
   ========================================================================== */

(function() {
  'use strict';

  // Main application object
  window.histApp = {
    // Configuration
    config: {
      flagAnimationSpeed: 0.02,
      flagAmplitude: 8,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      intersectionThreshold: 0.1
    },

    // State
    state: {
      flagAnimationRunning: true,
      flagAnimationId: null,
      intersectionObserver: null
    },

    // Initialize the application
    init: function() {
      this.setupIntersectionObserver();
      this.setupFlagAnimation();
      this.setupEventListeners();
      this.observeElements();
    },

    // Set up intersection observer for scroll animations
    setupIntersectionObserver: function() {
      if (!('IntersectionObserver' in window)) return;

      this.state.intersectionObserver = new IntersectionObserver(
        this.handleIntersection.bind(this),
        {
          threshold: this.config.intersectionThreshold,
          rootMargin: '50px 0px'
        }
      );
    },

    // Handle intersection observer callbacks
    handleIntersection: function(entries) {
      if (this.config.reducedMotion) return;

      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('hist-visible');
        }
      });
    },

    // Observe elements for scroll animations
    observeElements: function() {
      if (!this.state.intersectionObserver) return;

      const elements = document.querySelectorAll(
        '.hist-timeline-item, .hist-gallery-item'
      );

      elements.forEach(el => {
        this.state.intersectionObserver.observe(el);
      });
    },

    // Set up Vietnamese flag animation
    setupFlagAnimation: function() {
      const canvas = document.getElementById('hist-flag-canvas');
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      
      // Set canvas size
      canvas.width = 200 * dpr;
      canvas.height = 133 * dpr;
      canvas.style.width = '200px';
      canvas.style.height = '133px';
      ctx.scale(dpr, dpr);

      // Animation variables
      let time = 0;
      const segments = 20;
      const segmentWidth = 200 / segments;

      const animate = () => {
        if (!this.state.flagAnimationRunning || this.config.reducedMotion) {
          this.renderStaticFlag(ctx);
          return;
        }

        // Clear canvas
        ctx.clearRect(0, 0, 200, 133);

        // Draw waving flag
        this.drawWavingFlag(ctx, time, segments, segmentWidth);

        // Update time
        time += this.config.flagAnimationSpeed;

        // Continue animation
        this.state.flagAnimationId = requestAnimationFrame(animate);
      };

      // Start animation
      animate();
    },

    // Draw the waving Vietnamese flag
    drawWavingFlag: function(ctx, time, segments, segmentWidth) {
      ctx.save();

      // Create clipping path for flag shape
      ctx.beginPath();
      ctx.roundRect(0, 0, 200, 133, 4);
      ctx.clip();

      // Draw red background with wave effect
      for (let i = 0; i < segments; i++) {
        const x = i * segmentWidth;
        const waveOffset = Math.sin(time + i * 0.3) * this.config.flagAmplitude;
        
        ctx.fillStyle = '#DA251D';
        ctx.fillRect(x, waveOffset, segmentWidth + 1, 133 - waveOffset * 2);
      }

      // Draw the yellow star in center
      this.drawStar(ctx, 100, 66.5, 25, '#FFCD00');

      ctx.restore();
    },

    // Draw a 5-pointed star
    drawStar: function(ctx, x, y, radius, color) {
      const spikes = 5;
      const outerRadius = radius;
      const innerRadius = radius * 0.4;
      
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 2); // Point upward
      
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (i * Math.PI) / spikes;
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#F4D03F';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.restore();
    },

    // Render static flag (fallback)
    renderStaticFlag: function(ctx) {
      ctx.clearRect(0, 0, 200, 133);
      
      // Red background
      ctx.fillStyle = '#DA251D';
      ctx.fillRect(0, 0, 200, 133);
      
      // Yellow star
      this.drawStar(ctx, 100, 66.5, 25, '#FFCD00');
    },

    // Set up event listeners
    setupEventListeners: function() {
      // Flag animation toggle
      const flagToggle = document.getElementById('hist-flag-toggle');
      if (flagToggle) {
        flagToggle.addEventListener('click', this.toggleFlagAnimation.bind(this));
      }

      // Smooth scrolling for anchor links
      document.addEventListener('click', (e) => {
        if (e.target.matches('a[href^="#"]')) {
          e.preventDefault();
          const target = document.querySelector(e.target.getAttribute('href'));
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      });

      // Handle visibility change (pause animations when tab is hidden)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.pauseAnimations();
        } else {
          this.resumeAnimations();
        }
      });

      // Handle reduced motion preference changes
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      mediaQuery.addEventListener('change', (e) => {
        this.config.reducedMotion = e.matches;
        if (e.matches) {
          this.pauseAnimations();
        }
      });
    },

    // Toggle flag animation
    toggleFlagAnimation: function() {
      this.state.flagAnimationRunning = !this.state.flagAnimationRunning;
      
      const toggle = document.getElementById('hist-flag-toggle');
      if (toggle) {
        toggle.textContent = this.state.flagAnimationRunning ? 'Pause' : 'Play';
        toggle.setAttribute('aria-pressed', this.state.flagAnimationRunning);
      }

      if (this.state.flagAnimationRunning && !this.config.reducedMotion) {
        this.setupFlagAnimation();
      }
    },

    // Pause all animations
    pauseAnimations: function() {
      if (this.state.flagAnimationId) {
        cancelAnimationFrame(this.state.flagAnimationId);
        this.state.flagAnimationId = null;
      }
    },

    // Resume animations
    resumeAnimations: function() {
      if (this.state.flagAnimationRunning && !this.config.reducedMotion) {
        this.setupFlagAnimation();
      }
    },

    // Cleanup function
    destroy: function() {
      this.pauseAnimations();
      
      if (this.state.intersectionObserver) {
        this.state.intersectionObserver.disconnect();
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.histApp.init();
    });
  } else {
    window.histApp.init();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    window.histApp.destroy();
  });

})();