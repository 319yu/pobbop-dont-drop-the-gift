import './style.css';
import { GiftGame } from './game.js';
import { SoundStudio } from './audio.js';
import { COLORS, titleFor } from './config.js';

const app=document.querySelector('#app');
document.documentElement.style.setProperty('--game-bg', `url('${import.meta.env.BASE_URL}assets/ai-editorial-background.png')`);
app.innerHTML=`
<main class="game-shell">
  <canvas id="game" aria-label="POBBOP gift stacking game"></canvas>
  <header class="hud hidden" id="hud"><div><span>LEVEL SCORE</span><strong id="score">00</strong><small class="total-score">TOTAL <b id="totalScore">00</b></small></div><div class="stage-hud"><span id="stageName">LEVEL 1 · THE WARM-UP</span><div class="stage-track"><i id="stageProgress"></i></div><small id="stageScore">0/10 · KEEP STACKING</small></div><div class="hud-actions"><button id="sound" aria-label="Mute sound">SOUND ON</button><button id="pause" aria-label="Pause game">PAUSE</button><div><span>LIVES</span><strong id="lives">● ● ●</strong></div></div></header>
  <div class="brand"><img src="${import.meta.env.BASE_URL}POBBOP_Brand_Project/assets/logo.png" alt="POBBOP" /></div>
  <aside class="wind-meter" id="windMeter"><span>WIND SYSTEM</span><strong id="windArrow">—</strong><div class="wind-lines"><i></i><i></i><i></i></div><small id="windLabel">CALM</small></aside>
  <section class="screen start" id="start"><p class="eyebrow">POBBOP PRESENTS / 001</p><h1>DON'T DROP<br>THE GIFT!</h1><p class="subtitle">HOW HIGH CAN YOU GO?</p><button class="primary" id="startBtn">START STACKING <i>↗</i></button><p class="hint">TAP TO DROP. DON'T LET IT FALL.</p></section>
  <section class="screen pause-screen hidden" id="pauseScreen"><p class="eyebrow">TAKE A BREATH</p><h2>PAUSED.</h2><button class="primary" id="resumeBtn">KEEP STACKING</button></section>
  <section class="level-card hidden" id="levelCard"><p>LEVEL UP</p><strong id="levelTitle">CROSSWIND</strong><span id="levelDetail">THE FLOOR GETS SMALLER.</span></section>
  <section class="screen level-choice hidden" id="levelChoice"><p class="eyebrow">LEVEL COMPLETE</p><h2 id="choiceTitle">THE WARM-UP<br>IS OVER.</h2><p class="subtitle">10+ POINTS SECURED. YOUR LIVES ARE SPENT.<br>WHAT HAPPENS NEXT IS YOUR CHOICE.</p><div class="choice-actions"><button class="primary" id="nextLevelBtn">ENTER NEXT LEVEL</button><button id="endRunBtn">END THIS RUN</button></div></section>
  <section class="screen end hidden" id="end"><p class="eyebrow">THE AFTERMATH</p><h2>WHAT A<br>BEAUTIFUL MESS.</h2><p class="subtitle">YOU DON'T FOLLOW THE RULES.<br>YOU STACK THEM.</p><div class="result"><div><span>SCORE</span><strong id="finalScore">0</strong></div><div><span>BEST</span><strong id="bestScore">0</strong></div></div><p class="rank" id="rank">THE BEGINNER</p><div class="end-actions"><button class="primary" id="againBtn">TRY AGAIN</button><button id="shareBtn">SHARE MY SCORE</button><a href="https://www.pobbop.com" id="exploreBtn">EXPLORE POBBOP ↗</a></div></section>
  <div class="drop-hint hidden" id="dropHint">TAP TO DROP <span>↓</span></div><div class="flash" id="flash"></div>
</main>`;

