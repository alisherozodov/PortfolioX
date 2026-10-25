/* ALISHER / MONO 11
   Browser-native scroll, one event scheduler, and controls independent of animation state.
   No external libraries, storage dependencies, or blocking intro overlays. */
(() => {
  'use strict';
  const one = (selector, root=document) => root.querySelector(selector);
  const all = (selector, root=document) => Array.from(root.querySelectorAll(selector));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const menuButton = one('#menuButton');
  const menu = one('#mobileNav');
  const mobileLinks = one('#mobileNavLinks');
  const desktopLinks = all('#desktopNav a[href^="#"]');
  let menuOpen = false;

  // The actual desktop links populate the mobile menu; no placeholder destinations.
  mobileLinks.replaceChildren(...desktopLinks.map((link, i) => {
    const item = document.createElement('a');
    item.href = link.getAttribute('href');
    item.textContent = link.textContent.trim();
    item.dataset.index = String(i + 1).padStart(2, '0');
    return item;
  }));
  function setMenu(next, restoreFocus=false) {
    menuOpen = Boolean(next);
    menuButton.setAttribute('aria-expanded', String(menuOpen));
    menuButton.setAttribute('aria-label', menuOpen ? 'Close menu' : 'Open menu');
    menu.classList.toggle('open', menuOpen);
    menu.inert = !menuOpen;
    menu.setAttribute('aria-hidden', String(!menuOpen));
    document.body.classList.toggle('menu-open', menuOpen);
    if (menuOpen) one('a', mobileLinks)?.focus({preventScroll:true});
    if (!menuOpen && restoreFocus) menuButton.focus({preventScroll:true});
  }
  menuButton.addEventListener('click', () => setMenu(!menuOpen, menuOpen));
  menu.addEventListener('click', (e) => {
    if (e.target === menu || e.target.closest('#mobileNavLinks a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (!menuOpen) return;
    if (event.key === 'Escape') {event.preventDefault(); setMenu(false, true);}
    if (event.key === 'Tab') {
      const items = [menuButton, ...all('a',mobileLinks), one('#menuMotion')];
      const at = items.indexOf(document.activeElement);
      if (event.shiftKey && at === 0) {event.preventDefault(); items.at(-1).focus();}
      if (!event.shiftKey && at === items.length-1) {event.preventDefault(); items[0].focus();}
    }
  });
  const wideNav = matchMedia('(min-width: 1201px)');
  function screenChanged() { if (wideNav.matches && menuOpen) setMenu(false); }
  wideNav.addEventListener?.('change', screenChanged);

  // Motion never governs click handlers. It can be stopped and resumed at any time.
  const motionButton = one('#motionButton');
  const menuMotion = one('#menuMotion');
  let motionOff = reduced.matches;
  function updateMotion() {
    root.classList.toggle('motion-off', motionOff);
    motionButton.setAttribute('aria-pressed', String(motionOff));
    one('.motion-label', motionButton).textContent = motionOff ? 'MOTION OFF' : 'MOTION ON';
    menuMotion.textContent = motionOff ? 'MOTION OFF ↗' : 'MOTION ON ↗';
    if (motionOff) one('#pointerOrbit')?.classList.remove('is-active');
    requestMeasure();
  }
  motionButton.addEventListener('click', () => {motionOff = !motionOff; updateMotion();});
  menuMotion.addEventListener('click', () => {motionOff = !motionOff; updateMotion();});

  // Reveal only after the observer is registered; a missing script means fully visible content.
  const toReveal = [...all('[data-reveal]'), ...all('.masked-heading')];
  const headingSet = new Set(all('.masked-heading'));
  if ('IntersectionObserver' in window && !reduced.matches) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('visible');
        if (headingSet.has(entry.target)) entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, {rootMargin:'0px 0px -7% 0px', threshold:0.01});
    for (const target of toReveal) observer.observe(target);
    root.classList.add('js-ready');
    for (const el of toReveal) {
      const rect = el.getBoundingClientRect();
      if (rect.top < innerHeight * .96 && rect.bottom > 0) {
        el.classList.add('visible');
        if (headingSet.has(el)) el.classList.add('is-visible');
      }
    }
  }
  // Header active state only needs IntersectionObserver, not every scroll event.
  const sectionNodes = all('main section[id]').filter(el => el.id !== 'interlude' && el.id !== 'method');
  if ('IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        desktopLinks.forEach(link => {
          const on = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('active', on);
          if (on) link.setAttribute('aria-current','location');
          else link.removeAttribute('aria-current');
        });
      }
    }, {rootMargin:'-22% 0px -69% 0px', threshold:0});
    sectionNodes.forEach(el=>sectionObserver.observe(el));
  }

  // Scroll-driven statement. One passive listener, one requestAnimationFrame at most.
  const progress = one('#progress');
  const split = one('#interlude');
  const splitSticky = one('#splitSticky');
  const splitCount = one('#splitCounter');
  let splitVisible = false;
  let splitStart = 0, splitSpan = 1, documentSpan = 1, measureNeeded = true, scrollFrame = 0;
  function measure() {
    splitStart = split.getBoundingClientRect().top + scrollY;
    splitSpan = Math.max(1, split.offsetHeight - innerHeight);
    documentSpan = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    measureNeeded = false;
  }
  function onFrame() {
    scrollFrame = 0;
    if (measureNeeded) measure();
    const y = Math.max(0, Math.min(1, scrollY / documentSpan));
    progress.style.transform = `scaleX(${y})`;
    if (splitVisible) {
      const p = Math.max(0, Math.min(1, (scrollY - splitStart) / splitSpan));
      splitSticky.style.setProperty('--split-y', motionOff ? '0px' : `${Math.round((.5 - p) * 52)}px`);
      splitCount.textContent = `${String(Math.round(p * 100)).padStart(3,'0')} / 100`;
    }
  }
  function requestFrame() {if (!scrollFrame) scrollFrame = requestAnimationFrame(onFrame);}
  function requestMeasure() {measureNeeded = true; requestFrame();}
  if ('IntersectionObserver' in window) {
    const splitObserver = new IntersectionObserver(entries => {
      splitVisible = entries[0]?.isIntersecting ?? false;
      if (splitVisible) requestFrame();
    }, {rootMargin:'20% 0px 20% 0px'});
    splitObserver.observe(split);
  } else splitVisible = true;
  window.addEventListener('scroll', requestFrame, {passive:true});
  window.addEventListener('resize', requestMeasure, {passive:true});
  if ('ResizeObserver' in window) new ResizeObserver(requestMeasure).observe(document.body);
  requestMeasure();
  updateMotion();

  // Soft trailing binary cursor. Turns off on touch, hidden tabs, and reduced motion.
  const cursor = one('#pointerOrbit');
  let pointerX = -100, pointerY=-100, cursorX=-100, cursorY=-100, cursorFrame=0;
  function cursorStep() {
    cursorFrame=0;
    if (motionOff || !fine.matches || document.hidden) return;
    cursorX += (pointerX-cursorX) * .22;
    cursorY += (pointerY-cursorY) * .22;
    cursor.style.transform=`translate3d(${Math.round(cursorX-16)}px,${Math.round(cursorY-16)}px,0)`;
    if (Math.abs(pointerX-cursorX)>.4 || Math.abs(pointerY-cursorY)>.4) cursorFrame=requestAnimationFrame(cursorStep);
  }
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !fine.matches || motionOff) return;
    pointerX=e.clientX; pointerY=e.clientY;
    cursor.classList.add('is-active');
    cursor.classList.toggle('is-target',Boolean(e.target.closest('a, button, [role="button"], input, [role="tab"]')));
    if (!cursorFrame) cursorFrame=requestAnimationFrame(cursorStep);
  },{passive:true});
  document.addEventListener('pointerout', e => {if (!e.relatedTarget) cursor.classList.remove('is-active');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cursor.classList.remove('is-active');});

  // Project details: native modal dialog, no hidden div covering the page.
  const projects = {
    techify:['01','techify','A web store platform for browsing and purchasing technology products.'],
    aurora:['02','The Aurora Group','A web platform for debate events, speaking nights, and community gatherings.'],
    times:['03','The Uzbekistan Times','An independent news portal for articles and regional news coverage.'],
    sat:['04','SAT Yangiaryk','Web platform built for an educational study centre in Yangiaryk.'],
    turbo:['05','Turbocoin','An interactive crypto-style clicker game web application.'],
    zakovat:['06','Zakovat Bot','Interactive Telegram bot designed for Zakovat intellectual quiz games.'],
    robocoder:['07','Robocoder','Official web portal for Robocoder coding and robotics school.']
  };
  const projectDialog=one('#projectDialog');
  let lastProjectControl=null;
  function openProject(id, control) {
    const item = projects[id]; if (!item) return;
    one('#dialogNumber').textContent=item[0];
    one('#dialogTitle').textContent=item[1];
    one('#dialogDescription').textContent=item[2];
    lastProjectControl=control ?? null;
    if (!projectDialog.open) projectDialog.showModal();
  }
  all('[data-project-open]').forEach(button => button.addEventListener('click', () => openProject(button.dataset.projectOpen,button)));
  all('.project-art').forEach(art => {
    const project=art.closest('.project');
    art.tabIndex=0;art.setAttribute('role','button');
    art.setAttribute('aria-label',`Open ${one('h3',project).textContent} project details`);
    art.addEventListener('click',()=>openProject(project.dataset.project,art));
    art.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openProject(project.dataset.project,art);}});
  });
  one('#dialogClose').addEventListener('click',()=>projectDialog.close());
  one('#dialogBack').addEventListener('click',()=>projectDialog.close());
  projectDialog.addEventListener('click',e=>{if(e.target===projectDialog)projectDialog.close();});
  projectDialog.addEventListener('close',()=>lastProjectControl?.focus({preventScroll:true}));

  // In-page studio; keyboard tabs and clear state changes.
  const methods={
    ask:['01 / QUESTION','Start with why.','Get curious. Figure out what matters before writing the first line.'],
    make:['02 / MAKE','Build something.','Turn an idea into a working draft. The first version is rarely the last.'],
    refine:['03 / REFINE','Try again.','Test, rethink, simplify. The useful details usually show up here.']
  };
  const tabs=all('[data-method]');
  function changeMethod(tab){
    const data=methods[tab.dataset.method]; if(!data)return;
    tabs.forEach(button=>{button.setAttribute('aria-selected',String(button===tab));button.tabIndex=button===tab?0:-1;});
    const panel=one('#methodBody');
    const marker=document.createElement('span'),title=document.createElement('h3'),description=document.createElement('p');
    marker.textContent=data[0];title.textContent=data[1];description.textContent=data[2];
    panel.replaceChildren(marker,title,description);
    one('.method-control').dataset.state=tab.dataset.method;
  }
  tabs.forEach((tab,index)=>{
    tab.tabIndex=index===0?0:-1;
    tab.addEventListener('click',()=>changeMethod(tab));
    tab.addEventListener('keydown',event=>{
      if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
      event.preventDefault();
      const next = event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      changeMethod(tabs[next]);tabs[next].focus();
    });
  });
  // Offline terminal. No fake assistant or network requests.
  const terminal=one('#terminalDialog'), output=one('#terminalOutput'), input=one('#terminalInput');
  const commands={
    help:'commands: help, about, projects, honors, education, contact, clear',
    about:'Alisher Ozodov — student, AI engineer & developer. just cooking.',
    projects:'techify · The Aurora Group · The Uzbekistan Times · SAT Yangiaryk · Turbocoin · Zakovat Bot · Robocoder',
    honors:'Linguist 2024 · CEFR 58 · English Olympiad 3rd · IT Olympiad 3rd · IELTS 7.0',
    education:'Currently: Muhammad al-Khwarizmi Specialised School, Tashkent.',
    contact:'Telegram · GitHub · LinkedIn · X · Email (profile links pending).'
  };
  one('#terminalOpen').addEventListener('click',()=>{if(!terminal.open)terminal.showModal();input.focus();});
  one('#terminalClose').addEventListener('click',()=>terminal.close());
  terminal.addEventListener('click',e=>{if(e.target===terminal)terminal.close();});
  one('#terminalForm').addEventListener('submit',event=>{
    event.preventDefault();const value=input.value.trim().toLowerCase();if(!value)return;
    input.value='';if(value==='clear'){output.replaceChildren();return;}
    const command=document.createElement('p');command.className='terminal-command';command.textContent='~ $ '+value;
    const response=document.createElement('p');response.textContent=commands[value]??`Unknown command: ${value}. Type help.`;
    output.append(command,response);output.scrollTop=output.scrollHeight;
  });
})();
