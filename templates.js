/*
 * ISE Day 2026 — template specifications
 *
 * Single source of truth. Every number here was parsed out of the shape geometry
 * in ppt/slides/slide1.xml of the matching IISE .pptx, then converted to a
 * percentage of the slide. Change layout here, not in app.js.
 *
 * Coordinate system: all x/y/w/h are PERCENT of the canvas, so the same spec
 * renders correctly at preview size and at full 2160x2700 export size.
 *
 * Font sizes are in POINTS at the original slide scale (11.25in wide), matching
 * the source deck. app.js converts: px = pt / 72 * (canvasWidth / 11.25).
 */

export const CANVAS_W = 2160;
export const CANVAS_H = 2700;   // 4:5 portrait — Instagram feed
export const SLIDE_IN = 11.25;  // slide width in inches, for pt -> px

// NC State brand
export const WOLFPACK_RED = '#CC0000';

// IISE ISE Day palette (from the template XML)
const NAVY = '#01284F';
const WHITE = '#FFFFFF';

// Shared national campaign call-to-action. Baked into three of the six frames;
// drawn by the app on the other three so all six read the same.
//
// `color` is explicit rather than derived from the template's theme: on
// insertword_2 the footer sits on a dark navy curve even though the template
// is otherwise light, so theme would pick the wrong colour and it vanishes.
const footerAt = (x, y, accent, color) => ({
  box: { x, y, w: 50.75, h: 13.88 },
  inset: { x: 0.89, y: 0.71 },
  accent,
  color,
  lines: [
    { pt: 32, runs: [{ t: 'Celebrate #ISEDay' }] },
    { pt: 32, runs: [{ t: 'on ' }, { t: 'Sept. 14', accent: true }, { t: '!' }] },
    { pt: 20, runs: [{ t: 'iise.org/ISEDay' }] }
  ]
});

/* Form field definitions reused across templates ------------------------- */

const nameField = {
  key: 'name', type: 'text', label: 'Your name', max: 40,
  placeholder: 'Wolfie Wolf'
};

const titleField = {
  key: 'title', type: 'textarea', rows: 3, max: 95,
  label: 'Title, affiliation, NC State degree & class year',
  hint: 'One per line',
  placeholder: 'Process Engineer\nDelta Air Lines\nB.S. Industrial Engineering, Class of 2015'
};

const storyField = (label, placeholder) => ({
  key: 'story', type: 'textarea', rows: 6, max: 260,
  label, placeholder,
  hint: 'Shrinks automatically if it runs long — aim for under 260 characters'
});

const wordField = {
  key: 'word', type: 'text', max: 34,
  label: 'Your word or phrase',
  placeholder: 'Relentlessly efficient'
};

/* Templates -------------------------------------------------------------- */

