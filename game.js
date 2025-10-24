(() => {
  // Theme
  const toggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('snake-theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  setTheme(savedTheme);
  toggle.checked = savedTheme !== 'light';
  toggle.addEventListener('change', () => setTheme(toggle.checked ? 'dark' : 'light'));
  function setTheme(t){ document.documentElement.classList.toggle('light', t==='light'); localStorage.setItem('snake-theme', t); }

  // Canvas + constants
  const canvas = document.getElementById('board');
  const ctx = canvas.getContext('2d');
  const grid = 24; // 24x24
  const cell = canvas.width / grid;

  const scoreEl = document.getElementById('score');
  const bestEl  = document.getElementById('best');
  const playBtn = document.getElementById('playBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');
  const speedSel = document.getElementById('speedSel');

  // High score
  let best = parseInt(localStorage.getItem('snake-best') || '0', 10);
  bestEl.textContent = best;

  // Game state
  let snake, dir, food, score, stepMs, lastStep, running, rafId;

  function spawnFood(){
    // ensure not on snake
    while(true){
      const x = Math.floor(Math.random()*grid);
      const y = Math.floor(Math.random()*grid);
      if(!snake.some(s => s.x===x && s.y===y)) { food = {x,y}; return; }
    }
  }

  function reset(){
    snake = [{x:12,y:12},{x:11,y:12},{x:10,y:12}];
    dir = {x:1,y:0};
    score = 0;
    scoreEl.textContent = score;
    stepMs = parseInt(speedSel.value,10);
    spawnFood();
    lastStep = performance.now();
  }

  // Movement
  function step(){
    const head = {x: snake[0].x + dir.x, y: snake[0].y + dir.y};
    // walls wrap for smoother feel
    head.x = (head.x + grid) % grid;
    head.y = (head.y + grid) % grid;

    // self collision
    if(snake.some(s => s.x===head.x && s.y===head.y)){
      running = false;
      if(rafId) cancelAnimationFrame(rafId);
      best = Math.max(best, score);
      bestEl.textContent = best;
      localStorage.setItem('snake-best', best);
      draw(true);
      return;
    }

    snake.unshift(head);
    if(head.x===food.x && head.y===food.y){
      score += 1;
      scoreEl.textContent = score;
      spawnFood();
      // slight speed up for momentum
      stepMs = Math.max(55, stepMs - 2);
    } else {
      snake.pop();
    }
  }

  function tick(now){
    if(!running){ return; }
    if(now - lastStep >= stepMs){
      lastStep = now;
      step();
    }
    draw(false);
    rafId = requestAnimationFrame(tick);
  }

  function draw(gameOver){
    // board
    ctx.clearRect(0,0,canvas.width, canvas.height);
    // grid lines faint
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--grid');
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.85;
    for(let i=1;i<grid;i++){
      ctx.beginPath();
      ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,canvas.height); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0,i*cell); ctx.lineTo(canvas.width,i*cell); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // food
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
    roundedRect(food.x*cell+4, food.y*cell+4, cell-8, cell-8, 6);

    // snake
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand').trim();
    for(let i=0;i<snake.length;i++){
      const s = snake[i];
      const r = i===0 ? 8 : 6;
      roundedRect(s.x*cell+3, s.y*cell+3, cell-6, cell-6, r);
    }

    if(gameOver){
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0,0,canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '700 28px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2 - 8);
      ctx.font = '400 16px Inter';
      ctx.fillText('Press Play to try again', canvas.width/2, canvas.height/2 + 20);
    }
  }

  function roundedRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
    ctx.fill();
  }

  // Input
  const dirs = {ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0],
                KeyW:[0,-1], KeyS:[0,1], KeyA:[-1,0], KeyD:[1,0]};
  document.addEventListener('keydown', e => {
    const d = dirs[e.code];
    if(!d) return;
    const [dx,dy] = d;
    // prevent reversal
    if(snake && (snake.length<2 || (snake[0].x + dx !== snake[1].x || snake[0].y + dy !== snake[1].y))){
      dir = {x:dx,y:dy};
    }
    e.preventDefault();
  }, {passive:false});

  // Buttons
  playBtn.addEventListener('click', () => {
    reset();
    running = true;
    if(rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(tick);
  });
  pauseBtn.addEventListener('click', () => {
    running = false;
  });
  resetBtn.addEventListener('click', () => {
    reset();
    draw(false);
  });
  speedSel.addEventListener('change', () => { stepMs = parseInt(speedSel.value,10); });

  // init
  reset();
  draw(false);
})();