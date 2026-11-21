import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './styles.css';
import { scenes } from './scenes';

gsap.registerPlugin(ScrollTrigger);

const app = document.getElementById('app')!;

const sections = scenes.map((scene) => {
  const section = document.createElement('section');
  section.className = 'scene';
  section.id = scene.id;
  section.innerHTML = `<div class="stage">${scene.html()}</div>`;
  app.appendChild(section);
  const stage = section.querySelector<HTMLElement>('.stage')!;
  scene.setup?.(stage);
  return { scene, section, stage };
});

const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  for (const { scene, section, stage } of sections) {
    if (!scene.animate) continue;
    const tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top top', end: '+=150%', pin: stage, scrub: 0.6 },
    });
    scene.animate(stage, tl);
  }
});

mm.add('(prefers-reduced-motion: reduce)', () => {
  for (const { scene, stage } of sections) scene.still?.(stage);
});

// On phones, crop the meaning-scene stages to their middle so the animals are bigger.
// CSS moves the side decorations (scale, ruler, skin squares) inside the crop.
const phone = window.matchMedia('(max-width: 600px)');
function fitStages() {
  for (const svg of document.querySelectorAll<SVGSVGElement>('.meaning-svg')) {
    svg.setAttribute('viewBox', phone.matches ? '170 40 660 400' : '0 0 1000 440');
  }
}
phone.addEventListener('change', () => {
  fitStages();
  ScrollTrigger.refresh();
});
fitStages();