export const TEMPLATES = [
  {
    id: 'tellme_1',
    label: 'Tell Me You\'re an ISE',
    variant: 'Navy',
    blurb: 'Share the ISE habit you can\'t switch off.',
    theme: 'dark',
    accent: '#0CA9EC',
    fields: [storyField(
      'Your ISE quirk',
      'I can\'t walk through a grocery store without redesigning the checkout queue in my head.'
    ), nameField, titleField],
    photo: { shape: 'ellipse', x: 54.36, y: 30.31, w: 39.50, h: 31.88 },
    slots: [
      { box: { x: 13.04, y: 33.14, w: 36.96, h: 36.33 }, align: 'left', autofit: true,
        paragraphs: [{ from: 'story', font: 'Montserrat', pt: 24, weight: 400, color: WHITE }] },
      { box: { x: 57.75, y: 64.93, w: 32.72, h: 4.13 }, align: 'center', fitLines: true, autofit: true,
        paragraphs: [{ from: 'name', font: 'Montserrat', pt: 30, weight: 700, color: WHITE }] },
      { box: { x: 57.75, y: 70.30, w: 32.72, h: 10.64 }, align: 'center', fitLines: true, autofit: true,
        paragraphs: [{ from: 'title', font: 'Montserrat', pt: 18, weight: 700, color: WHITE }] }
    ],
    footer: footerAt(51.32, 83.61, '#0CA9EC', WHITE),
    cobrand: { x: 6, y: 70.2, w: 36, variant: 'white' }
  },

  {
    id: 'tellme_2',
    label: 'Tell Me You\'re an ISE',
    variant: 'White',
    blurb: 'Share the ISE habit you can\'t switch off.',
    theme: 'light',
    accent: '#3FA9C9',
    fields: [storyField(
      'Your ISE quirk',
      'I can\'t walk through a grocery store without redesigning the checkout queue in my head.'
    ), nameField, { ...titleField, rows: 2, max: 70,
      placeholder: 'Process Engineer, Delta Air Lines\nB.S. ISE, Class of 2015' }],
    photo: { shape: 'ellipse', x: 52.70, y: 30.22, w: 45.03, h: 36.33 },
    slots: [
      // The story field starts on white and runs onto the teal wedge, which is
      // how IISE drew it. Navy on that teal measures 4.0:1 — AA for *large*
      // text only — so the autofit floor keeps type at 18pt or above.
      { box: { x: 5.93, y: 32.18, w: 38.88, h: 36.33 }, align: 'left', autofit: true, minScale: 0.75,
        paragraphs: [{ from: 'story', font: 'Montserrat', pt: 24, weight: 400, color: NAVY }] },
      // Name and title land on the dark navy wedge, so they invert to white.
      { box: { x: 58.34, y: 69.31, w: 32.72, h: 4.13 }, align: 'center', fitLines: true, autofit: true,
        paragraphs: [{ from: 'name', font: 'Montserrat', pt: 30, weight: 700, color: WHITE }] },
      // Height trimmed from 10.64: below ~81% the art turns light again.
      { box: { x: 58.85, y: 73.75, w: 32.72, h: 7.0 }, align: 'center', fitLines: true, autofit: true,
        paragraphs: [{ from: 'title', font: 'Montserrat', pt: 18, weight: 700, color: WHITE }] }
    ],
    footer: null,                                    // baked into the frame art
    cobrand: { x: 6, y: 70.5, w: 36, variant: 'color' }
  },

  {
    id: 'whenIknew_1',
    label: 'When I Knew ISE Was for Me',
    variant: 'Navy',
    blurb: 'The moment industrial engineering clicked.',
    theme: 'dark',
    accent: '#05DEDD',
    fields: [storyField(
      'The moment it clicked',
      'The moment, project, or class that made me realize: yes, I am definitely an industrial and systems engineer.'
    ), nameField, titleField],
    photo: { shape: 'ellipse', x: 50.84, y: 27.48, w: 42.55, h: 34.33 },
    slots: [
      { box: { x: 5.43, y: 24.99, w: 36.17, h: 25.85 }, align: 'left', autofit: true,
        paragraphs: [{ from: 'story', font: 'Montserrat', pt: 24, weight: 400, color: WHITE }] },
      { box: { x: 50.00, y: 66.09, w: 44.34, h: 13.38 }, align: 'center', fitLines: true, autofit: true,
        inset: { x: 1.58, y: 1.13 },
        paragraphs: [
          { from: 'name', font: 'MavenPro', pt: 28, weight: 700, color: WHITE, uppercase: true },
          { from: 'title', font: 'MavenPro', pt: 24, weight: 700, color: WHITE }
        ] }
    ],
    footer: footerAt(2.87, 79.47, '#05DEDD', WHITE),
    cobrand: { x: 5.5, y: 53.5, w: 36, variant: 'white' }
  },

  {
    id: 'whenIknew_2',
    label: 'When I Knew ISE Was for Me',
    variant: 'White',
    blurb: 'The moment industrial engineering clicked.',
    theme: 'light',
    accent: '#3DBB3D',
    fields: [storyField(
      'The moment it clicked',
      'The moment, project, or class that made me realize: yes, I am definitely an industrial and systems engineer.'
    ), nameField, titleField],
    photo: { shape: 'rect', x: 6.75, y: 29.59, w: 37.71, h: 28.98 },
    slots: [
      { box: { x: 52.61, y: 29.37, w: 42.80, h: 25.85 }, align: 'left', autofit: true,
        paragraphs: [{ from: 'story', font: 'Montserrat', pt: 24, weight: 400, color: NAVY }] },
      { box: { x: 6.61, y: 60.13, w: 37.71, h: 13.38 }, align: 'center', fitLines: true, autofit: true,
        inset: { x: 1.58, y: 1.13 },
        paragraphs: [
          { from: 'name', font: 'MavenPro', pt: 28, weight: 700, color: NAVY, uppercase: true },
          { from: 'title', font: 'MavenPro', pt: 24, weight: 700, color: NAVY }
        ] }
    ],
    footer: null,                                    // baked into the frame art
    cobrand: { x: 53, y: 60, w: 36, variant: 'color' }
  },

  {
    id: 'insertword_1',
    label: 'The Future of ISE Is:',
    variant: 'Navy',
    blurb: 'One word for where the field is heading.',
    theme: 'dark',
    accent: '#FFD000',
    fields: [wordField, storyField(
      'Why that word?',
      'Write your reasoning here — what makes ISE unique as a discipline?'
    ), nameField, titleField],
    photo: { shape: 'ellipse', x: 6.80, y: 29.65, w: 39.42, h: 31.60 },
    slots: [
      { box: { x: 21.92, y: 19.02, w: 77.57, h: 5.51 }, align: 'left', autofit: true, maxLines: 1,
        paragraphs: [{ from: 'word', font: 'Montserrat', pt: 40, weight: 700, color: '#FFD000' }] },
      { box: { x: 54.76, y: 30.20, w: 38.44, h: 28.41 }, align: 'left', autofit: true,
        inset: { x: 1.0, y: 0.71 },
        paragraphs: [{ from: 'story', font: 'Montserrat', pt: 28, weight: 400, color: WHITE }] },
      { box: { x: 17.95, y: 63.22, w: 34.32, h: 20.25 }, align: 'left', fitLines: true, autofit: true,
        inset: { x: 1.58, y: 1.13 },
        paragraphs: [
          { from: 'name', font: 'MavenPro', pt: 28, weight: 700, color: '#FFD000', uppercase: true },
          { from: 'title', font: 'MavenPro', pt: 24, weight: 700, color: WHITE }
        ] }
    ],
    footer: null,                                    // baked into the frame art
    cobrand: { x: 54, y: 63, w: 36, variant: 'white' }
  },

  {
    id: 'insertword_2',
    label: 'The Future of ISE Is:',
    variant: 'White',
    blurb: 'One word for where the field is heading.',
    theme: 'light',
    accent: '#0CA9EC',
    fields: [wordField, storyField(
      'Why that word?',
      'Write your reasoning here — what makes ISE unique as a discipline?'
    ), nameField, titleField],
    photo: { shape: 'rect', x: 55.89, y: 32.21, w: 38.36, h: 31.58 },
    slots: [
      { box: { x: 4.45, y: 19.21, w: 89.80, h: 5.51 }, align: 'left', autofit: true, maxLines: 1,
        paragraphs: [{ from: 'word', font: 'Montserrat', pt: 40, weight: 700, color: '#0CA9EC' }] },
      { box: { x: 9.20, y: 32.44, w: 38.44, h: 28.41 }, align: 'left', autofit: true,
        inset: { x: 1.0, y: 0.71 },
        paragraphs: [{ from: 'story', font: 'Montserrat', pt: 28, weight: 400, color: '#0D2A51' }] },
      // The source box runs off-canvas (x 71.76 + w 50.83 = 122%), so it is
      // re-seated under the photo on the dark navy curve — hence white type.
      { box: { x: 55.89, y: 69.00, w: 38.36, h: 14.00 }, align: 'center', fitLines: true, autofit: true,
        inset: { x: 1.58, y: 1.13 },
        paragraphs: [
          { from: 'name', font: 'MavenPro', pt: 28, weight: 700, color: WHITE, uppercase: true },
          { from: 'title', font: 'MavenPro', pt: 24, weight: 700, color: WHITE }
        ] }
    ],
    footer: footerAt(47.64, 84.02, '#0CA9EC', WHITE),
    cobrand: { x: 9, y: 64, w: 36, variant: 'color' }
  }
];

/* Suggested social caption ------------------------------------------------ */

export function caption(tpl, values) {
  const who = values.name ? `— ${values.name}` : '';
  const lead = {
    tellme_1:     'Tell me you\'re an ISE without telling me you\'re an ISE. 👀',
    tellme_2:     'Tell me you\'re an ISE without telling me you\'re an ISE. 👀',
    whenIknew_1:  'The moment I knew ISE was for me. ⚙️',
    whenIknew_2:  'The moment I knew ISE was for me. ⚙️',
    insertword_1: `The future of industrial and systems engineering is: ${values.word || '___'}.`,
    insertword_2: `The future of industrial and systems engineering is: ${values.word || '___'}.`
  }[tpl.id];

  return [
    lead,
    '',
    (values.story || '').trim(),
    who,
    '',
    'Celebrating #ISEDay on Sept. 14 with the Edward P. Fitts Department of Industrial and Systems Engineering at NC State. iise.org/ISEDay',
    '',
    '#ISEDay #NCStateISE #IndustrialEngineering @ncstateise'
  ].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
}
