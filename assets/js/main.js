/**
 * CheemaTech Portfolio
 * assets/js/main.js
 *
 * Modules:
 *   1. Preloader
 *   2. Custom cursor
 *   3. Navbar (scroll state, active links, hamburger)
 *   4. Scroll animations (reveal + skill bars + stat counters)
 *   5. Stars canvas
 *   6. Code card typewriter
 *   7. Typing subtitle
 *   8. Back-to-top button
 *   9. Email copy / toast
 *  10. Card tilt (desktop)
 *  11. Reduced-motion guard
 */

'use strict';

/* ─── Utilities ──────────────────────────── */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function debounce(fn, ms = 100) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isPointerFine        = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ─── 1. Preloader ───────────────────────── */
function initPreloader() {
    const el = $('#preloader');
    if (!el) return;

    const hide = () => {
        el.classList.add('hidden');
        document.body.style.overflow = '';
    };

    document.body.style.overflow = 'hidden';

    if (document.readyState === 'complete') {
        setTimeout(hide, 1500);
    } else {
        window.addEventListener('load', () => setTimeout(hide, 800), { once: true });
    }
}

/* ─── 2. Custom Cursor ───────────────────── */
function initCursor() {
    if (!isPointerFine || prefersReducedMotion) return;

    const dot  = $('#cursor');
    const ring = $('#cursor-ring');
    if (!dot || !ring) return;

    let mx = -100, my = -100;
    let rx = -100, ry = -100;

    document.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.left = `${mx}px`;
        dot.style.top  = `${my}px`;
    }, { passive: true });

    /* Ring lags behind with lerp */
    function animateRing() {
        rx += (mx - rx) * 0.14;
        ry += (my - ry) * 0.14;
        ring.style.left = `${rx}px`;
        ring.style.top  = `${ry}px`;
        requestAnimationFrame(animateRing);
    }
    animateRing();

    /* Hover state on interactive elements */
    const hoverEls = $$('a, button, [role="button"], .skill-card, .project-card, .contact-item');
    hoverEls.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    document.addEventListener('mouseleave', () => { mx = my = -200; });
}

/* ─── 3. Navbar ──────────────────────────── */
function initNavbar() {
    const navbar     = $('#navbar');
    const hamburger  = $('#hamburger');
    const navList    = $('#navList');
    const navLinks   = $$('.nav__link');
    const sections   = $$('section[id]');
    if (!navbar) return;

    /* Scroll → frosted glass */
    const onScroll = () => {
        navbar.classList.toggle('is-scrolled', window.scrollY > 20);
        backToTopBtn?.classList.toggle('is-visible', window.scrollY > 400);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Active link via IntersectionObserver */
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const id = entry.target.id;
            navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === `#${id}`));
        });
    }, { rootMargin: `-${66}px 0px -55% 0px`, threshold: 0 });

    sections.forEach(s => io.observe(s));

    /* Hamburger */
    function closeMenu() {
        navList?.classList.remove('is-open');
        hamburger?.classList.remove('is-open');
        hamburger?.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    hamburger?.addEventListener('click', () => {
        const open = navList?.classList.toggle('is-open');
        hamburger.classList.toggle('is-open', open);
        hamburger.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
    });

    navLinks.forEach(l => l.addEventListener('click', closeMenu));

    document.addEventListener('click', e => {
        if (!navbar.contains(e.target)) closeMenu();
    });

    window.addEventListener('resize', debounce(closeMenu, 200));
}

