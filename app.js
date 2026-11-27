// 좌표는 모두 sheet.jpg(2047x1340) 픽셀 기준
const W = 2047, H = 1340;
const FONT = "'Nanum Myeongjo', serif";
const CATS = ['폭력', '정서', '지각', '기술', '지식', '괴이'];
const SKILLS = [
  ['소각', '고문', '포박', '협박', '파괴', '구타', '절단', '찌르기', '사격', '전쟁', '매장'],
  ['연심', '기쁨', '걱정', '부끄러움', '웃음', '인내', '놀람', '노여움', '원한', '슬픔', '친애'],
  ['고통', '관능', '촉감', '냄새', '맛', '소리', '풍경', '추적', '예술', '제육감', '그늘'],
  ['분해', '전자기기', '정리', '약품', '효율', '미디어', '카메라', '탈것', '기계', '함정', '병기'],
  ['물리학', '수학', '화학', '생물학', '의학', '교양', '인류학', '역사', '민속학', '고고학', '천문학'],
  ['시간', '혼돈', '심해', '죽음', '영혼', '마술', '암흑', '종말', '꿈', '지저', '우주'],
];
const STAR_X = [932, 1095, 1260, 1425, 1590, 1752];
// 별 기준 특기 이름 중심까지의 거리 (열별 실측)
const NAME_DX = [68, 70, 66, 68, 66, 65];
const starY = (i) => 150 + i * 37.3;
// 특기 칸 테두리 (열 좌/우, 행 경계선)
const CELL_X = [[915, 1061], [1079, 1225], [1242, 1389], [1407, 1553], [1570, 1716], [1733, 1879]];
// 분야 사이 좁은 칸. GAP_X[c] 는 분야 c 의 왼쪽 칸 (괴이는 오른쪽 칸이 없음)
const GAP_X = [[899, 913], [1063, 1077], [1227, 1240], [1391, 1405], [1555, 1568], [1718, 1731]];
const GAP_Y = [73, 540];
const CELL_Y = [131, 168, 205, 242, 280, 317, 354, 391, 428, 466, 503, 540];
const BASIC = [
  { k: 'name', label: '이름', x: 440, y: 595 },
  { k: 'age', label: '연령', x: 440, y: 651 },
  { k: 'gender', label: '성별', x: 685, y: 651 },
  { k: 'job', label: '직업', x: 440, y: 702 },
  { k: 'score', label: '공적점', x: 440, y: 754 },
];
const AB_Y = [751, 795, 840, 884];
const BASIC_ATTACK_Y = 663;
const AB_COL = { name: 843, effect: 1393 };
const SKILL_CELL = [1262, 1386]; // 지정특기 칸 좌우
const TYPES = { 공격: [1153, 17], 서포트: [1196, 23], 장비: [1237, 17] }; // 글자 중심 x, 가로 반지름 (실측)
const HP_X = [330, 367, 403, 440, 475, 512, 548, 585, 620, 668, 722, 777];
const HP_Y = { hp: 802, san: 855 };
const PEOPLE_Y = [975, 1020, 1065, 1110, 1155, 1200, 1242];
const ITEMS = [['painkiller', '진통제', 935], ['weapon', '무기', 1013], ['charm', '부적', 1097]];
const PORTRAIT = [315, 72, 485, 488];
const KEY = 'insane-sheet';

const $ = (s) => document.querySelector(s);
const canvas = $('#c'), ctx = canvas.getContext('2d');
const form = $('#f');
const bg = new Image();
const portrait = new Image();
let abilities = {};

// ---------- 그리기 ----------
function text(s, x, y, size = 26) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function wrapLines(s, w) {
  const out = [];
  for (const para of s.split('\n')) {
    let line = '';
    for (const ch of para) {
      if (line && ctx.measureText(line + ch).width > w) { out.push(line); line = ''; }
      line += ch;
    }
    out.push(line);
  }
  return out;
}

