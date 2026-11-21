import './changelog.css';

// Newest first. The first entry is the version shown in the footer, so add a
// new entry at the top (and bump package.json) with each release.
export interface Release {
  version: string;
  date: string; // YYYY-MM-DD
  changes: string[];
}

export const changelog: Release[] = [
  {
    version: '0.2.0',
    date: '2026-11-21',
    changes: [
      '“Formally verified” button in the last panel: the model’s key results proved in Lean, explained with tooltips',
      'Lean proof file in lean/, checked on every change',
    ],
  },
  {
    version: '0.1.1',
    date: '2026-11-21',
    changes: ['Version number in the footer', 'This changelog'],
  },
  {
    version: '0.1.0',
    date: '2026-11-21',
    changes: [
      'First public release on GitHub and Netlify',
      'Eight-scene scrolling study: the question, the catch, weight, height, volume, skin, your fight and the verdict',
    ],
  },
  {
    version: '0.0.4',
    date: '2026-11-20',
    changes: [
      'Phone layout: each scene zooms to its middle so the animals stay big',
      'Dark mode and reduced-motion support',
      'Duck-head favicon and link-preview image',
    ],
  },
  {
    version: '0.0.3',
    date: '2026-11-20',
    changes: [
      'Duck and horse numbers checked against real sources (a mallard is 1.21 kg)',
      'Balance scale, foot ruler, water tank and skin squares in the meaning scenes',
      '“Pluck the duck” in the volume scene',
      'Dromornis silhouette behind the giant duck',
    ],
  },
  {
    version: '0.0.2',
    date: '2026-11-20',
    changes: [
      'Battle simulator in the last panel, built on the Ultimate Battle Simulator’s stat model',
      'Toughness for size, so tiny kicks do less damage',
      'Speed-up button and rematch',
    ],
  },
  {
    version: '0.0.1',
    date: '2026-11-20',
    changes: [
      'SVG mallard, horse and an average person for scale',
      'Scroll-driven scenes that ask what “sized” means',
    ],
  },
];

export const currentVersion = changelog[0].version;

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function mountFooter(): void {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <span>A scientific study of a silly question.</span>
    <button type="button" class="version-link" aria-haspopup="dialog">v${currentVersion}</button>`;
  document.body.appendChild(footer);

  const dialog = document.createElement('dialog');
  dialog.className = 'changelog';
  dialog.setAttribute('aria-labelledby', 'changelog-title');
  dialog.innerHTML = `
    <div class="changelog-head">
      <h2 id="changelog-title">Changelog</h2>
      <button type="button" class="changelog-close" aria-label="Close">×</button>
    </div>
    <div class="changelog-body">
      ${changelog
        .map(
          (r, i) => `
        <section class="version-entry">
          <h3${i === 0 ? ' class="current"' : ''}>Version ${r.version}</h3>
          <p class="release-date">Released ${formatDate(r.date)}</p>
          <ul>${r.changes.map((c) => `<li>${c}</li>`).join('')}</ul>
        </section>`,
        )
        .join('')}
    </div>`;
  document.body.appendChild(dialog);

  footer.querySelector('.version-link')!.addEventListener('click', () => dialog.showModal());
  dialog.querySelector('.changelog-close')!.addEventListener('click', () => dialog.close());
  // Click on the backdrop (outside the panel) closes it.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}