/* ─── 4. Scroll animations ───────────────── */
function initScrollAnimations() {
    /* Section reveal */
    const revealEls = $$('[data-animate]');

    const revealIO = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            revealIO.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.08 });

    revealEls.forEach(el => revealIO.observe(el));

    /* Stagger child cards when parent appears */
    function staggerChildren(parent) {
        const kids = $$('.skill-card, .project-card, .contact-item, .tag, .about__bio p', parent);
        kids.forEach((kid, i) => {
            kid.style.opacity         = '0';
            kid.style.transform       = 'translateY(18px)';
            kid.style.transitionDelay = `${i * 70}ms`;
            kid.style.transition      = 'opacity 0.5s ease, transform 0.5s ease';
        });

        const parentIO = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                kids.forEach(kid => {
                    kid.style.opacity   = '1';
                    kid.style.transform = 'none';
                });
                parentIO.unobserve(entry.target);
            });
        }, { threshold: 0.05 });

        parentIO.observe(parent);
    }

    revealEls.forEach(el => staggerChildren(el));

    /* Skill bars */
    $$('.skill-bar').forEach(bar => {
        const level = bar.dataset.level;
        bar.style.setProperty('--bar-level', `${level}%`);

        const barIO = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    setTimeout(() => bar.classList.add('is-filled'), 150);
                    barIO.unobserve(bar);
                }
            });
        }, { threshold: 0.6 });

        barIO.observe(bar);
    });

    /* Stat counters */
    $$('.hero__stat-num').forEach(el => {
        const target = parseInt(el.dataset.target, 10);
        const dur    = 1600;

        const cntIO = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                const start = performance.now();

                function tick(now) {
                    const progress = Math.min((now - start) / dur, 1);
                    const eased   = 1 - Math.pow(1 - progress, 3);
                    el.textContent = Math.round(eased * target);
                    if (progress < 1) requestAnimationFrame(tick);
                }

                requestAnimationFrame(tick);
                cntIO.unobserve(el);
            });
        }, { threshold: 0.8 });

        cntIO.observe(el);
    });
}

/* ─── 5. Stars canvas — replaced by CSS dot grid ── */
function initStars() { /* no-op: background handled by CSS */ }

/* ─── 6. Code card typewriter ────────────── */
function initCodeTypewriter() {
    const display = $('#codeDisplay');
    if (!display || prefersReducedMotion) {
        if (display) display.innerHTML = buildStaticCode();
        return;
    }

    const lines = [
        `<span class="t-kw">import</span> torch`,
        `<span class="t-kw">import</span> numpy <span class="t-kw">as</span> np`,
        ``,
        `<span class="t-kw">class</span> <span class="t-cls">PhysicsMLModel</span>(nn.Module):`,
        `    <span class="t-cm"># Physics-Informed Neural Net</span>`,
        ``,
        `    <span class="t-kw">def</span> <span class="t-fn">__init__</span>(self, layers):`,
        `        self.net   <span class="t-op">=</span> <span class="t-cls">MLP</span>(layers)`,
        `        self.λ_pde <span class="t-op">=</span> <span class="t-num">1e-3</span>`,
        ``,
        `    <span class="t-kw">def</span> <span class="t-fn">forward</span>(self, x, t):`,
        `        <span class="t-kw">return</span> self.net(`,
        `            torch.cat([x, t], dim<span class="t-op">=-</span><span class="t-num">1</span>)`,
        `        )`,
        ``,
        `    <span class="t-kw">def</span> <span class="t-fn">pde_loss</span>(self, u, x, t):`,
        `        <span class="t-cm"># ∂u/∂t + N[u] = f(x,t)</span>`,
        `        du_dt <span class="t-op">=</span> grad(u, t)`,
        `        <span class="t-kw">return</span> torch.mean(du_dt<span class="t-op">**</span><span class="t-num">2</span>)`,
    ];

    let lineIdx = 0;
    const rendered = [];

    function typeNextLine() {
        if (lineIdx >= lines.length) return;

        rendered.push(lines[lineIdx]);
        display.innerHTML = rendered.join('\n');

        lineIdx++;

        const delay = lines[lineIdx - 1] === '' ? 80 : 100 + Math.random() * 60;
        setTimeout(typeNextLine, delay);
    }

    /* Start after preloader fades */
    setTimeout(typeNextLine, 1600);
}

