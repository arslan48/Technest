// Product and announcement timings are centralized here for easy tuning.
const HOLD_MS = 2000;
const HOVER_INTENT_MS = 150;
const SLIDE_INTERVAL_MS = 1500;
const ANNOUNCE_INTERVAL_MS = 4000;
const EXPAND_MS = 450;
const COLLAPSE_MS = 250;

(function () {
    'use strict';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function initAnnouncements() {
        const bar = document.getElementById('announcement-bar');
        if (!bar) return;

        const items = Array.from(bar.querySelectorAll('.announcement-item'));
        const toggle = bar.querySelector('[data-announcement-toggle]');
        if (items.length < 2) {
            bar.querySelectorAll('[data-announcement-previous], [data-announcement-next], [data-announcement-toggle]')
                .forEach((button) => { button.hidden = true; });
            return;
        }

        let current = 0;
        let timer = 0;
        let manuallyPaused = reducedMotion;
        let pointerInside = false;
        let focusInside = false;

        function setToggle() {
            toggle.setAttribute('aria-pressed', String(manuallyPaused));
            toggle.setAttribute('aria-label', manuallyPaused ? 'Play announcements' : 'Pause announcements');
            toggle.textContent = manuallyPaused ? 'Play' : 'Pause';
        }

        function stopTimer() {
            window.clearInterval(timer);
            timer = 0;
        }

        function startTimer() {
            stopTimer();
            if (!manuallyPaused && !pointerInside && !focusInside && !reducedMotion) {
                timer = window.setInterval(() => show(current + 1), ANNOUNCE_INTERVAL_MS);
            }
        }

        function show(index) {
            const next = (index + items.length) % items.length;
            if (next === current) return;
            const previousItem = items[current];
            const nextItem = items[next];
            previousItem.classList.remove('is-active');
            if (!reducedMotion) previousItem.classList.add('is-leaving');
            nextItem.hidden = false;
            nextItem.classList.add('is-entering');

            if (!reducedMotion) {
                requestAnimationFrame(() => {
                    nextItem.classList.remove('is-entering');
                    nextItem.classList.add('is-active');
                });
                window.setTimeout(() => {
                    previousItem.hidden = true;
                    previousItem.classList.remove('is-leaving');
                }, 250);
            } else {
                previousItem.hidden = true;
                nextItem.classList.remove('is-entering');
                nextItem.classList.add('is-active');
            }
            current = next;
        }

        toggle.addEventListener('click', () => {
            manuallyPaused = !manuallyPaused;
            setToggle();
            startTimer();
        });
        bar.querySelector('[data-announcement-previous]').addEventListener('click', () => show(current - 1));
        bar.querySelector('[data-announcement-next]').addEventListener('click', () => show(current + 1));
        bar.addEventListener('pointerenter', () => {
            pointerInside = true;
            stopTimer();
        });
        bar.addEventListener('pointerleave', () => {
            pointerInside = false;
            startTimer();
        });
        bar.addEventListener('focusin', () => {
            focusInside = true;
            stopTimer();
        });
        bar.addEventListener('focusout', (event) => {
            if (!bar.contains(event.relatedTarget)) {
                focusInside = false;
                startTimer();
            }
        });
        setToggle();
        startTimer();
    }

    function initCompactSearch() {
        const compact = document.querySelector('.compact-search');
        const large = document.querySelector('.large-search-form');
        if (!compact) return;

        const compactToggle = compact.querySelector('.compact-search-mobile-toggle');
        const compactInput = compact.querySelector('[name="q"]');
        const compactSelect = compact.querySelector('[name="category"]');

        function syncFields(source) {
            document.querySelectorAll('.compact-search [name="q"], .large-search-form [name="q"]').forEach((field) => {
                if (field !== source) field.value = source.value;
            });
            document.querySelectorAll('.compact-search [name="category"], .large-search-form [name="category"]').forEach((field) => {
                if (field !== source) field.value = source.value;
            });
        }

        document.querySelectorAll('.compact-search [name="q"], .large-search-form [name="q"], .compact-search [name="category"], .large-search-form [name="category"]')
            .forEach((field) => field.addEventListener('input', () => syncFields(field)));
        compact.addEventListener('change', (event) => {
            if (event.target.name === 'category') syncFields(event.target);
        });
        if (large) {
            large.addEventListener('change', (event) => {
                if (event.target.name === 'category') syncFields(event.target);
            });
        }

        compactToggle.addEventListener('click', () => {
            const open = compactToggle.getAttribute('aria-expanded') !== 'true';
            compactToggle.setAttribute('aria-expanded', String(open));
            compactToggle.setAttribute('aria-label', open ? 'Close search' : 'Open search');
            compact.classList.toggle('is-open', open);
            if (open) compactInput.focus();
        });
        compact.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && compact.classList.contains('is-open')) {
                compact.classList.remove('is-open');
                compactToggle.setAttribute('aria-expanded', 'false');
                compactToggle.setAttribute('aria-label', 'Open search');
                compactToggle.focus();
            }
        });

        if (!large) return;
        document.body.classList.add('search-ready');
        if (!('IntersectionObserver' in window)) {
            document.body.classList.add('compact-search-visible');
            return;
        }
        const observer = new IntersectionObserver(([entry]) => {
            document.body.classList.toggle('compact-search-visible', !entry.isIntersecting);
        }, { threshold: 0 });
        observer.observe(large);
    }

    function init() {
        initAnnouncements();
        initCompactSearch();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