// 박스에 맞을 때까지 글자 크기를 줄여서 그림
function fitText(s, x, y, w, h, max = 20, min = 9, top = false, center = false) {
  if (!s) return;
  let size = max, lines;
  for (; size >= min; size--) {
    ctx.font = `${size}px ${FONT}`;
    lines = wrapLines(s, w);
    if (lines.length * size * 1.2 <= h) break;
  }
  const lh = size * 1.2;
  if (!top) y += Math.max(0, (h - lines.length * lh) / 2);
  ctx.textBaseline = 'top';
  ctx.textAlign = center ? 'center' : 'left';
  lines.forEach((l, i) => ctx.fillText(l, center ? x + w / 2 : x, y + i * lh + size * 0.1));
  ctx.textAlign = 'left';
}

function ellipse(x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, 2 * Math.PI);
  ctx.stroke();
}

// 시트에 인쇄된 별과 같은 9각 별 (꼭짓점 하나가 아래)
function star(x, y, r, n = 9) {
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = (Math.PI / n) * i + Math.PI / 2, rr = i % 2 ? r * 0.6 : r;
    ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
  }
  ctx.fill();
}

function check(x, y) {
  ctx.beginPath();
  ctx.moveTo(x - 9, y);
  ctx.lineTo(x - 2, y + 8);
  ctx.lineTo(x + 11, y - 12);
  ctx.stroke();
}

// 웹폰트는 글자 범위별로 나눠 받으므로, 캔버스에 쓸 글자를 미리 로드한 뒤 다시 그린다
const loadedChars = new Set();
function ensureFont(d) {
  const chars = [...new Set(Object.values(d).filter((v) => typeof v === 'string' && !v.startsWith('data:')).join(''))]
    .filter((ch) => !loadedChars.has(ch));
  if (!chars.length || !document.fonts) return;
  chars.forEach((ch) => loadedChars.add(ch));
  document.fonts.load(`20px ${FONT}`, chars.join('')).then(draw, () => {});
}

function drawSkill(s, y) {
  const [l, r] = SKILL_CELL;
  fitText(s, l, y - 18, r - l, 38, 30, 14, false, true);
}

function draw() {
  const d = read();
  ensureFont(d);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  if (bg.naturalWidth) ctx.drawImage(bg, 0, 0, W, H);
  if (d.portrait && portrait.naturalWidth) {
    const [x, y, w, h] = PORTRAIT, s = Math.min(w / portrait.width, h / portrait.height);
    const pw = portrait.width * s, ph = portrait.height * s;
    ctx.drawImage(portrait, x + (w - pw) / 2, y + (h - ph) / 2, pw, ph);
  }
  ctx.fillStyle = ctx.strokeStyle = '#000';
  ctx.lineWidth = 2.5;

  for (const f of BASIC) text(d[f.k] || '', f.x, f.y);

  const cur = CATS.indexOf(d.curiosity);
  if (cur >= 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = '#888';
    for (const [l, r] of GAP_X.slice(cur, cur + 2)) ctx.fillRect(l, GAP_Y[0], r - l, GAP_Y[1] - GAP_Y[0]);
    ctx.restore();
  }
  CATS.forEach((_, c) => SKILLS[c].forEach((name, i) => {
    const x = STAR_X[c], y = starY(i);
    if (d[`sk_${c}_${i}`]) {
      if (d.skill_mark === 'fill') {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = '#c8c8c8';
        const [l, r] = CELL_X[c], t = CELL_Y[i] + 2;
        ctx.fillRect(l, t, r - l, CELL_Y[i + 1] - t);
        ctx.restore();
      } else {
        ctx.font = `28px ${FONT}`;
        ellipse(x + NAME_DX[c], y, ctx.measureText(name).width / 2 + 10, 16);
      }
    }
    if (d.fear === name) star(x + 1, y, 13);
  }));
  if (d.curiosity) text(d.curiosity, 960, 565, 30);
  if (d.fear) text(d.fear, 1380, 565, 30);

  for (const k in HP_Y) {
    const v = +d[k];
    if (v >= 1 && v <= 12) ellipse(HP_X[v - 1], HP_Y[k], v >= 10 ? 26 : 17, 21);
  }

  drawSkill(d.basic_skill, BASIC_ATTACK_Y);
  AB_Y.forEach((y, i) => {
    fitText(d[`ab${i}_name`], AB_COL.name + 5, y - 17, 270, 38, 26, 14);
    const t = TYPES[d[`ab${i}_type`]];
    if (t) ellipse(t[0], y + 4, t[1], 15);
    drawSkill(d[`ab${i}_skill`], y);
    fitText(d[`ab${i}_effect`], AB_COL.effect, y - 16, 515, 37, 18);
  });

  PEOPLE_Y.forEach((y, i) => {
    const dx = i * 1.5;
    fitText(d[`p${i}_name`], 120 + dx, y - 16, 300, 34, 24, 12);
    if (d[`p${i}_home`]) check(472 + dx, y);
    if (d[`p${i}_secret`]) check(555 + dx, y);
    fitText(d[`p${i}_emo`], 600 + dx, y - 16, 105, 34, 20, 10);
    if (d[`p${i}_sign`] === '+') ellipse(726 + dx, y - 20, 11, 11);
    if (d[`p${i}_sign`] === '-') ellipse(726 + dx, y + 2, 11, 11);
  });

  for (const [k, , y] of ITEMS) if (d[k]) text(d[k], 1630, y, 30);
  fitText(d.memo, 815, 950, 640, 290, 22, 9, true);
  fitText(d.reward, 1505, 1205, 390, 42, 18, 9, true);
}

