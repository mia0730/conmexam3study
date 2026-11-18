/* Procedural diagrams — every function returns an SVG string. */
window.DIA = (function(){
  const svg = (w,h,body,extra='') => `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" role="img" ${extra}>${body}</svg>`;
  const t = (x,y,s,cls='lbl',anchor='start',extra='') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}" ${extra}>${s}</text>`;

  // ---------------- Brick positions (oblique 3D) ----------------
  const BR = {L:8, W:3.6, H:2.25};
  const POS = {
    stretcher:{d:[BR.L,BR.H,BR.W], name:'Stretcher', desc:'Lies flat · long face shows'},
    header:   {d:[BR.W,BR.H,BR.L], name:'Header', desc:'Lies flat · short end shows'},
    rowlock:  {d:[BR.H,BR.W,BR.L], name:'Rowlock', desc:'On its long edge · end shows'},
    sailor:   {d:[BR.W,BR.L,BR.H], name:'Sailor', desc:'Stands up · broad face shows'},
    soldier:  {d:[BR.H,BR.L,BR.W], name:'Soldier', desc:'Stands up · long narrow face shows'},
    shiner:   {d:[BR.L,BR.W,BR.H], name:'Shiner', desc:'On edge · broad face shows (rowlock stretcher)'}
  };
  function brickBox(x,y,X,Y,Z,s,front='f-brick'){
    // x,y = bottom-left of front face
    const dx = 0.55*s, dy = -0.42*s; // per inch of depth
    const fw=X*s, fh=Y*s, zx=Z*dx, zy=Z*dy;
    const top = `${x},${y-fh} ${x+fw},${y-fh} ${x+fw+zx},${y-fh+zy} ${x+zx},${y-fh+zy}`;
    const side = `${x+fw},${y} ${x+fw},${y-fh} ${x+fw+zx},${y-fh+zy} ${x+fw+zx},${y+zy}`;
    return `<polygon points="${top}" class="f-brick-l o"/><polygon points="${side}" fill="#93391f" class="o"/><rect x="${x}" y="${y-fh}" width="${fw}" height="${fh}" class="${front} o"/>`;
  }
  function brickPos(name, showLabel=false){
    const p = POS[name]; const s=9; const [X,Y,Z]=p.d;
    const W=220,H=150; const fw=X*s, fh=Y*s, zx=Z*.55*s;
    const x = (W-(fw+zx))/2, y = 112;
    let b = `<rect x="4" y="4" width="${W-8}" height="${H-8}" rx="10" class="f-paper"/>`;
    b += `<line x1="16" y1="${y+.5}" x2="${W-16}" y2="${y+.5}" stroke="#c9bfa9" stroke-dasharray="3 3"/>`;
    b += brickBox(x,y,X,Y,Z,s);
    b += `<path d="M${x+fw/2} ${y+20} v-14" class="lead" marker-end="url(#m-arrow)"/>`;
    b += t(x+fw/2, y+32, 'face of wall', 'lbl-m','middle');
    if(showLabel) b += t(W/2, 22, p.name, 'lbl-b','middle');
    return svg(W,H,b,`aria-label="${p.name} brick position"`);
  }
  function brickPositions(){
    return `<div class="grid3" style="gap:10px">${Object.keys(POS).map(k=>`<div style="text-align:center"><div style="font-family:var(--display);font-weight:800;font-size:1.1rem">${POS[k].name}</div>${brickPos(k)}<div style="font-size:.83rem;color:var(--ink-2);margin-top:2px">${POS[k].desc}</div></div>`).join('')}</div>`;
  }

  // ---------------- Bond patterns ----------------
  function bond(type, opt={}){
    const W = opt.w||420, rows = opt.rows||9, top=opt.title?34:10, left=10;
    const S=48, Hd=24, CH=16, gap=3;
    const wallW = W-2*left, wallH = rows*CH;
    const id = 'clip'+type+Math.random().toString(36).slice(2,7);
    let b = `<defs><clipPath id="${id}"><rect x="${left}" y="${top}" width="${wallW}" height="${wallH}"/></clipPath></defs>`;
    b += `<rect x="${left}" y="${top}" width="${wallW}" height="${wallH}" class="f-mortar"/>`;
    b += `<g clip-path="url(#${id})">`;
    for(let r=0;r<rows;r++){
      const fromBottom = rows-1-r;
      const y = top + r*CH;
      let seq, off;
      if(type==='running'){ seq=['S']; off=(fromBottom%2)*24; }
      else if(type==='stack'){ seq=['S']; off=0; }
      else if(type==='common'){ if(fromBottom%6===5){ seq=['H']; off=12; } else { seq=['S']; off=(fromBottom%2)*24; } }
      else if(type==='english'){ if(fromBottom%2===1){ seq=['H']; off=12; } else { seq=['S']; off=0; } }
      else if(type==='flemish'){ seq=['S','H']; off=(fromBottom%2)*36; }
      let x = left + off - 144; let i=0;
      while(x < left+wallW){
        const k = seq[i%seq.length]; const w = k==='S'?S:Hd;
        const cls = k==='H' ? 'f-brick-d' : 'f-brick';
        b += `<rect x="${x+gap/2}" y="${y+gap/2}" width="${w-gap}" height="${CH-gap}" class="${cls}"/>`;
        x += w; i++;
      }
    }
    b += `</g><rect x="${left}" y="${top}" width="${wallW}" height="${wallH}" fill="none" class="o"/>`;
    if(opt.title) b += t(left, 22, opt.title, 'lbl-b');
    return svg(W, top+wallH+10, b, `aria-label="${type} bond"`);
  }
  const BONDS = {
    running:{name:'Running (Stretcher) Bond', how:'All stretchers. Each course shifts half a brick so vertical joints never line up.'},
    common:{name:'Common (American) Bond', how:'Running bond, but a full course of headers every 6th course (typically every 5th–7th).'},
    flemish:{name:'Flemish Bond', how:'Headers and stretchers ALTERNATE within EVERY course. Each header sits centered over the stretcher below.'},
    english:{name:'English Bond', how:'Full courses alternate: a course of all stretchers, then a course of all headers.'},
    stack:{name:'Stack (Stacked) Bond', how:'All stretchers with vertical joints lined up. Decorative, weakest pattern — needs joint reinforcement.'}
  };

  // ---------------- Course / wythe / joints ----------------
  function courseWythe(mode='course'){
    const W=580,H=240; let b='';
    const ex=20, ey=40, S=56, CH=22, rows=7, cols=7;
    b += t(ex, 26, 'ELEVATION (looking at the wall)', 'lbl-m');
    b += `<rect x="${ex}" y="${ey}" width="${S*5.5}" height="${rows*CH}" class="f-mortar"/>`;
    b += `<defs><clipPath id="cwclip"><rect x="${ex}" y="${ey}" width="${S*5.5}" height="${rows*CH}"/></clipPath></defs><g clip-path="url(#cwclip)">`;
    for(let r=0;r<rows;r++){
      const off = (r%2)*S/2; const y=ey+r*CH;
      for(let c=-1;c<cols;c++){
        const x=ex+off+c*S;
        const hl = (mode==='course' && r===3);
        b += `<rect x="${x+2}" y="${y+2}" width="${S-4}" height="${CH-4}" class="f-brick ${mode==='wythe'?'':''}" ${hl?'':''} opacity="${mode==='course'&&r!==3?0.45:1}"/>`;
      }
    }
    b += `</g>`;
    if(mode==='course'){ b += `<rect x="${ex-4}" y="${ey+3*CH-1}" width="${S*5.5+8}" height="${CH+2}" class="s-hl" rx="3"/>`; b+= t(ex+S*5.5+10, ey+3*CH+15, '← one COURSE', 'lbl'); b+= t(ex+S*5.5+10, ey+3*CH+31, '(horizontal row)', 'lbl-s'); }
    if(mode==='bed'){ for(let r=1;r<rows;r++) b += `<line x1="${ex}" y1="${ey+r*CH}" x2="${ex+S*5.5}" y2="${ey+r*CH}" stroke="#e0a800" stroke-width="4"/>`; b+= t(ex+S*5.5+10, ey+70, '← BED joints', 'lbl'); b+= t(ex+S*5.5+10, ey+86, '(horizontal — the', 'lbl-s'); b+= t(ex+S*5.5+10, ey+100, 'brick "lies in bed")', 'lbl-s'); }
    if(mode==='head'){ for(let r=0;r<rows;r++){ const off=(r%2)*S/2; for(let c=0;c<6;c++){ const x=ex+off+c*S; if(x>ex && x<ex+S*5.5) b += `<line x1="${x}" y1="${ey+r*CH+2}" x2="${x}" y2="${ey+r*CH+CH-2}" stroke="#e0a800" stroke-width="5"/>`; } } b+= t(ex+S*5.5+10, ey+70, '← HEAD joints', 'lbl'); b+= t(ex+S*5.5+10, ey+86, '(vertical, between', 'lbl-s'); b+= t(ex+S*5.5+10, ey+100, 'ends of units)', 'lbl-s'); }
    // Section
    const sx = 470, sy=ey;
    if(mode==='wythe' || mode==='course'){
      b += t(sx-4, 26, 'SECTION', 'lbl-m');
      for(let w=0; w<2; w++){
        for(let r=0;r<rows;r++){
          const hl = (mode==='wythe' && w===0);
          b += `<rect x="${sx+w*42}" y="${sy+r*CH+2}" width="36" height="${CH-4}" fill="url(#p-brick)" class="o" opacity="${mode==='wythe'&&w!==0?0.35:(mode==='course'&&r!==3?0.45:1)}"/>`;
        }
      }
      if(mode==='wythe'){ b += `<rect x="${sx-4}" y="${sy-4}" width="44" height="${rows*CH+8}" class="s-hl" rx="3"/>`; b += t(sx+18, sy+rows*CH+24, '↑ one WYTHE', 'lbl','middle'); b += t(sx+18, sy+rows*CH+38, '(vertical layer, 1 unit thick)', 'lbl-s','middle'); b += t(sx-30, sy+rows*CH+52,'',''); }
      if(mode==='course'){ b += `<rect x="${sx-4}" y="${sy+3*CH-1}" width="86" height="${CH+2}" class="s-hl" rx="3"/>`; b += t(sx+40, sy+rows*CH+24, '2-wythe wall', 'lbl-s','middle'); }
    }
    if(mode==='wythe'){ b += t(ex, ey+rows*CH+26, 'From the front you can\'t see wythes — cut the wall to count layers.', 'lbl-s'); }
    return svg(W,H,b,'aria-label="course and wythe diagram"');
  }

  // ---------------- CMU vs brick coursing ----------------
  function cmuBrick(){
    const W=460,H=300; const s=11; // px per inch
    const base=270, x1=70, x2=250; let b='';
    // CMU: 3 courses of 8"
    for(let i=0;i<3;i++){
      const y = base - (i+1)*8*s;
      b += `<rect x="${x1}" y="${y}" width="${16*s/1.5}" height="${8*s}" class="f-mortar"/><rect x="${x1+2}" y="${y+2}" width="${16*s/1.5-4}" height="${8*s-4.1}" class="f-cmu o"/>`;
    }
    // brick: 9 courses of 2 2/3"
    for(let i=0;i<9;i++){
      const h = 8/3*s; const y = base-(i+1)*h;
      b += `<rect x="${x2}" y="${y}" width="${8*s/1.2}" height="${h}" class="f-mortar"/><rect x="${x2+2}" y="${y+2}" width="${8*s/1.2-4}" height="${h-4}" class="f-brick o"/>`;
    }
    for(let i=0;i<=3;i++){ const y=base-i*8*s; b += `<line x1="40" y1="${y}" x2="${W-20}" y2="${y}" stroke="#2e7d4f" stroke-width="1.5" stroke-dasharray="5 4"/>`; b += t(W-18, y-4, i*8+'"', 'lbl-m','end'); }
    b += t(x1+59, 18, 'CMU', 'lbl-b','middle'); b += t(x2+37, 18, 'MODULAR BRICK', 'lbl-b','middle');
    b += t(x1+59, base+18, '1 course = 8 in', 'lbl-s','middle'); b += t(x2+37, base+18, '1 course ≈ 2⅔ in', 'lbl-s','middle');
    b += `<path d="M${x2+90} ${base} v${-8*s}" class="lead" marker-start="url(#m-arrow)" marker-end="url(#m-arrow)"/>`;
    b += t(x2+96, base-40, '3 brick', 'lbl'); b += t(x2+96, base-25, 'courses', 'lbl'); b += t(x2+96, base-10, '= 1 CMU', 'lbl');
    return svg(W,H+10,b,'aria-label="3 modular brick courses equal one 8-inch CMU course"');
  }

  // ---------------- Joint reinforcement ----------------
  function jointReinf(every=2, kind='ladder'){
    const W=520,H=320; let b='';
    const ex=20, ey=24, BW=64, CH=26, rows=9, cols=6;
    b += `<rect x="${ex}" y="${ey}" width="${BW*cols}" height="${rows*CH}" class="f-mortar"/>`;
    b += `<defs><clipPath id="jrclip"><rect x="${ex}" y="${ey}" width="${BW*cols}" height="${rows*CH}"/></clipPath></defs><g clip-path="url(#jrclip)">`;
    for(let r=0;r<rows;r++){ const off=(r%2)*BW/2; for(let c=-1;c<=cols;c++){ b += `<rect x="${ex+off+c*BW+1.5}" y="${ey+r*CH+1.5}" width="${BW-3}" height="${CH-3}" class="f-cmu"/>`; } }
    b += `</g><rect x="${ex}" y="${ey}" width="${BW*cols}" height="${rows*CH}" fill="none" class="o"/>`;
    // reinforced bed joints: counted from bottom, joint above course k
    let firstY=null, secondY=null;
    for(let j=1;j<rows;j++){
      const fromBottom = j; // joint at top of course j (from bottom)
      if(fromBottom % every === 0){
        const y = ey + rows*CH - j*CH;
        b += `<line x1="${ex}" y1="${y}" x2="${ex+BW*cols}" y2="${y}" stroke="#41657f" stroke-width="4"/>`;
        if(firstY===null) firstY=y; else if(secondY===null) secondY=y;
      }
    }
    // labels on right
    const rx = ex+BW*cols+16;
    for(let j=0;j<=rows;j++){ const y=ey+rows*CH-j*CH; if(j%1===0) b += `<line x1="${ex+BW*cols}" y1="${y}" x2="${ex+BW*cols+6}" y2="${y}" class="dim"/>`; }
    if(firstY!==null && secondY!==null){
      b += `<path d="M${rx} ${secondY} V${firstY}" class="lead" stroke="#41657f" stroke-width="1.5" marker-start="url(#m-arrow-steel)" marker-end="url(#m-arrow-steel)"/>`;
      b += t(rx+8, (firstY+secondY)/2-4, `${every*8} in o.c.`, 'lbl');
      b += t(rx+8, (firstY+secondY)/2+12, `= every ${every===1?'course':(every===2?'2nd course':every+'th course')}`, 'lbl-s');
    }
    b += t(rx, ey+rows*CH+2, 'each course', 'lbl-m'); b += t(rx, ey+rows*CH+16, '= 8 in', 'lbl-m');
    // plan inset of wire
    const py = ey+rows*CH+40;
    b += t(ex, py-8, kind==='ladder'?'PLAN of LADDER wire (sits in the bed joint)':'PLAN of TRUSS wire (sits in the bed joint)', 'lbl-m');
    b += `<line x1="${ex}" y1="${py+6}" x2="${ex+300}" y2="${py+6}" stroke="#41657f" stroke-width="2.5"/><line x1="${ex}" y1="${py+30}" x2="${ex+300}" y2="${py+30}" stroke="#41657f" stroke-width="2.5"/>`;
    if(kind==='ladder'){ for(let x=ex+10;x<ex+300;x+=36) b += `<line x1="${x}" y1="${py+6}" x2="${x}" y2="${py+30}" stroke="#41657f" stroke-width="2"/>`; }
    else { let p=`M${ex} ${py+6}`; for(let x=ex, k=0;x<ex+300;x+=24,k++) p+=` L${x+24} ${k%2?py+6:py+30}`; b += `<path d="${p}" stroke="#41657f" stroke-width="2" fill="none"/>`; }
    return svg(W,py+44,b,'aria-label="joint reinforcement spacing"');
  }

  // ---------------- Log sawing ----------------
  function logSaw(mode='plain'){
    const W=580,H=250, cx=125, cy=125, R=100; let b='';
    b += `<circle cx="${cx}" cy="${cy}" r="${R+8}" fill="#7a5532" class="o"/>`;
    b += `<circle cx="${cx}" cy="${cy}" r="${R}" class="f-wood-l"/>`;
    for(let r=12;r<R;r+=11) b += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#c08a4b" stroke-width="1.3"/>`;
    b += `<circle cx="${cx}" cy="${cy}" r="4" fill="#9b6527"/>`;
    if(mode==='plain'){
      for(let y=cy-R+18;y<cy+R-10;y+=19){ const dx=Math.sqrt(R*R-(y-cy)**2); b+=`<line x1="${cx-dx}" y1="${y}" x2="${cx+dx}" y2="${y}" stroke="#b3261e" stroke-width="2.2"/>`; }
    } else {
      b += `<line x1="${cx-R}" y1="${cy}" x2="${cx+R}" y2="${cy}" stroke="#b3261e" stroke-width="2.6"/><line x1="${cx}" y1="${cy-R}" x2="${cx}" y2="${cy+R}" stroke="#b3261e" stroke-width="2.6"/>`;
      for(let a=0;a<360;a+=15){ if(a%90===0) continue; const rad=a*Math.PI/180; b+=`<line x1="${cx+12*Math.cos(rad)}" y1="${cy+12*Math.sin(rad)}" x2="${cx+R*Math.cos(rad)}" y2="${cy+R*Math.sin(rad)}" stroke="#b3261e" stroke-width="1.8"/>`; }
    }
    b += t(cx, 246, 'log end view · red = saw cuts', 'lbl-m','middle');
    // board end
    const bx=290, by=56;
    b += t(bx, 46, 'Board end grain:', 'lbl-s');
    b += `<rect x="${bx}" y="${by}" width="190" height="56" class="f-wood o"/>`;
    b += `<defs><clipPath id="bclip${mode}"><rect x="${bx}" y="${by}" width="190" height="56"/></clipPath></defs><g clip-path="url(#bclip${mode})">`;
    if(mode==='plain'){ for(let r=40;r<260;r+=16) b += `<circle cx="${bx+95}" cy="${by+260}" r="${r+150}" fill="none" stroke="#9b6527" stroke-width="1.4"/>`; }
    else { for(let x=bx+8;x<bx+190;x+=14) b += `<line x1="${x}" y1="${by}" x2="${x+4}" y2="${by+56}" stroke="#9b6527" stroke-width="1.4"/>`; }
    b += `</g>`;
    const info = mode==='plain'
      ? ['Rings run ACROSS the board (flat grain)','✔ maximum yield, cheapest','✘ varied grain → warps/cups as it dries','→ used for FRAMING lumber']
      : ['Rings run UP-DOWN (vertical grain)','✔ consistent grain, wears better','✔ less distortion when moisture changes','✘ less yield → costs more (e.g. VG fir decks)'];
    info.forEach((s,i)=> b += t(bx, by+90+i*22, s, i===0?'lbl':'lbl-s'));
    b += t(bx, 22, mode==='plain'?'PLAIN SAWING':'QUARTER (RADIAL) SAWING', 'lbl-b');
    return svg(W,H+6,b,'aria-label="log sawing"');
  }

  // ---------------- Nominal vs actual ----------------
  function actualDim(n, isTimberThick){
    if(isTimberThick) return n-0.5;          // timbers (5"+ thick) dress 1/2" less (practice key: 8x8 → 7½ x 7½)
    if(n<=1) return n-0.25;
    if(n<=6) return n-0.5;
    return n-0.75;
  }
  const frac = v => { const w=Math.floor(v), r=v-w; const m={0:'',0.25:'¼',0.5:'½',0.75:'¾'}; const f=m[Math.round(r*4)/4]; return (w?w:'')+(f||'') || '0'; };
  function lumberClass(t){ return t<2?'BOARD':(t<5?'DIMENSION LUMBER':'TIMBER'); }
  function lumber(tn, wn){
    const isT = tn>=5;
    const ta = actualDim(tn,isT), wa = actualDim(wn,isT);
    const s = Math.min(22, 300/Math.max(wn,1));
    const W=420, H=Math.max(160, tn*s+70); let b='';
    const x=40, y=30;
    b += `<rect x="${x}" y="${y}" width="${wn*s}" height="${tn*s}" fill="none" stroke="#7b8293" stroke-width="1.5" stroke-dasharray="6 4"/>`;
    const ox = x+(wn-wa)*s/2, oy=y+(tn-ta)*s/2;
    b += `<rect x="${ox}" y="${oy}" width="${wa*s}" height="${ta*s}" fill="url(#p-woodsec)" class="o2"/>`;
    b += t(x, y-10, `nominal ${tn} × ${wn} (dashed)`, 'lbl-m');
    b += t(x, y+tn*s+22, `actual ${frac(ta)}" × ${frac(wa)}"`, 'lbl-b');
    b += t(x, y+tn*s+40, lumberClass(tn), 'lbl-m');
    return {svg: svg(W,H+10,b,'aria-label="nominal vs actual"'), ta, wa, cls:lumberClass(tn), txt:`${frac(ta)} × ${frac(wa)} in`};
  }

  // ---------------- Floor framing plan ----------------
  function floorPlan(mode='both'){
    const W=570,H=330; let b=''; const x=60,y=40, L=380, S=230; // long x short
    b += `<rect x="${x}" y="${y}" width="${L}" height="${S}" fill="#fff" class="o2"/>`;
    // joists run across the SHORT dimension (vertical lines spanning y), spaced along x
    if(mode!=='sheath'){
      for(let jx=x+8; jx<x+L; jx+=16) b += `<line x1="${jx}" y1="${y}" x2="${jx}" y2="${y+S}" stroke="#7a4e22" stroke-width="${mode==='joists'?3:2.5}" opacity="1"/>`;
      b += `<rect x="${x-6}" y="${y-6}" width="${L+12}" height="6" class="f-wood-d"/><rect x="${x-6}" y="${y+S}" width="${L+12}" height="6" class="f-wood-d"/>`;
    }
    if(mode!=='joists'){
      // 4x8 panels: long side (8ft) horizontal = perpendicular to joists; staggered
      const pw=128, ph=64;
      for(let r=0;r*ph<S;r++){ const off = (r%2)? -pw/2 : 0; for(let c=-1;c*pw+off<L;c++){ const px=x+c*pw+off, py=y+r*ph; if(Math.min(px+pw,x+L)-Math.max(px,x)<=0) continue; b += `<rect x="${Math.max(px,x)}" y="${py}" width="${Math.min(px+pw,x+L)-Math.max(px,x)}" height="${Math.min(ph,y+S-py)}" fill="url(#p-osb)" opacity="${mode==='both'?.5:.95}" stroke="#5c3a17" stroke-width="2"/>`; } }
      b += `<path d="M${x+L/2-60} ${y+S/2+0} h120" stroke="#1d2433" stroke-width="3" marker-start="url(#m-arrow-ink)" marker-end="url(#m-arrow-ink)"/>`;
      b += `<rect x="${x+L/2-108}" y="${y+S/2+8}" width="216" height="22" rx="5" fill="#fff" opacity=".92"/>` + t(x+L/2, y+S/2+24, 'panel strength axis (long side)', 'lbl','middle');
    }
    if(mode!=='sheath'){
      b += `<path d="M${x+L+22} ${y} v${S}" stroke="#9b6527" stroke-width="2.5" marker-start="url(#m-arrow)" marker-end="url(#m-arrow)"/>`;
      b += t(x+L+30, y+S/2-6, 'joists', 'lbl'); b += t(x+L+30, y+S/2+10, 'span the', 'lbl-s'); b += t(x+L+30, y+S/2+24, 'SHORT way', 'lbl');
    }
    b += t(x, y-14, 'PLAN VIEW · bearing walls top & bottom', 'lbl-m');
    b += `<path d="M${x} ${y+S+26} h${L}" class="dim" marker-start="url(#m-arrow)" marker-end="url(#m-arrow)"/>` + t(x+L/2, y+S+42, 'long dimension', 'lbl-s','middle');
    b += `<path d="M${x-26} ${y} v${S}" class="dim" marker-start="url(#m-arrow)" marker-end="url(#m-arrow)"/>` + t(x-34, y+S/2, 'short', 'lbl-s','middle', `transform="rotate(-90 ${x-34} ${y+S/2})"`);
    return svg(W,H,b,'aria-label="floor framing plan"');
  }

  // ---------------- Roof profiles ----------------
  function roof(type, small=false){
    const W=200,H=150; let b='';
    const wall = `<polygon points="40,140 140,140 175,118 175,80 140,102 40,102" fill="#efe6d4" class="o"/><line x1="140" y1="140" x2="140" y2="102" class="o"/>`;
    b += wall;
    if(type==='flat'){ b += `<polygon points="36,102 144,102 179,80 75,80" class="f-cmu-l o"/><rect x="36" y="98" width="108" height="6" class="f-cmu o"/>`; }
    if(type==='shed'){ b += `<polygon points="36,102 144,102 179,80 75,80" fill="none"/><polygon points="36,104 144,104 179,82 179,52 75,52 36,74" fill="none"/>`;
      b = wall.replace('175,80 140,102 40,102','175,50 140,72 40,102') ; b+= `<line x1="140" y1="140" x2="140" y2="72" class="o"/><polygon points="36,105 144,74 180,52 72,84" class="f-brick-l o"/>`; }
    if(type==='gable'){ b += `<polygon points="140,102 175,80 175,80 158,50 123,72" fill="#efe6d4" class="o"/>`.replace('140,102 175,80 175,80 158,50 123,72','140,102 175,80 158,50 123,72'); b += `<polygon points="36,104 90,58 125,36 71,82" class="f-brick-l o"/><polygon points="90,58 144,104 179,82 125,36" fill="#c86b52" class="o"/>`;
      b = wall + `<polygon points="140,102 175,80 157.5,46 122.5,68" fill="#efe6d4" class="o"/><polygon points="36,104 90,66 108,44 54,82" fill="none"/>`;
      b += `<polygon points="34,104 88,58 70,36 16,82" fill="none"/>`;
      b = wall + `<polygon points="140,102 175,80 157,48 122,70" fill="#e4d6bb" class="o"/>` + `<polygon points="36,104 144,104 126,70 18,70" fill="none"/>`;
      b = wall + `<polygon points="140,102 177,79 158,46" fill="#e4d6bb" class="o"/><polygon points="36,104 142,104 160,44 54,44" fill="none"/>`;
      // clean gable: ridge line parallel to long wall
      b = `<polygon points="40,140 140,140 140,102 40,102" fill="#efe6d4" class="o"/><polygon points="140,140 175,118 175,80 140,102" fill="#e4d6bb" class="o"/><polygon points="140,102 175,80 157.5,58" fill="#e4d6bb" class="o"/>`;
      b += `<polygon points="34,105 144,105 162,56 52,56" class="f-brick-l o"/><polygon points="144,105 180,82 162,56" fill="none"/><line x1="52" y1="56" x2="162" y2="56" stroke="#7e2c1b" stroke-width="3"/>`;
      if(!small) b += t(100,48,'ridge','lbl-m','middle');
    }
    if(type==='hip'){
      b = `<polygon points="40,140 140,140 140,102 40,102" fill="#efe6d4" class="o"/><polygon points="140,140 175,118 175,80 140,102" fill="#e4d6bb" class="o"/>`;
      b += `<polygon points="34,105 144,105 120,64 72,64" class="f-brick-l o"/><polygon points="144,105 180,82 150,50 120,64" fill="#c86b52" class="o"/><polygon points="34,105 72,64 64,58" fill="#c86b52" class="o"/><line x1="72" y1="64" x2="120" y2="64" stroke="#7e2c1b" stroke-width="3"/>`;
      b = `<polygon points="40,140 140,140 140,102 40,102" fill="#efe6d4" class="o"/><polygon points="140,140 175,118 175,80 140,102" fill="#e4d6bb" class="o"/>`
        + `<polygon points="140,102 177,79 135,60 120,66" fill="#c86b52" class="o"/>`
        + `<polygon points="36,104 142,104 120,66 72,66" class="f-brick-l o"/>`
        + `<line x1="72" y1="66" x2="120" y2="66" stroke="#7e2c1b" stroke-width="3"/><line x1="120" y1="66" x2="142" y2="104" stroke="#7e2c1b" stroke-width="2"/><line x1="72" y1="66" x2="36" y2="104" stroke="#7e2c1b" stroke-width="2"/>`;
      if(!small) b += t(96,58,'ridge','lbl-m','middle') + t(150,110,'hip','lbl-m');
    }
    if(type==='flat' && !small) b += t(100,70,'≈ flat (slight slope)','lbl-m','middle');
    if(type==='shed' && !small) b += t(108,40,'single slope','lbl-m','middle');
    return svg(W,H,b,`aria-label="${type} roof"`);
  }

  // ---------------- CMU unit plan views ----------------
  function cmuUnit(type){
    const W=180,H=120; let b=''; const x=20,y=30,L=140,D=70;
    const core=(cx,w=44)=>`<rect x="${cx-w/2}" y="${y+12}" width="${w}" height="${D-24}" rx="6" fill="#fff" class="o"/>`;
    if(type==='stretcher'){ b += `<path d="M${x} ${y} h${L} v${D} h${-L}z M${x} ${y+D/2-8} h6 v16 h-6z" class="f-cmu o"/>`+ `<path d="M${x+L} ${y+D/2-8} h-6 v16 h6" fill="#fff" class="o"/>` + core(x+38)+core(x+L-38); b=`<rect x="${x}" y="${y}" width="${L}" height="${D}" class="f-cmu o"/>`+`<rect x="${x-1}" y="${y+D/2-9}" width="8" height="18" fill="#fff"/><rect x="${x+L-7}" y="${y+D/2-9}" width="8" height="18" fill="#fff"/>`+core(x+38)+core(x+L-38); }
    if(type==='corner'){ b=`<rect x="${x}" y="${y}" width="${L}" height="${D}" class="f-cmu o"/><rect x="${x+L-7}" y="${y+D/2-9}" width="8" height="18" fill="#fff"/>`+core(x+38)+core(x+L-38)+`<line x1="${x}" y1="${y}" x2="${x}" y2="${y+D}" stroke="#b3261e" stroke-width="5"/>`; }
    if(type==='half'){ b=`<rect x="${x+35}" y="${y}" width="${L/2}" height="${D}" class="f-cmu o"/>`+core(x+35+L/4,40); }
    if(type==='bullnose'){ b=`<path d="M${x+22} ${y} H${x+L} V${y+D} H${x} V${y+22} A22 22 0 0 1 ${x+22} ${y}z" class="f-cmu o"/><rect x="${x+L-7}" y="${y+D/2-9}" width="8" height="18" fill="#fff"/>`+core(x+40)+core(x+L-38)+`<path d="M${x} ${y+22} A22 22 0 0 1 ${x+22} ${y}" fill="none" stroke="#b3261e" stroke-width="5"/>`; }
    if(type==='A'){ b=`<path d="M${x} ${y} H${x+L} V${y+D} H${x} V${y+D-12} H${x+12} V${y+12} H${x} Z" class="f-cmu o"/>`+core(x+L-38); }
    if(type==='H'){ b=`<path d="M${x} ${y} H${x+L} V${y+12} H${x+L-12} V${y+D-12} H${x+L} V${y+D} H${x} V${y+D-12} H${x+12} V${y+12} H${x} Z" class="f-cmu o"/><rect x="${x+L/2-6}" y="${y+12}" width="12" height="${D-24}" class="f-cmu o"/>`; }
    if(type==='bondbeam'){ // cross-section U with bars
      b=`<path d="M${x+35} ${y-10} h18 v58 h34 v-58 h18 v80 h-70z" class="f-cmu o"/><rect x="${x+53}" y="${y+4}" width="34" height="44" fill="url(#p-grout)" class="o"/><circle cx="${x+70}" cy="${y+36}" r="6" fill="#41657f" class="o"/><circle cx="${x+70}" cy="${y+18}" r="6" fill="#41657f" class="o" opacity=".0"/>`;
      b += t(x+120,y+20,'horiz.','lbl-s')+t(x+120,y+33,'rebar','lbl-s')+t(x+120,y+46,'+ grout','lbl-s');
    }
    if(type==='pilaster'){ b=`<rect x="${x+20}" y="${y-8}" width="100" height="${D+16}" class="f-cmu o"/><rect x="${x+50}" y="${y+16}" width="40" height="${D-32}" fill="url(#p-grout)" class="o"/><circle cx="${x+58}" cy="${y+26}" r="4" fill="#41657f"/><circle cx="${x+82}" cy="${y+26}" r="4" fill="#41657f"/><circle cx="${x+58}" cy="${y+D-26}" r="4" fill="#41657f"/><circle cx="${x+82}" cy="${y+D-26}" r="4" fill="#41657f"/>`; }
    if(type==='sash'){ b=`<rect x="${x}" y="${y}" width="${L}" height="${D}" class="f-cmu o"/><rect x="${x-1}" y="${y+D/2-12}" width="16" height="24" fill="#fff" class="o"/><rect x="${x+L-7}" y="${y+D/2-9}" width="8" height="18" fill="#fff"/>`+core(x+42)+core(x+L-38); }
    const names={stretcher:'Stretcher',corner:'Corner',half:'Half unit',bullnose:'Bullnose',A:'"A" unit',H:'"H" unit',bondbeam:'Bond beam (section)',pilaster:'Pilaster',sash:'Sash'};
    b += t(W/2,18,names[type],'lbl','middle');
    return svg(W,H,b,`aria-label="${names[type]} CMU"`);
  }

  // ---------------- Joint profiles ----------------
  function jointProfile(type){
    const W=110,H=110; let b='';
    // two bricks in section (stacked) with joint between, face on right side at x=70
    b += `<rect x="10" y="10" width="60" height="38" fill="url(#p-brick)" class="o"/><rect x="10" y="62" width="60" height="38" fill="url(#p-brick)" class="o"/>`;
    const m = 'fill="#cfc6b3" stroke="#1d2433" stroke-width="1.2"';
    const shapes={
      concave:`<path d="M10 48 H70 Q60 55 70 62 H10Z" ${m}/>`,
      vee:`<path d="M10 48 H70 L62 55 L70 62 H10Z" ${m}/>`,
      weathered:`<path d="M10 48 H64 L70 62 H10Z" ${m}/>`,
      struck:`<path d="M10 48 H70 L64 62 H10Z" ${m}/>`,
      flush:`<path d="M10 48 H70 V62 H10Z" ${m}/>`,
      raked:`<path d="M10 48 H60 V62 H10Z" ${m}/>`,
      extruded:`<path d="M10 48 H70 Q82 50 80 55 Q82 60 70 62 H10Z" ${m}/>`,
      beaded:`<path d="M10 48 H70 V51 Q78 55 70 59 V62 H10Z" ${m}/>`
    };
    b += shapes[type]||'';
    b += `<line x1="70" y1="2" x2="70" y2="108" stroke="#2a8bd6" stroke-dasharray="3 3"/><text x="74" y="9" class="lbl-m" font-size="8" fill="#2a8bd6">wall face</text>`;
    return svg(W,H,b,`aria-label="${type} joint"`);
  }

  // ---------------- Mini icons for cards ----------------
  function icon(kind){
    switch(kind){
      case 'bond': return bond('flemish',{w:220,rows:5});
      case 'cmu': return cmuUnit('stretcher');
      case 'saw': return svg(120,120,`<circle cx="60" cy="60" r="50" class="f-wood-l o"/>${[12,22,32,42].map(r=>`<circle cx="60" cy="60" r="${r}" fill="none" stroke="#c08a4b" stroke-width="1.3"/>`).join('')}${[-30,-12,6,24,42].map(d=>{const dx=Math.sqrt(2500-d*d);return `<line x1="${60-dx}" y1="${60+d}" x2="${60+dx}" y2="${60+d}" stroke="#b3261e" stroke-width="2"/>`;}).join('')}`);
      default: return '';
    }
  }

  // auto-render [data-dia]
  function render(root=document){
    root.querySelectorAll('[data-dia]').forEach(el=>{
      const fn = el.dataset.dia; const args = el.dataset.args ? JSON.parse(el.dataset.args) : [];
      if(api[fn]) el.innerHTML = api[fn](...args);
    });
  }
  const api = {svg, t, brickPos, brickPositions, POS, bond, BONDS, courseWythe, cmuBrick, jointReinf, logSaw, lumber, actualDim, frac, lumberClass, floorPlan, roof, cmuUnit, jointProfile, icon, render};
  document.addEventListener('DOMContentLoaded', ()=>render());
  return api;
})();
