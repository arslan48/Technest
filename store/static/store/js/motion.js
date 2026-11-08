/**
 * ==========================================================================
 * TechNest Motion & Micro-interactions — motion.js
 * Plain Vanilla JavaScript, Fully Accessible, Progressive Enhancement
 * ==========================================================================
 */

(function () {
    'use strict';

    // Helper: Detect whether the user has requested reduced motion
    function isReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * 1. Mobile Navbar Menu
     * Smooth 200ms enter and 150ms exit, aria-expanded toggle,
     * Esc key support with focus restoration, and outside click dismissal.
     */
    function initMobileNav() {
        const toggleBtn = document.getElementById('nav-toggle-btn');
        const mainNav = document.getElementById('primary-nav');
        if (!toggleBtn || !mainNav) return;

        let isAnimating = false;

        function openMenu() {
            if (isAnimating) return;
            mainNav.classList.remove('nav-closing');
            mainNav.classList.add('nav-open');
            toggleBtn.setAttribute('aria-expanded', 'true');
        }

        function closeMenu(returnFocusToToggle) {
            if (isAnimating || !mainNav.classList.contains('nav-open')) return;
            isAnimating = true;
            mainNav.classList.add('nav-closing');
            toggleBtn.setAttribute('aria-expanded', 'false');

            const exitDuration = isReducedMotion() ? 0 : 150; // 150ms matches --motion-150

            setTimeout(function () {
                mainNav.classList.remove('nav-open', 'nav-closing');
                isAnimating = false;
                if (returnFocusToToggle && typeof toggleBtn.focus === 'function') {
                    toggleBtn.focus();
                }
            }, exitDuration);
        }

        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (mainNav.classList.contains('nav-open')) {
                closeMenu(false);
            } else {
                openMenu();
            }
        });

        // Close on Escape key and return keyboard focus to toggle
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && mainNav.classList.contains('nav-open')) {
                closeMenu(true);
            }
        });

        // Close if user clicks outside the header
        document.addEventListener('click', function (e) {
            if (mainNav.classList.contains('nav-open')) {
                const header = document.querySelector('.site-header');
                if (header && !header.contains(e.target)) {
                    closeMenu(false);
                }
            }
        });
    }

    /**
     * 2. Django Notifications & Auto-Dismiss
     * Success messages auto-dismiss after 5s with a 150ms fade-out.
     * Error messages do NOT auto-dismiss.
     * All messages support manual dismissal via close button.
     */
    function initAlertDismissal() {
        const alerts = document.querySelectorAll('.alert');
        if (!alerts.length) return;

        alerts.forEach(function (alert) {
            function dismissAlert() {
                if (alert.classList.contains('is-dismissing')) return;
                alert.classList.add('is-dismissing');

                const fadeDuration = isReducedMotion() ? 0 : 150; // 150ms matches --motion-150

                setTimeout(function () {
                    alert.remove();
                }, fadeDuration);
            }

            // Bind click handler on close button
            const closeBtn = alert.querySelector('.alert-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    dismissAlert();
                });
            }

            // Auto-dismiss success and informational messages after ~5000ms
            // Error messages do NOT auto-dismiss so the user never misses critical notices
            const isError = alert.classList.contains('alert-error') || alert.dataset.messageTag === 'error';
            if (!isError) {
                setTimeout(function () {
                    dismissAlert();
                }, 5000);
            }
        });
    }

    /**
     * 3. Logout Form Exit Transition
     * Adds an is-leaving class that fades the main content out over 150ms ease-in,
     * then executes the normal Django POST submit with double-submit guard.
     */
    function initLogoutTransition() {
        const logoutForm = document.querySelector('.logout-form');
        if (!logoutForm) return;

        let isLoggingOut = false;

        logoutForm.addEventListener('submit', function (e) {
            if (isLoggingOut) return;
            e.preventDefault();
            isLoggingOut = true;

            const mainContainer = document.querySelector('.site-main > .container') || document.querySelector('.site-main');
            if (mainContainer) {
                mainContainer.classList.add('is-leaving');
            }

            const delay = isReducedMotion() ? 0 : 150; // 150ms matches --motion-150

            setTimeout(function () {
                // Submit native form directly
                HTMLFormElement.prototype.submit.call(logoutForm);
            }, delay);
        });
    }

    /**
     * 4. Form Submit Loading States
     * On submit event (inside submit handler, never click), updates button label
     * to a loading cue ("Adding...", "Updating...", "Placing order...", "Please wait...")
     * and sets aria-busy="true" while disabling the button against accidental duplicate clicks.
     */
    function initSubmitLoadingStates() {
        const forms = document.querySelectorAll('form');
        if (!forms.length) return;

        forms.forEach(function (form) {
            // Exclude logout and cart remove forms which have dedicated transition sequences
            if (form.classList.contains('logout-form') || form.classList.contains('cart-remove-form')) {
                return;
            }

            form.addEventListener('submit', function () {
                const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
                if (!submitBtn) return;

                const loadingLabel = submitBtn.dataset.submittingText || form.dataset.submittingText;
                if (!loadingLabel) return;

                // Update accessibility state
                submitBtn.setAttribute('aria-busy', 'true');

                // Update text content cleanly
                const textSpan = submitBtn.querySelector('span');
                if (textSpan) {
                    textSpan.textContent = loadingLabel;
                } else {
                    submitBtn.textContent = loadingLabel;
                }

                // Disable submit button inside submit handler
                submitBtn.disabled = true;
            });
        });
    }

    /**
     * 5. Cart Item Removal Fade-Out
     * Fades the cart item table row out over 150ms ease-in before submitting the POST form.
     */
    function initCartRemove() {
        const removeForms = document.querySelectorAll('.cart-remove-form');
        if (!removeForms.length) return;

        removeForms.forEach(function (form) {
            let isSubmitting = false;

            form.addEventListener('submit', function (e) {
                if (isSubmitting) return;
                e.preventDefault();
                isSubmitting = true;

                const row = form.closest('tr');
                if (row) {
                    row.classList.add('is-removing');
                }

                const delay = isReducedMotion() ? 0 : 150; // 150ms matches --motion-150

                setTimeout(function () {
                    HTMLFormElement.prototype.submit.call(form);
                }, delay);
            });
        });
    }

    // Initialize all motion modules when the DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initMobileNav();
            initAlertDismissal();
            initLogoutTransition();
            initSubmitLoadingStates();
            initCartRemove();
        });
    } else {
        initMobileNav();
        initAlertDismissal();
        initLogoutTransition();
        initSubmitLoadingStates();
        initCartRemove();
    }
})();
