/* Browser adaptation of secureprospective.com-hero.js. The original ticker algorithm is retained; Astro-only imports are removed for this local shell. */
(function(){
  var frame=null, running=false, phase=0, observer=null, canvas=null, onResize=null;
  var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function size(){if(!canvas||!canvas.parentElement)return;var r=canvas.parentElement.getBoundingClientRect();canvas.width=Math.max(1,Math.round(r.width*devicePixelRatio));canvas.height=Math.max(1,Math.round(r.height*devicePixelRatio));}
  function draw(ctx){var w=ctx.canvas.width,h=ctx.canvas.height;if(!w||!h)return;ctx.clearRect(0,0,w,h);var pitch=28*devicePixelRatio,rows=Math.ceil(h/pitch)+1,dash=10*devicePixelRatio,gap=8*devicePixelRatio,period=dash+gap;for(var row=0;row<=rows;row++){var y=row*pitch+pitch/2,direction=row%2===0?1:-1,offset=(phase*40*devicePixelRatio*direction%period+period)%period,rowPhase=row*.37%(Math.PI*2);for(var x=-period;x<w+period;x+=period){var drawX=x-offset,p=Math.sin(drawX/w*Math.PI*2+phase*1.4+rowPhase)*.5+.5,hot=p>.88,a=.1+p*.3;ctx.fillStyle=hot?'rgba(255, 215, 0, '+Math.min(1,a+.5).toFixed(2)+')':'rgba(0, 51, 160, '+a.toFixed(2)+')';ctx.fillRect(drawX,y-devicePixelRatio,dash,2*devicePixelRatio);}}phase+=.012;}
  function stop(){running=false;if(frame){cancelAnimationFrame(frame);frame=null;}}
  function loop(){if(!running)return;var c=canvas&&canvas.getContext('2d');if(!c){stop();return;}draw(c);frame=requestAnimationFrame(loop);}
  function start(){if(running||!canvas)return;size();var c=canvas.getContext('2d');if(!c)return;if(reduced){draw(c);return;}running=true;loop();}
  function boot(){canvas=document.getElementById('hero-fx-canvas');if(!canvas)return;onResize=function(){if(canvas&&canvas.offsetWidth>0){size();}};window.addEventListener('resize',onResize);document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else if(canvas&&canvas.offsetWidth>0)start();});observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting&&canvas&&canvas.offsetWidth>0)start();else stop();});},{threshold:.05});observer.observe(canvas);if(canvas.offsetWidth>0)start();}
  window.spHero={stop:stop,start:start};document.addEventListener('DOMContentLoaded',boot);
})();
