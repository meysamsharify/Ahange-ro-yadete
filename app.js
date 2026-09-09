import {fresh,restore,submit,advance} from './game.js';
const $=id=>document.getElementById(id), main=$('main'), audio=$('audio'), KEY='ahanga-game-v1';
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clock=n=>`${Math.floor((n||0)/60)}:${String(Math.floor((n||0)%60)).padStart(2,'0')}`;
let puzzles=[],state=fresh(),playingFull=false,playSequence=0,installPrompt;
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
function notice(message){const el=$('notice');if(el)el.textContent=message;}
function stop(){playSequence++;audio.pause();audio.removeAttribute('src');audio.load();playingFull=false;}
function render(){
 stop();
 if(state.level===puzzles.length){
 main.innerHTML=`<section class="result"><p class="eyebrow">پایان این دور</p><h1>چه حافظهٔ آهنگی‌ای!</h1><p class="instruction">هر آهنگ، یه خاطره بود.</p><div class="big-score">${fa(state.score)}</div><div class="outof">از ${fa(puzzles.length*100)} امتیاز</div><button class="primary" id="share">دوستاتو به چالش بکش ↗</button><button class="small" id="again">یه دور دیگه</button><p id="notice" class="notice" role="status"></p></section>`;
 $('share').onclick=share;$('again').onclick=()=> $('restart').showModal();return;
 }
 const p=puzzles[state.level];
 main.innerHTML=`<div class="topline"><span class="stage">مرحلهٔ ${fa(state.level+1)} از ${fa(puzzles.length)}</span><span class="score"><b>${fa(state.score)}</b> امتیاز</span></div><div class="steps" aria-label="پیشرفت بازی">${puzzles.map((_,i)=>`<span class="step ${i<state.level?'done':i===state.level?'current':''}"></span>`).join('')}</div><p class="eyebrow">حافظهٔ آهنگیت رو امتحان کن</p><h1>${state.resolved?(state.won?'آره، خودشه!':'این یکی یادت بمونه!'):'آخرش چی می‌گه؟'}</h1><p class="instruction">${state.resolved?(state.won?`${fa(state.hinted?70:100)} امتیاز گرفتی. بریم آهنگ بعدی؟`:'اشکالی نداره؛ آهنگ بعدی منتظرته.'):'گوش بده و کلمه یا عبارت جاافتاده رو بنویس.'}</p><section class="player" aria-label="پخش آهنگ"><div class="player-head"><span id="clipLabel">تکهٔ آهنگ</span><span class="hearts" aria-label="${fa(state.lives)} فرصت باقی مانده">${'♥'.repeat(state.lives)}${'♡'.repeat(3-state.lives)}</span></div><div class="wave" aria-hidden="true">${p.peaks.map(v=>`<i style="height:${Math.max(7,v*80)}px"></i>`).join('')}</div><div class="player-bottom"><button class="play" id="play">▶ پخش آهنگ</button><span id="clock" class="clock">0:00 / ${clock(p.duration)}</span></div></section><p class="notice" id="notice" role="status" aria-live="polite"></p>${state.resolved?`<div class="answer-card"><p>جای خالی این بود</p><strong>${esc(p.ans)}</strong><p class="song">${esc(p.title.replace(/\(ایده.*?\)/g,'').trim())}</p></div><button id="long" class="small full">♫ شنیدن نسخهٔ بلندتر</button><button id="next" class="primary">${state.level===puzzles.length-1?'نتیجهٔ بازی':'آهنگ بعدی ←'}</button>`:`<form id="guess"><label for="answer" class="field-label">جای خالی رو پُر کن</label><input id="answer" name="answer" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="120" placeholder="فکر کنم می‌گه…" value="${esc(state.draft)}" enterkeyhint="done"><button class="primary" type="submit">این جواب منه ←</button></form><button id="hint" class="hint" ${state.hinted?'disabled':''}>${state.hinted?'راهنما فعال شد': '<b>یه راهنمایی کوچیک؟</b> • ۳۰ امتیاز کمتر'}</button>${state.hinted?`<div class="lyrics">${esc(p.lyrics)} …</div>`:''}<p class="footnote">فاصله و نیم‌فاصله مهم نیست</p>`}`;
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
 // Invoke synchronously in the tap handler so mobile browsers accept playback.
 const promise=audio.play();
 if(promise)promise.catch(error=>{if(request!==playSequence)return;$('play').textContent='↻ تلاش دوباره';notice(error.name==='NotAllowedError'?'برای پخش، یک بار دیگر دکمه را بزن.':'صدا دریافت نشد؛ اتصال اینترنت را بررسی کن و دوباره بزن.');});
}
audio.addEventListener('play',()=>{if($('play'))$('play').textContent='Ⅱ توقف';if($('clipLabel'))$('clipLabel').textContent=playingFull?'نسخهٔ بلندتر':'تکهٔ آهنگ';});
audio.addEventListener('pause',()=>{if($('play'))$('play').textContent='▶ ادامهٔ پخش';});
audio.addEventListener('ended',()=>{if($('play'))$('play').textContent='↻ دوباره گوش بده';});
audio.addEventListener('timeupdate',()=>{if($('clock'))$('clock').textContent=`${clock(audio.currentTime)} / ${clock(audio.duration)}`;const bars=document.querySelectorAll('.wave i');bars.forEach((bar,i)=>bar.classList.toggle('heard',i/bars.length<audio.currentTime/(audio.duration||1)));});
audio.addEventListener('error',()=>{if(audio.getAttribute('src')){notice('صدا باز نشد؛ دوباره دکمهٔ پخش را بزن.');if($('play'))$('play').textContent='↻ تلاش دوباره';}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause();});
async function share(){
 const data={title:'آهنگا رو یادته؟',text:`من ${fa(state.score)} از ${fa(puzzles.length*100)} امتیاز گرفتم! تو چند تا آهنگو یادته؟`,url:new URL('./',location.href).href};
 try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(`${data.text}\n${data.url}`);notice('لینک کپی شد؛ برای دوستات بفرست.');}}catch(e){if(e.name!=='AbortError')notice('لینک صفحه را از نوار آدرس کپی کن و برای دوستات بفرست.');}
}
$('installHelp').onclick=()=>$('help').showModal();$('closeHelp').onclick=()=>$('help').close();
$('cancelRestart').onclick=()=>$('restart').close();$('confirmRestart').onclick=()=>{$('restart').close();state=fresh();save();render();};
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
  const ready=await caches.has('ahanga-offline-v1');
  if(ready){$('offline').textContent='آمادهٔ بازی آفلاین ✓';$('offline').classList.add('ready');}
 }catch{$('offline').textContent='بازی آنلاین آماده است؛ ذخیرهٔ آفلاین انجام نشد';}
}
try{
 const r=await fetch('./puzzles.json');if(!r.ok)throw Error('puzzles');puzzles=await r.json();
 let raw=null;try{raw=localStorage.getItem(KEY);}catch{}state=restore(raw,puzzles.length);render();offlineSetup();
}catch{main.innerHTML='<div class="loading"><p>آهنگا دریافت نشدن. اینترنت رو بررسی کن.</p><button class="primary" id="retry">تلاش دوباره</button></div>';$('retry').onclick=()=>location.reload();}