// ---------- 폼 ----------
const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const k in attrs) k in el && k !== 'list' ? (el[k] = attrs[k]) : el.setAttribute(k, attrs[k]);
  el.append(...kids);
  return el;
};
const input = (name, attrs = {}) => h('input', { name, ...attrs });
const select = (name, opts) => h('select', { name }, ...['', ...opts].map((o) => new Option(o || '-', o)));
const field = (label, el) => h('label', {}, label, el);
const section = (title, ...kids) => h('fieldset', {}, h('legend', {}, title), ...kids);
// 분야별로 묶은 특기 드롭다운
const skillSelect = (name, empty = '-') => h('select', { name }, new Option(empty, ''),
  ...CATS.map((c, i) => h('optgroup', { label: c }, ...SKILLS[i].map((s) => new Option(s)))));

function build() {
  form.append(section('기본', ...BASIC.map((f) => field(f.label, input(f.k)))));

  const portraitIn = input('', { type: 'file', accept: 'image/*' });
  portraitIn.onchange = () => loadPortrait(portraitIn.files[0]);
  form.append(section('초상화', portraitIn, h('button', { type: 'button', onclick: () => setPortrait('') }, '삭제')));

  const grid = h('table', { className: 'skills' }, h('tr', {}, ...CATS.map((c) => h('th', {}, c))));
  SKILLS[0].forEach((_, i) => grid.append(h('tr', {}, ...CATS.map((_, c) =>
    h('td', {}, h('label', {}, input(`sk_${c}_${i}`, { type: 'checkbox' }), SKILLS[c][i]))))));
  const mark = h('select', { name: 'skill_mark' },
    new Option('특기 이름에 동그라미', 'circle'), new Option('특기 칸 색칠', 'fill'));
  form.append(section('특기', field('습득 표시', mark), grid,
    field('호기심', select('curiosity', CATS)),
    field('공포심', skillSelect('fear'))));

  form.append(section('생명력 / 이성치',
    field('생명력', input('hp', { type: 'number', min: 0, max: 12 })),
    field('이성치', input('san', { type: 'number', min: 0, max: 12 }))));

  form.append(section('어빌리티',
    field('기본공격 지정특기', skillSelect('basic_skill')),
    ...AB_Y.map((_, i) => {
      const pick = select(`ab${i}_pick`, Object.keys(abilities));
      pick.add(new Option('직접 입력', CUSTOM));
      pick.onchange = () => fillAbility(i, pick.value);
      return h('div', { className: 'ab' }, pick,
        skillSelect(`ab${i}_skill`, '지정특기'),
        input(`ab${i}_name`, { placeholder: '이름' }),
        select(`ab${i}_type`, Object.keys(TYPES)),
        h('textarea', { name: `ab${i}_effect`, placeholder: '효과', rows: 2 }));
    })));

  form.append(section('인물란', ...PEOPLE_Y.map((_, i) => h('div', { className: 'row' },
    input(`p${i}_name`, { placeholder: '이름' }),
    h('label', {}, input(`p${i}_home`, { type: 'checkbox' }), '거처'),
    h('label', {}, input(`p${i}_secret`, { type: 'checkbox' }), '비밀'),
    input(`p${i}_emo`, { placeholder: '감정', size: 6 }),
    select(`p${i}_sign`, ['+', '-'])))));

  form.append(section('아이템', ...ITEMS.map(([k, label]) =>
    field(label, input(k, { type: 'number', min: 0, max: 7 })))));

  form.append(section('기타',
    field('MEMO', h('textarea', { name: 'memo', rows: 4 })),
    field('보상 및 기타', h('textarea', { name: 'reward', rows: 2 }))));
}