const $=s=>document.querySelector(s), sound=new SoundStudio();
const canvas=$('#game'), shell=$('.game-shell'); let flashTimer;
const game=new GiftGame(canvas,{
  stats(score,lives,stageScore=0){$('#score').textContent=String(stageScore).padStart(2,'0');$('#totalScore').textContent=String(score).padStart(2,'0');$('#lives').textContent=['○ ○ ○','● ○ ○','● ● ○','● ● ●'][lives];},
  stage(stage,progress,wind){$('#stageName').textContent=`LEVEL ${stage.number} · ${stage.name}`;$('#stageProgress').style.width=`${Math.min(100,progress*10)}%`;$('#stageScore').textContent=progress>=10?'QUALIFIED · SPEND YOUR LIVES':`${progress}/10 · KEEP STACKING`;const arrow=Math.abs(wind)<.000002?'—':wind>0?'→':'←';$('#windArrow').textContent=arrow;$('#windLabel').textContent=stage.number===1?'CALM':Math.abs(wind)>.00002?'STRONG SHIFT':'SOFT BREEZE';$('#windMeter').classList.remove('hidden');$('#windMeter').classList.toggle('wind-left',wind<0);$('#windMeter').style.setProperty('--wind',Math.min(1,Math.abs(wind)/.000035));},
  stageClear(stage){$('#levelTitle').textContent=stage.name;$('#levelDetail').textContent=stage.number===2?'NARROWER FLOOR · SHIFTING BREEZE':'TIGHT FLOOR · WILD AIR';$('#levelCard').classList.remove('hidden');setTimeout(()=>$('#levelCard').classList.add('hidden'),1250);},
  levelChoice(stage,score,hasNext){$('#choiceTitle').innerHTML=`${stage.name}<br>IS COMPLETE.`;$('#nextLevelBtn').textContent=hasNext?'ENTER NEXT LEVEL':'ENTER ENDLESS MODE';$('#levelChoice').classList.remove('hidden');$('#dropHint').classList.add('hidden');},
  flash(text){clearTimeout(flashTimer);$('#flash').textContent=text;$('#flash').classList.add('show');flashTimer=setTimeout(()=>$('#flash').classList.remove('show'),1000);},
  pause(paused){$('#pauseScreen').classList.toggle('hidden',!paused);$('#pause').textContent=paused?'RESUME':'PAUSE';},
  shake(){shell.classList.add('shake');setTimeout(()=>shell.classList.remove('shake'),700);},
  gameOver(score){sound.stopMusic();const best=Math.max(score,Number(localStorage.getItem('pobbop-best')||0));localStorage.setItem('pobbop-best',best);$('#finalScore').textContent=score;$('#bestScore').textContent=best;$('#rank').textContent=titleFor(score);$('#hud').classList.add('hidden');$('#windMeter').classList.add('hidden');$('#dropHint').classList.add('hidden');$('#levelChoice').classList.add('hidden');$('#end').classList.remove('hidden');}
},sound);
// Useful for smoke tests and support diagnostics without coupling UI code to
// Matter internals. This can be removed from production without changing play.
window.__pobbopGame = game;

function begin(){['#start','#end','#pauseScreen','#levelChoice'].forEach(s=>$(s).classList.add('hidden'));$('#hud').classList.remove('hidden');$('#dropHint').classList.remove('hidden');sound.startMusic();game.start();}
function attemptDrop(e){if(e?.target?.closest('button,a'))return;game.drop();}
$('#startBtn').onclick=begin;$('#againBtn').onclick=begin;$('#pause').onclick=()=>game.pause();$('#resumeBtn').onclick=()=>game.pause(false);
$('#nextLevelBtn').onclick=()=>{$('#levelChoice').classList.add('hidden');$('#dropHint').classList.remove('hidden');game.nextLevel();};$('#endRunBtn').onclick=()=>game.endRun();
$('#sound').onclick=()=>{$('#sound').textContent=sound.toggle()?'SOUND OFF':'SOUND ON';};$('#sound').textContent=sound.muted?'SOUND OFF':'SOUND ON';
// Listen on the canvas itself as the primary play surface. The shell listener
// remains for the bottom drop prompt and empty safe-area around the canvas.
canvas.addEventListener('pointerdown',attemptDrop);
canvas.addEventListener('click',attemptDrop);
shell.addEventListener('pointerdown',e=>{if(e.target!==canvas)attemptDrop(e);});
function handleGameKey(e){
  if(e.code==='Space'||e.key===' '||e.key==='Spacebar'){
    e.preventDefault();
    e.stopPropagation();
    if(!e.repeat) game.drop();
    return;
  }
  if(e.key==='p'||e.key==='P'||e.key==='Escape') game.pause();
}
// Capture the key before a focused button can consume Space as a click.
document.addEventListener('keydown',handleGameKey,true);
window.addEventListener('resize',()=>game.resize());document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.state==='playing')game.pause(true);});
$('#shareBtn').onclick=()=>{const c=document.createElement('canvas');c.width=1200;c.height=1500;const x=c.getContext('2d'),score=Number($('#finalScore').textContent);x.fillStyle=COLORS.cream;x.fillRect(0,0,c.width,c.height);x.fillStyle=COLORS.ink;x.font='900 78px Arial';x.fillText("DON'T DROP",90,150);x.fillText('THE GIFT!',90,235);x.fillStyle=COLORS.lemon;x.fillRect(90,300,1020,10);x.fillStyle=COLORS.ink;x.font='700 36px Arial';x.fillText('POBBOP / STACKING CLUB',90,380);x.font='900 420px Arial';x.fillText(score,70,850);x.font='700 44px Arial';x.fillText(titleFor(score),90,970);for(let i=0;i<Math.min(score,8);i++){x.save();x.translate(600+(i%2?15:-12),1320-i*80);x.rotate((i%3-1)*.04);x.fillStyle=i%4===2?COLORS.lemon:i%4===1?COLORS.silver:COLORS.ink;x.fillRect(-170,-35,340,70);x.restore();}x.font='600 30px Arial';x.fillText('pobbop.com',90,1420);const a=document.createElement('a');a.download=`pobbop-score-${score}.png`;a.href=c.toDataURL('image/png');a.click();};
window.addEventListener('beforeunload',()=>{document.removeEventListener('keydown',handleGameKey,true);game.destroy();});
