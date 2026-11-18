/* Shared site behaviour: nav, SVG pattern defs, quick checks, progress */
(function(){
  const PAGES = [
    ['index.html','Home'],
    ['masonry-basics.html','1 · Brick & Bonds'],
    ['cmu.html','2 · CMU'],
    ['mortar.html','3 · Mortar'],
    ['cavity-walls.html','4 · Cavity Walls'],
    ['cmu-lab.html','5 · CMU Lab'],
    ['wood.html','6 · Lumber'],
    ['engineered-wood.html','7 · Engineered Wood'],
    ['framing.html','8 · Framing'],
    ['huntington.html','9 · 525 Huntington'],
    ['practice.html','Practice Quiz'],
    ['flashcards.html','Flashcards'],
    ['review.html','Last-Minute Sheet']
  ];
  window.SITE_PAGES = PAGES;

  // ---------- safe storage ----------
  const store = {
    get(k, d){ try{ const v = localStorage.getItem('conm3:'+k); return v===null? d : JSON.parse(v);}catch(e){ return d; } },
    set(k, v){ try{ localStorage.setItem('conm3:'+k, JSON.stringify(v)); }catch(e){} }
  };
  window.STORE = store;

  // ---------- nav ----------
  const here = (location.pathname.split('/').pop() || 'index.html');
  const bar = document.createElement('header');
  bar.className = 'topbar';
  bar.innerHTML = `<div class="in">
      <a class="brand" href="index.html"><span class="tag">CONM 1200</span> Exam 3 Study Guide</a>
      <button class="navtoggle" aria-label="Menu">☰ Menu</button>
      <nav class="nav">${PAGES.map(([h,t])=>`<a href="${h}" class="${h===here?'on':''}">${t}</a>`).join('')}</nav>
    </div><div class="progressbar"><i></i></div>`;
  document.body.prepend(bar);
  bar.querySelector('.navtoggle').addEventListener('click',()=>bar.querySelector('.nav').classList.toggle('open'));
  const pb = bar.querySelector('.progressbar i');
  const onScroll = ()=>{ const h=document.documentElement; const p = h.scrollTop/((h.scrollHeight-h.clientHeight)||1); pb.style.width=(p*100)+'%'; };
  document.addEventListener('scroll', onScroll, {passive:true});

  // ---------- shared SVG defs (patterns + markers) ----------
  const defs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <pattern id="p-brick" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="8" height="8" fill="#b5452b"/><line x1="0" y1="0" x2="0" y2="8" stroke="#7e2c1b" stroke-width="1.4"/></pattern>
    <pattern id="p-cmu" width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="#a3abb0"/><circle cx="2" cy="3" r=".9" fill="#6f7880"/><circle cx="7" cy="7" r=".8" fill="#6f7880"/><circle cx="8" cy="2" r=".5" fill="#6f7880"/></pattern>
    <pattern id="p-conc" width="14" height="14" patternUnits="userSpaceOnUse">
      <rect width="14" height="14" fill="#c4c2bb"/><path d="M3 4l2-3 2 3z M9 11l2-2 1 3z" fill="#8f8c84"/><circle cx="11" cy="4" r=".8" fill="#8f8c84"/><circle cx="4" cy="11" r=".8" fill="#8f8c84"/></pattern>
    <pattern id="p-insul" width="10" height="10" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="#f3d46a"/><path d="M0 0L10 10M10 0L0 10" stroke="#c9a52c" stroke-width=".9"/></pattern>
    <pattern id="p-batt" width="16" height="12" patternUnits="userSpaceOnUse">
      <rect width="16" height="12" fill="#f6c6c6"/><path d="M0 6 Q4 0 8 6 T16 6" stroke="#d48a8a" fill="none" stroke-width="1.2"/></pattern>
    <pattern id="p-woodsec" width="12" height="12" patternUnits="userSpaceOnUse">
      <rect width="12" height="12" fill="#dcaa68"/><path d="M0 0L12 12M12 0L0 12" stroke="#9b6527" stroke-width=".8"/></pattern>
    <pattern id="p-grain" width="40" height="10" patternUnits="userSpaceOnUse">
      <rect width="40" height="10" fill="#dcaa68"/><path d="M0 3 Q10 1 20 3 T40 3 M0 8 Q12 6 22 8.5 T40 8" stroke="#b98443" fill="none" stroke-width=".9"/></pattern>
    <pattern id="p-grainv" width="10" height="40" patternUnits="userSpaceOnUse">
      <rect width="10" height="40" fill="#dcaa68"/><path d="M3 0 Q1 10 3 20 T3 40 M8 0 Q6 12 8.5 22 T8 40" stroke="#b98443" fill="none" stroke-width=".9"/></pattern>
    <pattern id="p-osb" width="30" height="20" patternUnits="userSpaceOnUse">
      <rect width="30" height="20" fill="#d8b07a"/><path d="M2 3h12M17 6h11M4 10h9M15 13h13M1 17h10M14 18h8" stroke="#a7783d" stroke-width="2.2" stroke-linecap="round"/><path d="M8 5h7M20 9h6M3 14h6" stroke="#c49559" stroke-width="2.2" stroke-linecap="round"/></pattern>
    <pattern id="p-particle" width="12" height="12" patternUnits="userSpaceOnUse">
      <rect width="12" height="12" fill="#d9bf95"/><circle cx="2" cy="2" r="1" fill="#a7834f"/><circle cx="7" cy="4" r=".8" fill="#a7834f"/><circle cx="4" cy="8" r="1.1" fill="#b8925a"/><circle cx="10" cy="10" r=".8" fill="#a7834f"/><circle cx="10" cy="5" r=".6" fill="#8a6a3a"/></pattern>
    <pattern id="p-earth" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="12" height="12" fill="#a88a64"/><line x1="0" y1="0" x2="0" y2="12" stroke="#7d6243" stroke-width="2"/></pattern>
    <pattern id="p-grout" width="9" height="9" patternUnits="userSpaceOnUse">
      <rect width="9" height="9" fill="#b9b6ad"/><circle cx="3" cy="3" r="1" fill="#8b877d"/><circle cx="7" cy="6" r=".7" fill="#8b877d"/></pattern>
    <marker id="m-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#4a5263"/></marker>
    <marker id="m-arrow-ink" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#1d2433"/></marker>
    <marker id="m-arrow-water" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#2a8bd6"/></marker>
    <marker id="m-arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#b3261e"/></marker>
    <marker id="m-arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#2e7d4f"/></marker>
    <marker id="m-arrow-steel" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#41657f"/></marker>
  </defs></svg>`;
  document.body.insertAdjacentHTML('afterbegin', defs);

  // ---------- quick checks ----------
  document.querySelectorAll('.qc').forEach(qc=>{
    const ans = +qc.dataset.a;
    const btns = qc.querySelectorAll('button.opt');
    const why = qc.querySelector('.why');
    btns.forEach((b,i)=>b.addEventListener('click',()=>{
      btns.forEach((x,j)=>{ x.disabled=true; if(j===ans) x.classList.add('right'); });
      if(i!==ans) b.classList.add('wrong');
      if(why){ why.classList.add('show'); why.insertAdjacentHTML('afterbegin', i===ans? '<b>Nice — that\'s it. </b>' : '<b>Not quite. </b>'); }
    }));
  });

  // ---------- chip groups (generic toggles) ----------
  document.querySelectorAll('[data-chips]').forEach(group=>{
    const fn = window[group.dataset.chips];
    const chips = group.querySelectorAll('.chip');
    chips.forEach(c=>c.addEventListener('click',()=>{
      chips.forEach(x=>x.classList.remove('on')); c.classList.add('on');
      if(fn) fn(c.dataset.v, group);
    }));
  });

  // ---------- lesson done ----------
  const doneBtn = document.querySelector('[data-done]');
  if(doneBtn){
    const key = 'done:'+here;
    const paint = ()=>{ const d=store.get(key,false); doneBtn.textContent = d? '✓ Lesson marked done' : 'Mark this lesson done'; doneBtn.classList.toggle('ok', d); };
    doneBtn.addEventListener('click',()=>{ store.set(key, !store.get(key,false)); paint(); });
    paint();
  }
  // home cards
  document.querySelectorAll('.card[data-page]').forEach(c=>{
    if(store.get('done:'+c.dataset.page,false)) c.classList.add('done');
    const ch = c.querySelector('.check'); if(ch) ch.textContent='✓';
  });
  const cnt = document.getElementById('doneCount');
  if(cnt){ const n = PAGES.slice(1,10).filter(([h])=>store.get('done:'+h,false)).length; cnt.textContent = n+'/9'; }


})();
