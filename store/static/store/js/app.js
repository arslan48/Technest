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

    function initProductGalleries() {
        const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

        document.querySelectorAll('.product-card').forEach((card) => {
            const gallery = card.querySelector('[data-product-gallery]');
            if (!gallery) return;
            const images = Array.from(gallery.querySelectorAll('.product-card-img'));
            if (images.length < 2) return;

            const indicators = Array.from(card.querySelectorAll('.gallery-indicator'));
            let current = 0;
            let intentTimer = 0;
            let slideTimer = 0;

            function selectImage(index) {
                current = (index + images.length) % images.length;
                images.forEach((image, imageIndex) => {
                    image.classList.toggle('is-active', imageIndex === current);
                });
                indicators.forEach((indicator, indicatorIndex) => {
                    indicator.classList.toggle('is-active', indicatorIndex === current);
                });
            }

            if (desktopPointer && !reducedMotion && Number(card.querySelector('[data-stock]')?.dataset.stock) > 0) {
                card.addEventListener('pointerenter', () => {
                    intentTimer = window.setTimeout(() => {
                        images.slice(1).forEach((image) => {
                            const preload = new Image();
                            preload.src = image.currentSrc || image.src;
                        });
                        slideTimer = window.setInterval(() => selectImage(current + 1), SLIDE_INTERVAL_MS);
                    }, HOVER_INTENT_MS);
                });
                card.addEventListener('pointerleave', () => {
                    window.clearTimeout(intentTimer);
                    window.clearInterval(slideTimer);
                    selectImage(0);
                });
            } else if (!desktopPointer) {
                let scrollFrame = 0;
                gallery.addEventListener('scroll', () => {
                    window.cancelAnimationFrame(scrollFrame);
                    scrollFrame = window.requestAnimationFrame(() => {
                        selectImage(Math.round(gallery.scrollLeft / gallery.clientWidth));
                    });
                }, { passive: true });
            }
        });

        document.querySelectorAll('[data-detail-gallery]').forEach((gallery) => {
            const images = Array.from(gallery.querySelectorAll('.detail-img'));
            const thumbnails = Array.from(gallery.parentElement.querySelectorAll('[data-detail-thumbnail]'));
            thumbnails.forEach((thumbnail) => {
                thumbnail.addEventListener('click', () => {
                    const selected = Number(thumbnail.dataset.detailThumbnail);
                    images.forEach((image, index) => image.classList.toggle('is-active', index === selected));
                    thumbnails.forEach((button, index) => button.classList.toggle('is-active', index === selected));
                });
            });
        });
    }

    function initProductPeek() {
        const cards = Array.from(document.querySelectorAll('.product-card'));
        const panel = document.getElementById('peek-panel');
        const dialog = document.querySelector('[data-product-dialog]');
        if (!cards.length || !panel || !dialog) return;

        const desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        const panelContent = panel.querySelector('[data-peek-content]');
        const panelImage = panel.querySelector('[data-peek-image]');
        const panelPlaceholder = panel.querySelector('[data-peek-placeholder]');
        const panelIndicators = panel.querySelector('[data-peek-indicators]');
        const dialogContent = dialog.querySelector('[data-dialog-content]');
        const dialogImage = dialog.querySelector('[data-dialog-image]');
        const dialogPlaceholder = dialog.querySelector('[data-dialog-placeholder]');
        const dialogThumbnails = dialog.querySelector('[data-dialog-thumbnails]');
        let currentCard = null;
        let currentProduct = null;
        let holdTimer = 0;
        let graceTimer = 0;
        let panelSlideTimer = 0;
        let dialogTrigger = null;
        let dialogFromPanel = false;
        let savedBodyOverflow = '';

        function productData(card) {
            const data = card.querySelector('.product-card-data');
            return {
                name: data.dataset.name,
                category: data.dataset.category,
                description: data.dataset.description,
                price: data.dataset.price,
                compareAtPrice: data.dataset.compareAtPrice,
                stock: Number(data.dataset.stock),
                detailUrl: data.dataset.detailUrl,
                addUrl: data.dataset.addUrl,
                images: Array.from(data.querySelectorAll('[data-gallery-image]')).map((image) => ({
                    url: image.dataset.galleryImage,
                    alt: image.dataset.galleryAlt,
                })),
            };
        }

        function setText(selector, text, root) {
            const element = root.querySelector(selector);
            if (element) element.textContent = text;
        }

        function stockText(stock) {
            if (stock <= 0) return 'Out of stock';
            if (stock <= 5) return `Low stock · only ${stock} left`;
            return 'In stock';
        }

        function setPrice(target, price, compareAtPrice) {
            target.replaceChildren(document.createTextNode(`Rs. ${price}`));
            if (compareAtPrice) {
                const oldPrice = document.createElement('del');
                oldPrice.className = 'compare-at-price';
                oldPrice.textContent = `Rs. ${compareAtPrice}`;
                target.append(' ', oldPrice);
            }
        }

        function setCartForm(form, product) {
            form.action = product.addUrl;
            const button = form.querySelector('button[type="submit"]');
            button.disabled = product.stock <= 0;
            if (product.stock <= 0) button.textContent = 'Out of stock';
        }

        function setPanelProduct(card, product) {
            setText('[data-peek-name]', product.name, panel);
            setText('[data-peek-category]', product.category, panel);
            setText('[data-peek-stock]', stockText(product.stock), panel);
            setText('[data-peek-description]', product.description, panel);
            setPrice(panel.querySelector('[data-peek-price]'), product.price, product.compareAtPrice);
            setCartForm(panel.querySelector('[data-peek-cart]'), product);
            panelImage.hidden = product.images.length === 0;
            panelPlaceholder.hidden = product.images.length > 0;
            panelPlaceholder.textContent = product.category;
            panelIndicators.replaceChildren();

            if (product.images.length) {
                panelImage.src = product.images[0].url;
                panelImage.alt = product.images[0].alt;
                panelImage.classList.add('is-visible');
                product.images.forEach((image, index) => {
                    const indicator = document.createElement('span');
                    indicator.className = `gallery-indicator${index === 0 ? ' is-active' : ''}`;
                    panelIndicators.append(indicator);
                });
            }
            panel.dataset.productId = card.dataset.productId;
        }

        function setDialogProduct(product) {
            setText('[data-dialog-name]', product.name, dialog);
            setText('[data-dialog-category]', product.category, dialog);
            setText('[data-dialog-stock]', stockText(product.stock), dialog);
            setText('[data-dialog-description]', product.description, dialog);
            setPrice(dialog.querySelector('[data-dialog-price]'), product.price, product.compareAtPrice);
            setCartForm(dialog.querySelector('[data-dialog-cart]'), product);
            dialog.querySelector('[data-dialog-detail-link]').href = product.detailUrl;
            dialogThumbnails.replaceChildren();
            dialogImage.hidden = product.images.length === 0;
            dialogPlaceholder.hidden = product.images.length > 0;
            dialogPlaceholder.textContent = product.category;

            if (!product.images.length) return;
            dialogImage.src = product.images[0].url;
            dialogImage.alt = product.images[0].alt;
            dialogImage.classList.add('is-active');
            product.images.forEach((image, index) => {
                const thumbnail = document.createElement('button');
                thumbnail.className = `detail-gallery-thumbnail${index === 0 ? ' is-active' : ''}`;
                thumbnail.type = 'button';
                thumbnail.setAttribute('aria-label', `Show product image ${index + 1}`);
                const imageElement = document.createElement('img');
                imageElement.src = image.url;
                imageElement.alt = '';
                imageElement.width = 72;
                imageElement.height = 72;
                thumbnail.append(imageElement);
                thumbnail.addEventListener('click', () => {
                    dialogImage.classList.remove('is-active');
                    window.setTimeout(() => {
                        dialogImage.src = image.url;
                        dialogImage.alt = image.alt;
                        dialogImage.classList.add('is-active');
                    }, reducedMotion ? 0 : 80);
                    dialogThumbnails.querySelectorAll('button').forEach((button, buttonIndex) => {
                        button.classList.toggle('is-active', buttonIndex === index);
                    });
                });
                dialogThumbnails.append(thumbnail);
            });
        }

        function flip(element, from, to, duration, opening) {
            const translateX = from.left - to.left;
            const translateY = from.top - to.top;
            const scaleX = from.width / Math.max(to.width, 1);
            const scaleY = from.height / Math.max(to.height, 1);
            const startTransform = `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
            const keyframes = opening
                ? [{ transform: startTransform, opacity: 0.85 }, { transform: 'translate(0, 0) scale(1, 1)', opacity: 1 }]
                : [{ transform: 'translate(0, 0) scale(1, 1)', opacity: 1 }, { transform: startTransform, opacity: 0.85 }];
            return element.animate(keyframes, {
                duration,
                easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                fill: 'both',
            });
        }

        function showPanel(card) {
            if (reducedMotion || !desktopPointer) return;
            if (currentCard && currentCard !== card) closePanel(true);
            currentCard = card;
            currentProduct = productData(card);
            const source = card.getBoundingClientRect();
            setPanelProduct(card, currentProduct);
            panel.hidden = false;
            panel.style.visibility = 'hidden';
            const width = Math.min(Math.max(source.width * 1.35, 320), window.innerWidth - 32, 560);
            panel.style.width = `${width}px`;
            panel.style.left = '16px';
            panel.style.top = '16px';
            const natural = panel.getBoundingClientRect();
            const left = Math.min(Math.max(source.left + source.width / 2 - width / 2, 16), window.innerWidth - width - 16);
            const top = Math.min(Math.max(source.top + source.height / 2 - natural.height / 2, 16), window.innerHeight - natural.height - 16);
            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
            panel.style.visibility = 'visible';
            panelContent.style.opacity = '0';
            const target = panel.getBoundingClientRect();
            const animation = flip(panel, source, target, EXPAND_MS, true);
            animation.onfinish = () => {
                panelContent.animate([{ opacity: 0 }, { opacity: 1 }], {
                    duration: 120,
                    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
                    fill: 'forwards',
                });
            };
            window.clearInterval(panelSlideTimer);
            const images = currentProduct.images;
            if (images.length > 1) {
                let slide = 0;
                panelSlideTimer = window.setInterval(() => {
                    slide = (slide + 1) % images.length;
                    panelImage.classList.remove('is-visible');
                    window.setTimeout(() => {
                        panelImage.src = images[slide].url;
                        panelImage.alt = images[slide].alt;
                        panelImage.classList.add('is-visible');
                        panelIndicators.querySelectorAll('.gallery-indicator').forEach((indicator, index) => {
                            indicator.classList.toggle('is-active', index === slide);
                        });
                    }, 250);
                }, SLIDE_INTERVAL_MS);
            }
        }

        function closePanel(immediate) {
            window.clearTimeout(graceTimer);
            window.clearInterval(panelSlideTimer);
            if (panel.hidden || !currentCard) return;
            const card = currentCard;
            const source = panel.getBoundingClientRect();
            const target = card.getBoundingClientRect();
            const finish = () => {
                panel.hidden = true;
                panel.style.visibility = '';
                panel.style.left = '';
                panel.style.top = '';
                panel.style.width = '';
                panelContent.style.opacity = '';
                currentCard = null;
                currentProduct = null;
            };
            if (immediate || reducedMotion) {
                finish();
                return;
            }
            panelContent.animate([{ opacity: 1 }, { opacity: 0 }], {
                duration: COLLAPSE_MS,
                easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
                fill: 'forwards',
            });
            flip(panel, source, target, COLLAPSE_MS, false).onfinish = finish;
        }

        function schedulePanelClose() {
            window.clearTimeout(graceTimer);
            graceTimer = window.setTimeout(() => closePanel(false), 150);
        }

        function openDialog(card, trigger, fromPanel) {
            const product = productData(card);
            currentCard = fromPanel ? card : currentCard;
            currentProduct = product;
            dialogTrigger = trigger;
            dialogFromPanel = fromPanel;
            setDialogProduct(product);
            savedBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            dialog.showModal();
            dialog.querySelector('[data-dialog-close]').focus();
            dialogContent.style.opacity = '0';

            if (reducedMotion) {
                dialog.animate([{ opacity: 0 }, { opacity: 1 }], {
                    duration: 100,
                    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
                    fill: 'both',
                });
                dialogContent.style.opacity = '1';
                return;
            }
            const source = fromPanel ? panel.getBoundingClientRect() : card.getBoundingClientRect();
            const target = dialog.getBoundingClientRect();
            flip(dialog, source, target, EXPAND_MS, true).onfinish = () => {
                dialogContent.animate([{ opacity: 0 }, { opacity: 1 }], {
                    duration: 120,
                    easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
                    fill: 'forwards',
                });
            };
        }

        function closeDialog() {
            if (!dialog.open) return;
            const source = dialog.getBoundingClientRect();
            const returnTarget = dialogFromPanel && !panel.hidden
                ? panel.getBoundingClientRect()
                : dialogTrigger?.closest('.product-card')?.getBoundingClientRect();
            const finish = () => {
                dialog.close();
                dialog.style.transform = '';
                dialogContent.style.opacity = '';
                document.body.style.overflow = savedBodyOverflow;
                if (dialogTrigger?.isConnected) dialogTrigger.focus();
                if (!dialogFromPanel) closePanel(true);
                dialogTrigger = null;
            };
            if (!returnTarget || reducedMotion) {
                finish();
                return;
            }
            dialogContent.animate([{ opacity: 1 }, { opacity: 0 }], {
                duration: COLLAPSE_MS,
                easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
                fill: 'forwards',
            });
            flip(dialog, source, returnTarget, COLLAPSE_MS, false).onfinish = finish;
        }

        cards.forEach((card) => {
            const quickView = card.querySelector('[data-quick-view]');
            if (quickView) {
                quickView.addEventListener('click', () => {
                    window.clearTimeout(holdTimer);
                    openDialog(card, quickView, false);
                });
            }
            if (!desktopPointer || reducedMotion || Number(card.querySelector('[data-stock]')?.dataset.stock) <= 0) return;
            card.addEventListener('pointerenter', (event) => {
                if (event.pointerType !== 'mouse') return;
                window.clearTimeout(graceTimer);
                holdTimer = window.setTimeout(() => showPanel(card), HOLD_MS);
            });
            card.addEventListener('pointerleave', () => {
                window.clearTimeout(holdTimer);
                if (currentCard === card && !dialog.open) schedulePanelClose();
            });
        });

        panel.addEventListener('pointerenter', () => window.clearTimeout(graceTimer));
        panel.addEventListener('pointerleave', schedulePanelClose);
        panel.querySelector('[data-peek-more]').addEventListener('click', (event) => {
            if (currentCard) openDialog(currentCard, event.currentTarget, true);
        });
        dialog.querySelector('[data-dialog-close]').addEventListener('click', closeDialog);
        dialog.addEventListener('cancel', (event) => {
            event.preventDefault();
            closeDialog();
        });
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog) closeDialog();
        });
        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !dialog.open && currentCard) closePanel(false);
        });
        window.addEventListener('scroll', () => {
            if (currentCard && !dialog.open) closePanel(true);
        }, { passive: true });
        window.addEventListener('resize', () => {
            if (currentCard && !dialog.open) closePanel(true);
        });
    }

    function init() {
        document.documentElement.classList.add('js-enabled');
        initAnnouncements();
        initCompactSearch();
        initProductGalleries();
        initProductPeek();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
