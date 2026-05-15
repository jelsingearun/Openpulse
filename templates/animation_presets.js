// Animation presets for GSAP
export const presets = {
    fadeIn: (el) => gsap.from(el, { opacity: 0, duration: 1 }),
    slideUp: (el) => gsap.from(el, { y: 50, opacity: 0, duration: 1 })
};
