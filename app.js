import {fresh,restore,submit,advance} from './game.js';
const $=id=>document.getElementById(id), main=$('main'), audio=$('audio'), KEY='ahanga-game-v1';
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock=n=>`${Math.floor((n||0)/60)}:${String(Math.floor((n||0)%60)).padStart(2,'0')}`;
const calm=matchMedia('(prefers-reduced-motion: reduce)');
let puzzles=[],state=fresh(),playingFull=false,playSequence=0,installPrompt;
let bars=[],lastLevel=-1,shownScore=0;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function notice(message){const el=$('notice');if(el)el.textContent=message;}
function stop(){playSequence++;audio.pause();audio.removeAttribute('src');audio.load();playingFull=false;}

/* ---------- Waveform: live spectrum, with a silent fallback ----------
   The analyser is best-effort. If Web Audio is unavailable or blocked the bars keep their
   stored silhouette and playback is untouched — routing must never cost us the audio. */
let audioCtx,analyser,freqData,rafId,energy=0,settling=0;
function ensureAnalyser(){
 if(analyser!==undefined)return analyser;     // null once we have tried and failed
 let src=null;analyser=null;
 try{
  const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return null;
  audioCtx=new Ctx();
  src=audioCtx.createMediaElementSource(audio);
  const node=audioCtx.createAnalyser();node.fftSize=256;node.smoothingTimeConstant=.62;
  src.connect(node);node.connect(audioCtx.destination);
  freqData=new Uint8Array(node.frequencyBinCount);analyser=node;
 }catch{
  // Re-route straight to the speakers so a half-built graph can never mute the game.
  try{if(src&&audioCtx)src.connect(audioCtx.destination);}catch{}
  analyser=null;
 }
 return analyser;
}
function restBars(){for(const bar of bars)bar.style.setProperty('--lvl',bar.dataset.peak);}
function frame(){
 let level=0;
 if(analyser&&!audio.paused&&bars.length){
  analyser.getByteFrequencyData(freqData);
  // These clips are lowpassed around 8 kHz, so only the lowest ~third of the spectrum ever
  // carries energy. Spreading bars across the full range leaves most of the row dead —
  // measured at bin 43 of 128 on real audio, not assumed.
  const bins=freqData.length,n=bars.length,top=Math.max(8,Math.floor(bins*.32));let sum=0;
  const binAt=t=>Math.min(top,Math.max(1,Math.round(1+t*(top-1))));
  for(let i=0;i<n;i++){
   const t=i/(n-1),b0=binAt(t),b1=Math.max(b0+1,binAt(Math.min(1,(i+1)/(n-1))));
   let m=0;for(let b=b0;b<b1;b++)if(freqData[b]>m)m=freqData[b];
   // Gamma curve. A raw spectrum of this material is almost flat; expanding contrast is what
   // gives the row visible movement. Exponent and tilt were tuned against live playback.
   const v=Math.min(1,Math.pow((m/255)*(.72+t*.52),2.4));sum+=v;
   const bar=bars[i],target=.1+v*.9;
   const cur=parseFloat(bar.style.getPropertyValue('--lvl'))||Number(bar.dataset.peak);
   bar.style.setProperty('--lvl',(cur+(target-cur)*.45).toFixed(3));
  }
  level=sum/n;
 }
 energy+=(level-energy)*.2;
 document.documentElement.style.setProperty('--energy',energy.toFixed(3));
 if(audio.paused&&energy<.01){settling++;if(settling>12){restBars();stopLoop();return;}}else settling=0;
 rafId=requestAnimationFrame(frame);
}
function startLoop(){if(!rafId&&!calm.matches){settling=0;rafId=requestAnimationFrame(frame);}}
function stopLoop(){if(rafId)cancelAnimationFrame(rafId);rafId=0;energy=0;
 document.documentElement.style.setProperty('--energy','0');}

function countUp(el,to){
 const from=shownScore;shownScore=to;
 if(!el)return;
 if(calm.matches||from===to){el.textContent=fa(to);return;}
 const t0=performance.now(),dur=600;let done=false;
 // Deferred, not called inline: the template already holds the true score, so if rAF never
 // runs (backgrounded tab) the correct number stays on screen instead of being overwritten.
 requestAnimationFrame(function step(now){
  const p=Math.min(1,(now-t0)/dur),eased=1-Math.pow(1-p,3);
  el.textContent=fa(Math.round(from+(to-from)*eased));
  if(p<1)requestAnimationFrame(step);else done=true;
 });
 // rAF is paused in a backgrounded tab, which would strand the counter mid-animation.
 // setTimeout still fires there, so the real number always lands.
 setTimeout(()=>{if(!done)el.textContent=fa(to);},dur+150);
}

