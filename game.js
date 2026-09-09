export const normalize=s=>String(s).normalize('NFKC').replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[\p{M}\p{Z}\p{P}\p{Cf}\sـ]/gu,'');
export const fresh=()=>({level:0,score:0,lives:3,hinted:false,resolved:false,won:false,draft:''});
export function restore(raw,total){
 try{const s=JSON.parse(raw);if(!s||!Number.isInteger(s.level)||s.level<0||s.level>total||!Number.isInteger(s.score)||s.score<0||s.score>total*100||!Number.isInteger(s.lives)||s.lives<0||s.lives>3||typeof s.hinted!=='boolean'||typeof s.resolved!=='boolean'||typeof s.won!=='boolean'||typeof s.draft!=='string')return fresh();return s;}catch{return fresh();}
}
export function submit(s,input,expected){
 if(s.resolved||!normalize(input))return 'empty';
 if(normalize(input)===normalize(expected)){s.won=true;s.resolved=true;s.score+=s.hinted?70:100;s.draft='';return 'correct';}
 s.lives=Math.max(0,s.lives-1);s.resolved=s.lives===0;s.draft='';return s.resolved?'revealed':'wrong';
}
export function advance(s){if(!s.resolved)return;s.level++;s.lives=3;s.hinted=false;s.resolved=false;s.won=false;s.draft='';}
