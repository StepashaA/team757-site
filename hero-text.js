'use strict';
// Original 757.team phrase order and cadence: 2200ms show + 600ms exit, 700ms entrance.
(()=>{const text=document.getElementById('hero-changing-text'),clip=document.getElementById('hero-video');if(!text||!clip)return;const phrases=['мотокоманда из Лобни','мотомагазин из Лобни','мотосервис из Лобни'];const preference=matchMedia('(prefers-reduced-motion: reduce)');let index=0,phase='show',remaining=2200,timer=null,started=0,initialized=false;
function paint(){text.textContent='это '+phrases[index];text.classList.remove('hero-phrase-show','hero-phrase-hide');text.classList.add(phase==='show'?'hero-phrase-show':'hero-phrase-hide')}
function suspend(){if(timer!==null){clearTimeout(timer);timer=null;remaining=Math.max(0,remaining-(performance.now()-started))}text.style.animationPlayState='paused'}
function resume(){if(preference.matches||document.hidden||clip.paused||clip.readyState<3||timer!==null)return;if(!initialized){initialized=true;paint()}text.style.animationPlayState='running';started=performance.now();timer=setTimeout(advance,remaining)}
function advance(){timer=null;if(phase==='show'){phase='hide';remaining=600}else{index=(index+1)%phrases.length;phase='show';remaining=2200}paint();resume()}
function preferenceChanged(){suspend();index=0;phase='show';remaining=2200;initialized=false;text.textContent='это '+phrases[0];text.classList.remove('hero-phrase-show','hero-phrase-hide');resume()}
clip.addEventListener('playing',resume);clip.addEventListener('pause',suspend);clip.addEventListener('waiting',suspend);clip.addEventListener('stalled',suspend);document.addEventListener('visibilitychange',()=>document.hidden?suspend():resume());preference.addEventListener('change',preferenceChanged);resume();
})();