function render(){
 stop();stopLoop();
 const changed=state.level!==lastLevel;lastLevel=state.level;
 main.classList.toggle('round-enter',changed);
 if(state.level===puzzles.length){
 main.innerHTML=`<section class="result"><div class="hero"><div class="wrap"><p class="eyebrow">پایان این دور</p><h1>چه حافظهٔ آهنگی‌ای!</h1><p class="instruction">هر آهنگ، یه خاطره بود.</p></div></div><div class="wrap"><div class="score-panel"><div class="big-score" id="bigScore">${fa(state.score)}</div><div class="outof">از ${fa(puzzles.length*100)} امتیاز</div></div></div><div class="actions"><div class="wrap"><button class="primary" id="share">دوستاتو به چالش بکش ↗</button><button class="small full" id="again">یه دور دیگه</button><p id="notice" class="notice" role="status"></p></div></div></section>`;
 bars=[];shownScore=0;countUp($('bigScore'),state.score);
 $('share').onclick=share;$('again').onclick=()=> $('restart').showModal();return;
 }
 const p=puzzles[state.level];
 const lo=Math.min(...p.peaks),span=Math.max(.001,Math.max(...p.peaks)-lo);
 const peak=v=>(.18+((v-lo)/span)*.82).toFixed(3);
 main.innerHTML=`<section class="subnav"><div class="wrap topline"><span class="stage">مرحلهٔ ${fa(state.level+1)} از ${fa(puzzles.length)}</span><span class="score"><b id="scoreNum">${fa(state.score)}</b> امتیاز</span></div><div class="steps" aria-label="پیشرفت بازی">${puzzles.map((_,i)=>`<span class="step ${i<state.level?'done':i===state.level?'current':''}"></span>`).join('')}</div></section><section class="hero"><div class="wrap"><p class="eyebrow">حافظهٔ آهنگیت رو امتحان کن</p><h1>${state.resolved?(state.won?'آره، خودشه!':'این یکی یادت بمونه!'):'آخرش چی می‌گه؟'}</h1><p class="instruction">${state.resolved?(state.won?`${fa(state.hinted?70:100)} امتیاز گرفتی. بریم آهنگ بعدی؟`:'اشکالی نداره؛ آهنگ بعدی منتظرته.'):'گوش بده و کلمه یا عبارت جاافتاده رو بنویس.'}</p></div></section><section class="player" aria-label="پخش آهنگ"><div class="wrap"><div class="deck"><div class="player-head"><span id="clipLabel">تکهٔ آهنگ</span><span class="hearts" role="img" aria-label="${fa(state.lives)} فرصت باقی مانده">${Array.from({length:3},(_,i)=>`<i class="${i<state.lives?'':'spent'}"></i>`).join('')}</span></div><div class="wave" aria-hidden="true">${p.peaks.map(v=>`<i data-peak="${peak(v)}" style="--peak:${peak(v)}"></i>`).join('')}</div><div class="player-bottom"><button class="play" id="play">▶ پخش آهنگ</button><span id="clock" class="clock">0:00 / ${clock(p.duration)}</span></div></div></div></section><section class="answer"><div class="wrap"><p class="notice" id="notice" role="status" aria-live="polite"></p>${state.resolved?`<div class="answer-card"><p>جای خالی این بود</p><strong>${esc(p.ans)}</strong><p class="song">${esc(p.title.replace(/\(ایده.*?\)/g,'').trim())}</p></div><button id="long" class="small full">♫ شنیدن نسخهٔ بلندتر</button><button id="next" class="primary">${state.level===puzzles.length-1?'نتیجهٔ بازی':'آهنگ بعدی ←'}</button>`:`<form id="guess"><label for="answer" class="field-label">جای خالی رو پُر کن</label><input id="answer" name="answer" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="120" placeholder="فکر کنم می‌گه…" value="${esc(state.draft)}" enterkeyhint="done"><button class="primary" type="submit">این جواب منه ←</button></form><button id="hint" class="hint" ${state.hinted?'disabled':''}>${state.hinted?'راهنما فعال شد': '<b>یه راهنمایی کوچیک؟</b> ۳۰ امتیاز کمتر'}</button>${state.hinted?`<div class="lyrics">${esc(p.lyrics)} …</div>`:''}<p class="footnote">فاصله و نیم‌فاصله مهم نیست</p>`}</div></section>`;
 bars=[...main.querySelectorAll('.wave i')];
 countUp($('scoreNum'),state.score);
 $('play').onclick=()=>play(false);
 if(state.resolved){$('long').onclick=()=>play(true);$('next').onclick=()=>{advance(state);save();render();window.scrollTo({top:0,behavior:'instant'});};}
 else{
 $('answer').oninput=e=>{state.draft=e.target.value;save();};
 $('guess').onsubmit=e=>{e.preventDefault();const result=submit(state,$('answer').value,p.ans);if(result==='empty'){notice('اول جوابت رو بنویس.');return;}document.activeElement?.blur();save();render();if(result==='wrong')notice('این نبود! دوباره گوش بده و امتحان کن.');};
 $('hint').onclick=()=>{state.hinted=true;save();render();};
 }
}
function play(wantFull){
 const p=puzzles[state.level];if(!p)return;
 const src=new URL(`./audio/${wantFull?'full':'clip'}_${p.id}.m4a`,location.href).href;
 if(audio.src!==src){playSequence++;audio.pause();audio.src=src;playingFull=wantFull;}
 else if(!audio.paused){audio.pause();return;}
 if(audio.ended)audio.currentTime=0;
 const request=++playSequence;
 $('play').textContent='در حال پخش…';notice('');
 // Built inside the tap handler so mobile browsers accept both playback and the AudioContext.
 ensureAnalyser();if(audioCtx&&audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
 const promise=audio.play();
 if(promise)promise.catch(error=>{if(request!==playSequence)return;$('play').textContent='↻ تلاش دوباره';notice(error.name==='NotAllowedError'?'برای پخش، یک بار دیگر دکمه را بزن.':'صدا دریافت نشد؛ اتصال اینترنت را بررسی کن و دوباره بزن.');});
}
audio.addEventListener('play',()=>{if($('play'))$('play').textContent='Ⅱ توقف';if($('clipLabel'))$('clipLabel').textContent=playingFull?'نسخهٔ بلندتر':'تکهٔ آهنگ';startLoop();});
audio.addEventListener('pause',()=>{if($('play'))$('play').textContent='▶ ادامهٔ پخش';});
audio.addEventListener('ended',()=>{if($('play'))$('play').textContent='↻ دوباره گوش بده';});
audio.addEventListener('timeupdate',()=>{if($('clock'))$('clock').textContent=`${clock(audio.currentTime)} / ${clock(audio.duration)}`;const done=audio.currentTime/(audio.duration||1);bars.forEach((bar,i)=>bar.classList.toggle('heard',i/bars.length<done));});
audio.addEventListener('error',()=>{if(audio.getAttribute('src')){notice('صدا باز نشد؛ دوباره دکمهٔ پخش را بزن.');if($('play'))$('play').textContent='↻ تلاش دوباره';}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause();});
async function share(){
 const data={title:'آهنگا رو یادته؟',text:`من ${fa(state.score)} از ${fa(puzzles.length*100)} امتیاز گرفتم! تو چند تا آهنگو یادته؟`,url:new URL('./',location.href).href};
 try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(`${data.text}\n${data.url}`);notice('لینک کپی شد؛ برای دوستات بفرست.');}}catch(e){if(e.name!=='AbortError')notice('لینک صفحه را از نوار آدرس کپی کن و برای دوستات بفرست.');}
}
$('installHelp').onclick=()=>$('help').showModal();$('closeHelp').onclick=()=>$('help').close();
$('cancelRestart').onclick=()=>$('restart').close();$('confirmRestart').onclick=()=>{$('restart').close();state=fresh();lastLevel=-1;shownScore=0;save();render();};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('install').hidden=false;$('installHelp').hidden=true;});
$('install').onclick=async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;$('install').hidden=true;$('installHelp').hidden=false;};
window.addEventListener('appinstalled',()=>{$('install').hidden=true;$('installHelp').hidden=true;});
if(matchMedia('(display-mode: standalone)').matches||navigator.standalone)$('installHelp').hidden=true;
async function offlineSetup(){
 if(!('serviceWorker'in navigator)){$('offline').textContent='در این مرورگر، بازی به اینترنت نیاز دارد';return;}
 $('offline').textContent='آهنگا برای بازی آفلاین ذخیره می‌شن…';
 try{
  const registration=await navigator.serviceWorker.register('./sw.js');
  await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>reject(Error('offline-timeout')),90000);
   navigator.serviceWorker.ready.then(()=>{clearTimeout(timeout);resolve();});
   const worker=registration.installing;
   if(worker)worker.addEventListener('statechange',()=>{if(worker.state==='redundant'){clearTimeout(timeout);reject(Error('offline-install'));}});
  });
  const ready=await caches.has('ahanga-offline-v3');
  if(ready){$('offline').textContent='آمادهٔ بازی آفلاین ✓';$('offline').classList.add('ready');}
 }catch{$('offline').textContent='بازی آنلاین آماده است؛ ذخیرهٔ آفلاین انجام نشد';}
}
try{
 const r=await fetch('./puzzles.json');if(!r.ok)throw Error('puzzles');puzzles=await r.json();
 let raw=null;try{raw=localStorage.getItem(KEY);}catch{}state=restore(raw,puzzles.length);render();offlineSetup();
}catch{main.innerHTML='<div class="wrap"><div class="loading"><p>آهنگا دریافت نشدن. اینترنت رو بررسی کن.</p><button class="primary" id="retry">تلاش دوباره</button></div></div>';$('retry').onclick=()=>location.reload();}
