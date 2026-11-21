const app = document.getElementById('app');
let translations = {};

// CSV parser supporting quoted commas, newlines, and doubled quotes.
function parseCSV(source) {
  const rows = [];
  let row = [], field = '', quoted = false;
  source = source.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (ch === '"') {
      if (quoted && source[i + 1] === '"') { field += '"'; i++; }
      else if (quoted) quoted = false;
      else if (!field.trim()) { field = ''; quoted = true; }
      else field += ch;
    } else if (ch === ',' && !quoted) { row.push(field.trim()); field = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && source[i + 1] === '\n') i++;
      row.push(field.trim());
      if (row.some(v => v !== '')) rows.push(row);
      row = []; field = '';
    } else field += ch;
  }
  row.push(field.trim());
  if (row.some(v => v !== '')) rows.push(row);
  return rows;
}
function tr(key) {
  const value = translations[key];
  return (value !== undefined ? value : key ?? '').replace(/\\n/g, '\n');
}
function textNode(value) {
  const fragment = document.createDocumentFragment();
  const raw = tr(value);
  const re = /\[\[([^:\]]+):([^\]]+)\]\]/g;
  let last = 0, match;
  while ((match = re.exec(raw)) !== null) {
    fragment.append(document.createTextNode(raw.slice(last, match.index)));
    const link = document.createElement('a');
    link.className = 'wiki-link';
    link.href = `?page=${encodeURIComponent(match[2])}`;
    link.textContent = match[1];
    fragment.append(link);
    last = re.lastIndex;
  }
  fragment.append(document.createTextNode(raw.slice(last)));
  return fragment;
}
function el(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.append(textNode(content));
  return node;
}
function section(parent, id, title) {
  const s = el('section', 'section'); s.id = id;
  s.append(el('h2', '', title)); parent.append(s); return s;
}
function entries(parent, data, prefix, list = null) {
  let i = 0;
  for (const [heading, body] of Object.entries(data || {})) {
    if (!tr(heading).trim() && !tr(body).trim()) continue;
    const item = el('div', 'subsection'); item.id = `${prefix}-${++i}`;
    if (tr(heading).trim()) item.append(el('h3', '', heading));
    if (tr(body).trim()) item.append(el('p', '', body));
    parent.append(item);
    if (list && tr(heading).trim()) tocLink(list, tr(heading), item.id, true);
  }
}
function tocLink(list, title, target, sub = false) {
  const li = document.createElement('li');
  if (sub) li.className = 'toc-sub';
  const a = document.createElement('a');
  a.href = `#${target}`; a.textContent = title;
  li.append(a); list.append(li);
}
function render(page) {
  app.replaceChildren();
  const title = el('h1', 'page-title', page.page_name);
  if (page.name_color) title.style.color = page.color;
  app.append(title);
  const quote = el('blockquote', 'quote');
  quote.append(el('div', '', `“${tr(page.quote1)}”`), el('footer', '', `— ${tr(page.quote2)}`));
  app.append(quote);
  app.append(el('p', 'intro', page.intro));
  if (page.panel) app.append(el('div', 'panel', '캐릭터 정보 패널은 추후 구현 예정'));
  const toc = el('nav', 'toc'); toc.append(el('h2', '', '목차'));
  const list = document.createElement('ol'); toc.append(list); app.append(toc);
  tocLink(list, '성격', 'personality');
  const personality = section(app, 'personality', '성격');
  entries(personality, page.character, 'personality');
  tocLink(list, '작중 행적', 'profile');
  const profile = section(app, 'profile', '작중 행적');
  entries(profile, page.profile, 'profile', list);
  if (page.playable || page.boss) {
    const label = page.playable ? '성능' : '보스 전투';
    tocLink(list, label, 'skill');
    const s = section(app, 'skill', label);
    s.append(el('p', 'body-text', page.playable ? page.skill_desc : page.boss_desc));
  }
  tocLink(list, '기타', 'trivia');
  const trivia = section(app, 'trivia', '기타');
  const ul = el('ul', 'trivia-list');
  for (const key of page.trivia || []) ul.append(el('li', '', key));
  trivia.append(ul);
}
async function main() {
  const id = new URLSearchParams(location.search).get('page') || 'kana';
  if (!/^[a-z0-9_-]+$/i.test(id)) { app.textContent = '잘못된 문서 주소입니다.'; return; }
  try {
    const [csvResponse, pageResponse] = await Promise.all([
      fetch('data/kana.csv'), fetch(`data/${id}.json`)
    ]);
    if (!csvResponse.ok) throw new Error('번역 CSV를 불러오지 못했습니다.');
    if (!pageResponse.ok) throw new Error(`문서를 찾을 수 없습니다: ${id}`);
    const rows = parseCSV(await csvResponse.text());
    translations = Object.fromEntries(rows.slice(1).filter(r => r[0]).map(r => [r[0].trim(), r[1] ?? '']));
    render(await pageResponse.json());
  } catch (error) { app.replaceChildren(el('p', 'error', error.message)); }
}
main();