function buildStaticCode() {
    return [
        `<span class="t-kw">import</span> torch`,
        `<span class="t-kw">import</span> numpy <span class="t-kw">as</span> np`,
        ``,
        `<span class="t-kw">class</span> <span class="t-cls">PhysicsMLModel</span>(nn.Module):`,
        `    <span class="t-cm"># Physics-Informed Neural Net</span>`,
        ``,
        `    <span class="t-kw">def</span> <span class="t-fn">__init__</span>(self, layers):`,
        `        self.net   <span class="t-op">=</span> <span class="t-cls">MLP</span>(layers)`,
        `        self.λ_pde <span class="t-op">=</span> <span class="t-num">1e-3</span>`,
        ``,
        `    <span class="t-kw">def</span> <span class="t-fn">pde_loss</span>(self, u, x, t):`,
        `        <span class="t-cm"># ∂u/∂t + N[u] = f(x,t)</span>`,
        `        du_dt <span class="t-op">=</span> grad(u, t)`,
        `        <span class="t-kw">return</span> torch.mean(du_dt<span class="t-op">**</span><span class="t-num">2</span>)`,
    ].join('\n');
}

/* ─── 7. Typing subtitle ─────────────────── */
function initTypingSubtitle() {
    const el = $('#typedSubtitle');
    if (!el || prefersReducedMotion) return;

    const roles = [
        'Physics-Informed ML Engineer',
        'Data Scientist | MSc Applied Data Science',
        'Deep Learning & Simulation Engineer',
        'Space Weather & Predictive AI',
        'AI Systems Builder',
    ];

    /* Replace element content with a cursor span */
    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    el.textContent = '';
    el.appendChild(cursor);

    let rIdx = 0, cIdx = 0, deleting = false, paused = false;

    function type() {
        if (paused) return;

        const current = roles[rIdx];

        if (!deleting) {
            el.firstChild?.remove();          // remove old text node
            el.insertBefore(document.createTextNode(current.slice(0, ++cIdx)), cursor);
            if (cIdx === current.length) {
                paused = true;
                setTimeout(() => { paused = false; deleting = true; type(); }, 2600);
                return;
            }
        } else {
            el.firstChild?.remove();
            el.insertBefore(document.createTextNode(current.slice(0, --cIdx)), cursor);
            if (cIdx === 0) {
                deleting = false;
                rIdx = (rIdx + 1) % roles.length;
            }
        }

        setTimeout(type, deleting ? 36 : 68 + Math.random() * 30);
    }

    setTimeout(type, 2000);
}

/* ─── 8. Back-to-top ─────────────────────── */
const backToTopBtn = $('#backToTop');

function initBackToTop() {
    if (!backToTopBtn) return;

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
}

/* ─── 9. Email copy & toast ──────────────── */
function initEmailCopy() {
    const link       = $('#emailLink');
    const valueEl    = $('#emailValue');
    const toastEl    = $('#toast');
    if (!link || !toastEl) return;

    const originalText = valueEl?.textContent || '';
    let toastTimer;

    function showToast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add('is-visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2500);
    }

    link.addEventListener('click', e => {
        const email = 'adnancheema917@gmail.com';

        if (!navigator.clipboard) return; /* fall back to mailto: */

        e.preventDefault();
        navigator.clipboard.writeText(email).then(() => {
            if (valueEl) {
                valueEl.textContent = '✓ Copied!';
                setTimeout(() => { valueEl.textContent = originalText; }, 2200);
            }
            showToast('📋 Email copied to clipboard');
        }).catch(() => {
            window.location.href = link.href; /* fallback */
        });
    });
}

/* ─── 10. Card tilt — removed for performance ── */
function initCardTilt() { /* no-op: tilt caused mousemove reflow on every frame */ }

/* ─── 11. Smooth anchor scroll ───────────── */
function initSmoothScroll() {
    $$('a[href^="#"]').forEach(a => {
        a.addEventListener('click', e => {
            const target = $(a.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        });
    });
}

/* ─── Bootstrap ──────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initCursor();
    initNavbar();
    initScrollAnimations();
    initStars();
    initCodeTypewriter();
    initTypingSubtitle();
    initBackToTop();
    initEmailCopy();
    initCardTilt();
    initSmoothScroll();
});