const CUSTOM = '__custom';
const abField = (i, n) => form.elements[`ab${i}_${n}`];

// 목록에서 고르면 값만 채우고 입력창은 숨김. '직접 입력'이면 모두 보임 (직전 값 유지)
function fillAbility(i, key) {
  const a = abilities[key];
  if (key !== CUSTOM) {
    abField(i, 'name').value = a ? key : '';
    abField(i, 'type').value = a?.type || '';
    abField(i, 'skill').value = a && a.skill !== '임의' ? a.skill || '' : '';
    abField(i, 'effect').value = a?.effect || '';
  }
  syncAbility(i);
  if (a?.skill === '임의' || key === CUSTOM) abField(i, key === CUSTOM ? 'name' : 'skill').focus();
  update();
}

function syncAbility(i) {
  const key = abField(i, 'pick').value, custom = key === CUSTOM;
  for (const n of ['name', 'type', 'effect']) abField(i, n).hidden = !custom;
  abField(i, 'skill').hidden = !custom && abilities[key]?.skill !== '임의';
}

// ---------- 상태 / 저장 ----------
let portraitData = '';

function read() {
  const d = { portrait: portraitData };
  for (const el of form.elements) {
    if (!el.name) continue;
    d[el.name] = el.type === 'checkbox' ? el.checked : el.value;
  }
  return d;
}

function write(d) {
  for (const el of form.elements) {
    if (!el.name || !(el.name in d)) continue;
    if (el.type === 'checkbox') el.checked = !!d[el.name];
    else el.value = d[el.name];
  }
  AB_Y.forEach((_, i) => {
    const pick = abField(i, 'pick');
    if (!pick.value && abField(i, 'name').value) pick.value = abField(i, 'name').value in abilities ? abField(i, 'name').value : CUSTOM;
    syncAbility(i);
  });
  setPortrait(d.portrait || '');
}

function update() {
  localStorage.setItem(KEY, JSON.stringify(read()));
  draw();
}

function setPortrait(src) {
  portraitData = src;
  portrait.src = src;
  update();
}

// 저장 용량을 줄이기 위해 칸 크기에 맞게 축소해서 보관
function loadPortrait(file) {
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    const s = Math.min(1, (PORTRAIT[2] * 1.5) / img.width, (PORTRAIT[3] * 1.5) / img.height);
    const c = h('canvas', { width: img.width * s, height: img.height * s });
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(img.src);
    setPortrait(c.toDataURL('image/jpeg', 0.85));
  };
  img.src = URL.createObjectURL(file);
}

$('#export').onclick = () => {
  const d = read();
  const a = h('a', {
    href: URL.createObjectURL(new Blob([JSON.stringify(d)], { type: 'application/json' })),
    download: `${d.name || 'character'}.json`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
};
$('#import').onchange = async (e) => {
  const f = e.target.files[0];
  if (f) write(JSON.parse(await f.text()));
  e.target.value = '';
  update();
};
$('#reset').onclick = () => {
  if (!confirm('모든 입력을 지울까요?')) return;
  form.reset();
  AB_Y.forEach((_, i) => syncAbility(i));
  setPortrait('');
};
$('#print').onclick = () => window.print();

// ---------- 시작 ----------
(() => {
  abilities = typeof ABILITIES === 'object' ? ABILITIES : {};
  build();
  form.oninput = update;
  bg.onload = portrait.onload = draw;
  bg.src = 'sheet.jpg';
  const saved = localStorage.getItem(KEY);
  if (saved) write(JSON.parse(saved));
  else AB_Y.forEach((_, i) => syncAbility(i));
  draw();
})();
