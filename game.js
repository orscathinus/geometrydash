(() => {
'use strict';
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const ui = {
menu: document.getElementById('menuScreen'),
pause: document.getElementById('pauseScreen'),
result: document.getElementById('resultScreen'),
hud: document.getElementById('hud'),
pauseButton: document.getElementById('pauseButton'),
progressFill: document.getElementById('progressFill'),
progressValue: document.getElementById('progressValue'),
attemptValue: document.getElementById('attemptValue'),
bestValue: document.getElementById('bestValue'),
resultAttempts: document.getElementById('resultAttempts'),
resultEyebrow: document.getElementById('resultEyebrow'),
resultTitle: document.getElementById('resultTitle'),
resultCopy: document.getElementById('resultCopy'),
mute: document.getElementById('muteButton'),
fullscreen: document.getElementById('fullscreenButton'),
touchHint: document.getElementById('touchHint')
};
const WIDTH = 1280;
const HEIGHT = 720;
const GROUND_Y = 570;
const PLAYER_X = 260;
const TILE = 56;
const LEVEL_END = 17350;
const GRAVITY = 2700;
const JUMP_FORCE = -930;
const SPEED_START = 430;
const SPEED_MAX = 590;
const COLORS = {
cyan: '#40f4ff',
blue: '#4b7cff',
pink: '#ff4fd8',
yellow: '#ffe45a',
white: '#f8fbff'
};
let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
let state = 'menu';
let mode = 'normal';
let muted = localStorage.getItem('neonDashMuted') === 'true';
let attempt = Number(localStorage.getItem('neonDashAttempts') || 0);
let best = Number(localStorage.getItem('neonDashBest') || 0);
let lastTime = performance.now();
let elapsed = 0;
let shake = 0;
let flash = 0;
let scrollX = 0;
let speed = SPEED_START;
let checkpoint = null;
let checkpointCooldown = 0;
let trailTimer = 0;
const player = {
y: GROUND_Y - 44,
size: 44,
vy: 0,
rotation: 0,
grounded: true,
coyote: 0,
alive: true,
squish: 0
};
const particles = [];
const pulses = [];
const level = buildLevel();
function buildLevel() {
const objects = [];
const addSpike = (x, y = GROUND_Y, flip = false) => objects.push({ type: 'spike', x, y, w: 48, h: 48, flip });
const addBlock = (x, y, w = TILE, h = TILE) => objects.push({ type: 'block', x, y, w, h });
const addPad = (x, power = 1.18) => objects.push({ type: 'pad', x, y: GROUND_Y - 9, w: 52, h: 9, power, used: false });
const addOrb = (x, y, power = 1.04) => objects.push({ type: 'orb', x, y, w: 34, h: 34, power, used: false });
const addGap = (x, w) => objects.push({ type: 'gap', x, y: GROUND_Y, w, h: HEIGHT - GROUND_Y });
const addSaw = (x, y, r = 30, range = 0, phase = 0) => objects.push({ type: 'saw', x, y, r, range, phase });
const row = (start, count, spacing = 58) => { for (let i = 0; i < count; i++) addSpike(start + i * spacing); };
addSpike(900);
addSpike(1230);
row(1580, 2);
addBlock(2040, GROUND_Y - 70, 70, 70);
addSpike(2130);
addSpike(2420);
addSpike(2480);
addPad(2740);
row(2870, 4, 54);
addBlock(3250, GROUND_Y - 105, 95, 105);
addSpike(3375);
addGap(3660, 170);
addBlock(3830, GROUND_Y - 72, 190, 72);
addSpike(4070);
addSpike(4290);
addBlock(4580, GROUND_Y - 64, 64, 64);
addBlock(4644, GROUND_Y - 128, 64, 128);
addSpike(4770);
addOrb(5015, GROUND_Y - 155);
addGap(5070, 230);
addBlock(5300, GROUND_Y - 100, 270, 100);
addSpike(5610);
row(5850, 3, 54);
addPad(6130, 1.28);
addSaw(6300, GROUND_Y - 26, 36);
addSaw(6415, GROUND_Y - 26, 36);
addSaw(6530, GROUND_Y - 26, 36);
addBlock(6740, GROUND_Y - 115, 115, 115);
addSpike(6875);
addSpike(6940);
addGap(7200, 150);
addBlock(7350, GROUND_Y - 65, 130, 65);
addGap(7480, 130);
addBlock(7610, GROUND_Y - 130, 130, 130);
addGap(7740, 145);
addBlock(7885, GROUND_Y - 72, 180, 72);
addSpike(8170);
addSaw(8420, GROUND_Y - 78, 30, 74, 0);
addSaw(8580, GROUND_Y - 78, 30, 74, Math.PI);
addSpike(8840);
addSpike(8900);
addPad(9180, 1.12);
addSpike(9295);
addSpike(9350);
addSpike(9405);
addOrb(9550, GROUND_Y - 180, 1.1);
addGap(9640, 320);
addBlock(9960, GROUND_Y - 115, 250, 115);
addSpike(10250);
addBlock(10500, GROUND_Y - 58, 58, 58);
addBlock(10558, GROUND_Y - 116, 58, 116);
addBlock(10616, GROUND_Y - 174, 58, 174);
addSpike(10720);
addSpike(10960);
addSaw(11250, GROUND_Y - 28, 38);
addGap(11460, 180);
addBlock(11640, GROUND_Y - 82, 220, 82);
row(11940, 3, 56);
addOrb(12210, GROUND_Y - 152, 1.04);
addGap(12280, 230);
addBlock(12510, GROUND_Y - 92, 270, 92);
addSaw(12920, GROUND_Y - 98, 33, 100, 0.7);
addSaw(13100, GROUND_Y - 98, 33, 100, 3.2);
addSpike(13360);
addSpike(13420);
addSpike(13680);
addPad(13930, 1.3);
row(14050, 5, 55);
addBlock(14400, GROUND_Y - 125, 300, 125);
addSpike(14750);
addGap(15020, 160);
addBlock(15180, GROUND_Y - 62, 120, 62);
addGap(15300, 160);
addBlock(15460, GROUND_Y - 120, 130, 120);
addGap(15590, 170);
addBlock(15760, GROUND_Y - 75, 210, 75);
addSpike(16040);
addSaw(16280, GROUND_Y - 36, 42);
addSpike(16530);
addSpike(16588);
addSpike(16870);
return objects.sort((a, b) => a.x - b.x);
}
class SoundEngine {
constructor() {
this.ctx = null;
this.master = null;
this.nextBeat = 0;
this.beatIndex = 0;
this.bpm = 150;
}
init() {
if (this.ctx) return;
const AudioContext = window.AudioContext || window.webkitAudioContext;
if (!AudioContext) return;
this.ctx = new AudioContext();
this.master = this.ctx.createGain();
this.master.gain.value = muted ? 0 : 0.22;
this.master.connect(this.ctx.destination);
this.nextBeat = this.ctx.currentTime + 0.05;
}
resume() {
this.init();
if (this.ctx?.state === 'suspended') this.ctx.resume();
}
setMuted(value) {
muted = value;
localStorage.setItem('neonDashMuted', String(value));
if (this.master && this.ctx) this.master.gain.setTargetAtTime(value ? 0 : 0.22, this.ctx.currentTime, 0.02);
}
tone(freq, duration, type = 'square', volume = 0.12, when = 0) {
if (!this.ctx || muted) return;
const t = Math.max(this.ctx.currentTime, this.ctx.currentTime + when);
const osc = this.ctx.createOscillator();
const gain = this.ctx.createGain();
osc.type = type;
osc.frequency.setValueAtTime(freq, t);
gain.gain.setValueAtTime(0.0001, t);
gain.gain.exponentialRampToValueAtTime(volume, t + 0.008);
gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
osc.connect(gain);
gain.connect(this.master);
osc.start(t);
osc.stop(t + duration + 0.03);
}
noise(duration = 0.12, volume = 0.12) {
if (!this.ctx || muted) return;
const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
const data = buffer.getChannelData(0);
for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
const source = this.ctx.createBufferSource();
const filter = this.ctx.createBiquadFilter();
const gain = this.ctx.createGain();
filter.type = 'highpass';
filter.frequency.value = 650;
gain.gain.setValueAtTime(volume, this.ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
source.buffer = buffer;
source.connect(filter);
filter.connect(gain);
gain.connect(this.master);
source.start();
}
jump() { this.tone(330, 0.08, 'square', 0.08); this.tone(495, 0.1, 'triangle', 0.06, 0.025); }
orb() { this.tone(620, 0.08, 'sine', 0.1); this.tone(930, 0.16, 'triangle', 0.07, 0.04); }
crash() { this.noise(0.25, 0.2); this.tone(90, 0.28, 'sawtooth', 0.12); }
win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.1, i * 0.11)); }
updateMusic() {
if (!this.ctx || muted || state !== 'playing') return;
const beatLength = 60 / this.bpm / 2;
while (this.nextBeat < this.ctx.currentTime + 0.12) {
const pattern = [110, 110, 165, 110, 196, 165, 147, 165];
const note = pattern[this.beatIndex % pattern.length];
const accent = this.beatIndex % 4 === 0;
this.tone(note, accent ? 0.14 : 0.07, 'square', accent ? 0.055 : 0.032, this.nextBeat - this.ctx.currentTime);
if (this.beatIndex % 2 === 0) this.tone(note * 2, 0.055, 'triangle', 0.018, this.nextBeat - this.ctx.currentTime);
this.nextBeat += beatLength;
this.beatIndex++;
}
}
resetMusic() {
if (!this.ctx) return;
this.nextBeat = this.ctx.currentTime + 0.04;
this.beatIndex = 0;
}
}
const sound = new SoundEngine();
function resizeCanvas() {
dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
const rect = canvas.getBoundingClientRect();
canvas.width = Math.round(rect.width * dpr);
canvas.height = Math.round(rect.height * dpr);
ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
}
function resetPlayer(fromCheckpoint = false) {
const cp = fromCheckpoint ? checkpoint : null;
scrollX = cp?.scrollX ?? 0;
player.y = cp?.y ?? GROUND_Y - player.size;
player.vy = 0;
player.rotation = cp?.rotation ?? 0;
player.grounded = true;
player.coyote = 0.08;
player.alive = true;
player.squish = 0;
speed = Math.min(SPEED_MAX, SPEED_START + scrollX * 0.007);
elapsed = cp?.elapsed ?? 0;
checkpointCooldown = 1.5;
particles.length = 0;
pulses.length = 0;
level.forEach(o => { if ('used' in o) o.used = false; });
}
function beginGame() {
sound.resume();
sound.resetMusic();
attempt += 1;
localStorage.setItem('neonDashAttempts', String(attempt));
checkpoint = null;
resetPlayer(false);
state = 'playing';
ui.menu.classList.add('hidden');
ui.pause.classList.add('hidden');
ui.result.classList.add('hidden');
ui.hud.classList.remove('hidden');
ui.pauseButton.classList.remove('hidden');
ui.attemptValue.textContent = attempt;
if (matchMedia('(pointer: coarse)').matches) {
ui.touchHint.classList.add('show');
setTimeout(() => ui.touchHint.classList.remove('show'), 1700);
}
}
function showMenu() {
state = 'menu';
ui.menu.classList.remove('hidden');
ui.pause.classList.add('hidden');
ui.result.classList.add('hidden');
ui.hud.classList.add('hidden');
ui.pauseButton.classList.add('hidden');
resetPlayer(false);
}
function pauseGame() {
if (state !== 'playing') return;
state = 'paused';
ui.pause.classList.remove('hidden');
ui.pauseButton.classList.add('hidden');
}
function resumeGame() {
if (state !== 'paused') return;
sound.resume();
sound.resetMusic();
state = 'playing';
ui.pause.classList.add('hidden');
ui.pauseButton.classList.remove('hidden');
lastTime = performance.now();
}
function completeLevel() {
if (state !== 'playing') return;
state = 'complete';
best = 100;
localStorage.setItem('neonDashBest', '100');
sound.win();
burst(PLAYER_X + player.size / 2, player.y + player.size / 2, COLORS.cyan, 42, 420);
ui.hud.classList.add('hidden');
ui.pauseButton.classList.add('hidden');
setTimeout(() => showResult(true), 650);
}
function showResult(won) {
const progress = Math.min(100, Math.floor(scrollX / LEVEL_END * 100));
ui.resultEyebrow.textContent = won ? 'LEVEL COMPLETE' : mode === 'practice' ? 'CHECKPOINT REACHED' : 'ATTEMPT OVER';
ui.resultTitle.textContent = won ? '100%' : `${progress}%`;
ui.resultCopy.textContent = won ? 'You cleared the course.' : mode === 'practice' ? 'Restarting from your latest checkpoint.' : 'One more run. You have this.';
ui.bestValue.textContent = `${Math.round(best)}%`;
ui.resultAttempts.textContent = attempt;
ui.result.classList.remove('hidden');
}
function die() {
if (!player.alive || state !== 'playing') return;
player.alive = false;
state = 'dead';
shake = 22;
flash = 0.6;
sound.crash();
burst(PLAYER_X + player.size / 2, player.y + player.size / 2, COLORS.pink, 34, 520);
const progress = Math.min(100, scrollX / LEVEL_END * 100);
if (progress > best) {
best = progress;
localStorage.setItem('neonDashBest', String(best));
}
setTimeout(() => {
if (mode === 'practice' && checkpoint) {
resetPlayer(true);
state = 'playing';
sound.resetMusic();
} else {
showResult(false);
}
}, 700);
}
function jump() {
if (state === 'menu') return;
if (state === 'paused') { resumeGame(); return; }
if (state !== 'playing' || !player.alive) return;
sound.resume();
const orb = getNearbyOrb();
if (orb) {
orb.used = true;
player.vy = JUMP_FORCE * orb.power;
player.grounded = false;
sound.orb();
burst(orb.x - scrollX + orb.w / 2, orb.y + orb.h / 2, COLORS.yellow, 18, 230);
pulses.push({ x: orb.x, y: orb.y, age: 0, color: COLORS.yellow });
return;
}
if (player.grounded || player.coyote > 0) {
player.vy = JUMP_FORCE;
player.grounded = false;
player.coyote = 0;
player.squish = 0.2;
sound.jump();
burst(PLAYER_X + player.size / 2, player.y + player.size, COLORS.cyan, 9, 150);
}
}
function getNearbyOrb() {
const px = scrollX + PLAYER_X + player.size / 2;
const py = player.y + player.size / 2;
return level.find(o => o.type === 'orb' && !o.used && Math.abs(o.x + o.w / 2 - px) < 70 && Math.abs(o.y + o.h / 2 - py) < 85);
}
function update(dt) {
elapsed += dt;
shake = Math.max(0, shake - dt * 40);
flash = Math.max(0, flash - dt * 2.4);
updateParticles(dt);
updatePulses(dt);
if (state !== 'playing') return;
sound.updateMusic();
speed = Math.min(SPEED_MAX, SPEED_START + scrollX * 0.007);
scrollX += speed * dt;
checkpointCooldown -= dt;
trailTimer -= dt;
player.coyote -= dt;
player.squish = Math.max(0, player.squish - dt);
player.vy += GRAVITY * dt;
player.y += player.vy * dt;
const wasGrounded = player.grounded;
player.grounded = false;
resolveWorldCollisions();
if (!player.grounded) player.rotation += dt * 6.8;
else if (!wasGrounded) {
player.rotation = Math.round(player.rotation / (Math.PI / 2)) * (Math.PI / 2);
player.squish = 0.16;
burst(PLAYER_X + player.size / 2, player.y + player.size, COLORS.blue, 7, 110);
maybeCreateCheckpoint();
}
if (trailTimer <= 0) {
trailTimer = 0.025;
particles.push({
x: PLAYER_X + 7,
y: player.y + player.size * 0.7,
vx: -100 - Math.random() * 80,
vy: (Math.random() - 0.5) * 30,
life: 0.45,
age: 0,
size: 4 + Math.random() * 5,
color: Math.random() > 0.5 ? COLORS.cyan : COLORS.blue,
gravity: 0
});
}
if (player.y > HEIGHT + 100) die();
if (scrollX >= LEVEL_END) completeLevel();
const progress = Math.min(100, scrollX / LEVEL_END * 100);
ui.progressFill.style.width = `${progress}%`;
ui.progressValue.textContent = `${Math.floor(progress)}%`;
}
function resolveWorldCollisions() {
const worldPX = scrollX + PLAYER_X;
const p = { x: worldPX + 7, y: player.y + 5, w: player.size - 14, h: player.size - 8 };
const overGap = level.some(o => o.type === 'gap' && p.x + p.w > o.x + 4 && p.x < o.x + o.w - 4);
if (!overGap && player.y + player.size >= GROUND_Y && player.vy >= 0) {
player.y = GROUND_Y - player.size;
player.vy = 0;
player.grounded = true;
player.coyote = 0.08;
}
for (const o of level) {
if (o.x > worldPX + 220) break;
if (o.x + (o.w || o.r * 2 || 0) < worldPX - 100) continue;
if (o.type === 'block') {
const hit = rectsOverlap(p, o);
if (!hit) continue;
const previousBottom = player.y - player.vy / 60 + player.size;
if (player.vy >= 0 && previousBottom <= o.y + 16) {
player.y = o.y - player.size;
player.vy = 0;
player.grounded = true;
player.coyote = 0.08;
} else {
die();
return;
}
}
if (o.type === 'spike') {
const tri = o.flip
? [{ x: o.x, y: o.y - o.h }, { x: o.x + o.w, y: o.y - o.h }, { x: o.x + o.w / 2, y: o.y }]
: [{ x: o.x, y: o.y }, { x: o.x + o.w, y: o.y }, { x: o.x + o.w / 2, y: o.y - o.h }];
if (rectTriangleCollision(p, tri)) { die(); return; }
}
if (o.type === 'saw') {
const sy = o.y + Math.sin(elapsed * 2.2 + o.phase) * o.range;
const cx = o.x;
const cy = sy;
const nearestX = Math.max(p.x, Math.min(cx, p.x + p.w));
const nearestY = Math.max(p.y, Math.min(cy, p.y + p.h));
if (Math.hypot(nearestX - cx, nearestY - cy) < o.r * 0.82) { die(); return; }
}
if (o.type === 'pad' && !o.used && p.x + p.w > o.x && p.x < o.x + o.w && player.y + player.size >= o.y - 6 && player.vy >= 0) {
o.used = true;
player.vy = JUMP_FORCE * o.power;
player.grounded = false;
sound.orb();
burst(o.x - scrollX + o.w / 2, o.y, COLORS.yellow, 18, 260);
pulses.push({ x: o.x, y: o.y, age: 0, color: COLORS.yellow });
}
}
}
function maybeCreateCheckpoint() {
if (mode !== 'practice' || checkpointCooldown > 0 || scrollX < 900) return;
const worldPX = scrollX + PLAYER_X;
const dangerNearby = level.some(o => ['spike', 'gap', 'saw'].includes(o.type) && Math.abs(o.x - worldPX) < 220);
if (dangerNearby) return;
checkpoint = { scrollX, y: player.y, rotation: player.rotation, elapsed };
checkpointCooldown = 5;
pulses.push({ x: worldPX, y: player.y + player.size / 2, age: 0, color: COLORS.cyan, checkpoint: true });
}
function updateParticles(dt) {
for (let i = particles.length - 1; i >= 0; i--) {
const p = particles[i];
p.age += dt;
p.x += p.vx * dt;
p.y += p.vy * dt;
p.vy += (p.gravity ?? 500) * dt;
if (p.age >= p.life) particles.splice(i, 1);
}
}
function updatePulses(dt) {
for (let i = pulses.length - 1; i >= 0; i--) {
pulses[i].age += dt;
if (pulses[i].age > 0.8) pulses.splice(i, 1);
}
}
function burst(x, y, color, count, force) {
for (let i = 0; i < count; i++) {
const a = Math.random() * Math.PI * 2;
const f = force * (0.25 + Math.random() * 0.75);
particles.push({
x, y,
vx: Math.cos(a) * f,
vy: Math.sin(a) * f,
life: 0.35 + Math.random() * 0.55,
age: 0,
size: 3 + Math.random() * 8,
color,
gravity: 650
});
}
}
function draw() {
ctx.save();
ctx.clearRect(0, 0, WIDTH, HEIGHT);
const sx = shake ? (Math.random() - 0.5) * shake : 0;
const sy = shake ? (Math.random() - 0.5) * shake : 0;
ctx.translate(sx, sy);
drawBackground();
drawLevel();
drawPulses();
drawParticles();
if (player.alive) drawPlayer();
drawForeground();
ctx.restore();
if (flash > 0) {
ctx.fillStyle = `rgba(255,255,255,${flash})`;
ctx.fillRect(0, 0, WIDTH, HEIGHT);
}
}
function drawBackground() {
const hueShift = (scrollX / LEVEL_END) * 80;
const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
grad.addColorStop(0, `hsl(${221 + hueShift * 0.2} 72% 10%)`);
grad.addColorStop(0.58, `hsl(${229 + hueShift * 0.35} 70% 14%)`);
grad.addColorStop(1, '#050812');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, WIDTH, HEIGHT);
const pulse = 0.5 + Math.sin(elapsed * Math.PI * 5) * 0.08;
ctx.globalAlpha = 0.18;
ctx.strokeStyle = COLORS.blue;
ctx.lineWidth = 1;
const gridOffset = -((scrollX * 0.22) % 80);
for (let x = gridOffset; x < WIDTH; x += 80) {
ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
}
for (let y = 10; y < HEIGHT; y += 80) {
ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
}
ctx.globalAlpha = 1;
for (let layer = 0; layer < 3; layer++) {
const factor = 0.08 + layer * 0.07;
const base = 430 + layer * 40;
ctx.fillStyle = `rgba(${30 + layer * 12}, ${65 + layer * 17}, ${130 + layer * 22}, ${0.12 + layer * 0.06})`;
ctx.beginPath();
ctx.moveTo(0, HEIGHT);
for (let x = -100; x <= WIDTH + 100; x += 120) {
const wx = x + scrollX * factor;
const y = base - Math.sin(wx * 0.004 + layer) * (35 + layer * 15) - Math.sin(wx * 0.011) * 18;
ctx.lineTo(x, y);
}
ctx.lineTo(WIDTH, HEIGHT);
ctx.closePath();
ctx.fill();
}
ctx.globalAlpha = 0.15 + pulse * 0.1;
ctx.fillStyle = COLORS.cyan;
const beamX = WIDTH * 0.72;
ctx.beginPath();
ctx.moveTo(beamX - 20, GROUND_Y);
ctx.lineTo(beamX + 130, 0);
ctx.lineTo(beamX + 185, 0);
ctx.lineTo(beamX + 30, GROUND_Y);
ctx.fill();
ctx.globalAlpha = 1;
}
function drawLevel() {
drawGround();
const minX = scrollX - 100;
const maxX = scrollX + WIDTH + 100;
for (const o of level) {
if (o.x > maxX) break;
const ow = o.w || o.r * 2 || 0;
if (o.x + ow < minX) continue;
const x = o.x - scrollX;
if (o.type === 'gap') drawGap(x, o);
if (o.type === 'block') drawBlock(x, o);
if (o.type === 'spike') drawSpike(x, o);
if (o.type === 'pad') drawPad(x, o);
if (o.type === 'orb') drawOrb(x, o);
if (o.type === 'saw') drawSaw(x, o);
}
const finishX = LEVEL_END - scrollX;
if (finishX > -100 && finishX < WIDTH + 200) drawFinish(finishX);
}
function drawGround() {
ctx.fillStyle = '#070b17';
ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
ctx.fillStyle = 'rgba(75,124,255,0.14)';
const tileOffset = -((scrollX * 0.8) % TILE);
for (let x = tileOffset; x < WIDTH; x += TILE) {
ctx.fillRect(x + 1, GROUND_Y + 1, TILE - 2, TILE - 2);
}
ctx.strokeStyle = COLORS.cyan;
ctx.shadowColor = COLORS.cyan;
ctx.shadowBlur = 18;
ctx.lineWidth = 3;
ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(WIDTH, GROUND_Y); ctx.stroke();
ctx.shadowBlur = 0;
}
function drawGap(x, o) {
ctx.fillStyle = '#01030a';
ctx.fillRect(x, o.y - 4, o.w, HEIGHT - o.y + 10);
const g = ctx.createLinearGradient(x, 0, x + o.w, 0);
g.addColorStop(0, 'rgba(255,79,216,0.3)');
g.addColorStop(0.5, 'rgba(255,79,216,0.03)');
g.addColorStop(1, 'rgba(255,79,216,0.3)');
ctx.fillStyle = g;
ctx.fillRect(x, o.y, o.w, 7);
}
function drawBlock(x, o) {
const grad = ctx.createLinearGradient(x, o.y, x + o.w, o.y + o.h);
grad.addColorStop(0, 'rgba(49,94,190,0.96)');
grad.addColorStop(1, 'rgba(18,36,89,0.98)');
ctx.fillStyle = grad;
ctx.fillRect(x, o.y, o.w, o.h);
ctx.strokeStyle = COLORS.blue;
ctx.shadowColor = COLORS.blue;
ctx.shadowBlur = 14;
ctx.lineWidth = 3;
ctx.strokeRect(x + 1.5, o.y + 1.5, o.w - 3, o.h - 3);
ctx.shadowBlur = 0;
ctx.strokeStyle = 'rgba(255,255,255,0.12)';
ctx.strokeRect(x + 10, o.y + 10, Math.max(0, o.w - 20), Math.max(0, o.h - 20));
}
function drawSpike(x, o) {
const yBase = o.y;
ctx.save();
ctx.shadowColor = COLORS.pink;
ctx.shadowBlur = 18;
const grad = ctx.createLinearGradient(x, yBase - o.h, x + o.w, yBase);
grad.addColorStop(0, COLORS.pink);
grad.addColorStop(1, '#782fff');
ctx.fillStyle = grad;
ctx.beginPath();
if (o.flip) {
ctx.moveTo(x, yBase - o.h); ctx.lineTo(x + o.w, yBase - o.h); ctx.lineTo(x + o.w / 2, yBase);
} else {
ctx.moveTo(x, yBase); ctx.lineTo(x + o.w, yBase); ctx.lineTo(x + o.w / 2, yBase - o.h);
}
ctx.closePath(); ctx.fill();
ctx.shadowBlur = 0;
ctx.strokeStyle = 'rgba(255,255,255,0.58)';
ctx.lineWidth = 2;
ctx.stroke();
ctx.restore();
}
function drawPad(x, o) {
const glow = o.used ? 0.22 : 0.75 + Math.sin(elapsed * 8) * 0.15;
ctx.save();
ctx.shadowColor = COLORS.yellow;
ctx.shadowBlur = 22 * glow;
ctx.fillStyle = o.used ? '#6c6331' : COLORS.yellow;
ctx.fillRect(x, o.y, o.w, o.h);
ctx.restore();
}
function drawOrb(x, o) {
const pulse = 1 + Math.sin(elapsed * 6 + o.x * 0.01) * 0.12;
ctx.save();
ctx.translate(x + o.w / 2, o.y + o.h / 2);
ctx.scale(pulse, pulse);
ctx.globalAlpha = o.used ? 0.25 : 1;
ctx.shadowColor = COLORS.yellow;
ctx.shadowBlur = 24;
ctx.strokeStyle = COLORS.yellow;
ctx.lineWidth = 6;
ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();
ctx.shadowBlur = 0;
ctx.fillStyle = 'rgba(255,228,90,0.28)';
ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
ctx.restore();
}
function drawSaw(x, o) {
const y = o.y + Math.sin(elapsed * 2.2 + o.phase) * o.range;
ctx.save();
ctx.translate(x, y);
ctx.rotate(elapsed * 4.8);
ctx.shadowColor = COLORS.pink;
ctx.shadowBlur = 18;
ctx.fillStyle = '#ff4f91';
ctx.beginPath();
const teeth = 14;
for (let i = 0; i < teeth * 2; i++) {
const a = i / (teeth * 2) * Math.PI * 2;
const r = i % 2 === 0 ? o.r : o.r * 0.72;
const px = Math.cos(a) * r;
const py = Math.sin(a) * r;
i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
}
ctx.closePath(); ctx.fill();
ctx.shadowBlur = 0;
ctx.fillStyle = '#111a35';
ctx.beginPath(); ctx.arc(0, 0, o.r * 0.38, 0, Math.PI * 2); ctx.fill();
ctx.restore();
}
function drawFinish(x) {
ctx.save();
ctx.shadowColor = COLORS.cyan;
ctx.shadowBlur = 26;
ctx.fillStyle = COLORS.cyan;
ctx.fillRect(x, 150, 8, GROUND_Y - 150);
ctx.shadowBlur = 0;
ctx.fillStyle = COLORS.white;
ctx.font = '900 23px system-ui';
ctx.textAlign = 'center';
ctx.fillText('FINISH', x, 120);
ctx.restore();
}
function drawPlayer() {
const cx = PLAYER_X + player.size / 2;
const cy = player.y + player.size / 2;
const squash = player.squish > 0 ? Math.sin((player.squish / 0.2) * Math.PI) * 0.13 : 0;
ctx.save();
ctx.translate(cx, cy);
ctx.rotate(player.rotation);
ctx.scale(1 + squash, 1 - squash);
ctx.shadowColor = COLORS.cyan;
ctx.shadowBlur = 24;
const grad = ctx.createLinearGradient(-22, -22, 22, 22);
grad.addColorStop(0, '#c8ffff');
grad.addColorStop(0.4, COLORS.cyan);
grad.addColorStop(1, COLORS.blue);
ctx.fillStyle = grad;
ctx.fillRect(-22, -22, 44, 44);
ctx.shadowBlur = 0;
ctx.fillStyle = '#071126';
ctx.fillRect(-10, -8, 7, 9);
ctx.fillRect(7, -8, 7, 9);
ctx.fillRect(-10, 9, 24, 5);
ctx.strokeStyle = 'rgba(255,255,255,0.75)';
ctx.lineWidth = 2;
ctx.strokeRect(-18, -18, 36, 36);
ctx.restore();
}
function drawParticles() {
for (const p of particles) {
const alpha = 1 - p.age / p.life;
ctx.globalAlpha = Math.max(0, alpha);
ctx.fillStyle = p.color;
ctx.shadowColor = p.color;
ctx.shadowBlur = 9;
ctx.fillRect(p.x, p.y, p.size * alpha, p.size * alpha);
}
ctx.globalAlpha = 1;
ctx.shadowBlur = 0;
}
function drawPulses() {
for (const p of pulses) {
const screenX = p.x - scrollX;
const radius = 22 + p.age * 120;
ctx.globalAlpha = 1 - p.age / 0.8;
ctx.strokeStyle = p.color;
ctx.lineWidth = 4;
ctx.beginPath(); ctx.arc(screenX, p.y, radius, 0, Math.PI * 2); ctx.stroke();
}
ctx.globalAlpha = 1;
}
function drawForeground() {
const vignette = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 180, WIDTH / 2, HEIGHT / 2, 760);
vignette.addColorStop(0, 'rgba(0,0,0,0)');
vignette.addColorStop(1, 'rgba(0,0,0,0.54)');
ctx.fillStyle = vignette;
ctx.fillRect(0, 0, WIDTH, HEIGHT);
if (mode === 'practice' && checkpoint && state === 'playing') {
ctx.fillStyle = 'rgba(64,244,255,0.8)';
ctx.font = '800 13px system-ui';
ctx.textAlign = 'left';
ctx.fillText('PRACTICE CHECKPOINT ACTIVE', 24, HEIGHT - 26);
}
}
function rectsOverlap(a, b) {
return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function pointInTriangle(p, a, b, c) {
const area = (p1, p2, p3) => (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2;
const A = Math.abs(area(a, b, c));
const A1 = Math.abs(area(p, b, c));
const A2 = Math.abs(area(a, p, c));
const A3 = Math.abs(area(a, b, p));
return Math.abs(A - (A1 + A2 + A3)) < 0.6;
}
function linesIntersect(a, b, c, d) {
const ccw = (p1, p2, p3) => (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x);
return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
}
function rectTriangleCollision(r, t) {
const corners = [
{ x: r.x, y: r.y }, { x: r.x + r.w, y: r.y },
{ x: r.x + r.w, y: r.y + r.h }, { x: r.x, y: r.y + r.h }
];
if (corners.some(p => pointInTriangle(p, t[0], t[1], t[2]))) return true;
if (t.some(p => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h)) return true;
const rectEdges = [[corners[0], corners[1]], [corners[1], corners[2]], [corners[2], corners[3]], [corners[3], corners[0]]];
const triEdges = [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]];
return rectEdges.some(re => triEdges.some(te => linesIntersect(re[0], re[1], te[0], te[1])));
}
function loop(now) {
const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
lastTime = now;
update(dt);
draw();
requestAnimationFrame(loop);
}
document.getElementById('playButton').addEventListener('click', beginGame);
document.getElementById('resumeButton').addEventListener('click', resumeGame);
document.getElementById('restartButton').addEventListener('click', beginGame);
document.getElementById('menuButton').addEventListener('click', showMenu);
document.getElementById('againButton').addEventListener('click', beginGame);
document.getElementById('resultMenuButton').addEventListener('click', showMenu);
ui.pauseButton.addEventListener('click', pauseGame);
document.querySelectorAll('.mode-button').forEach(button => {
button.addEventListener('click', () => {
mode = button.dataset.mode;
document.querySelectorAll('.mode-button').forEach(b => b.classList.toggle('active', b === button));
});
});
ui.mute.addEventListener('click', () => {
sound.resume();
sound.setMuted(!muted);
updateMuteButton();
});
ui.fullscreen.addEventListener('click', async () => {
try {
const target = document.querySelector('.game-wrap');
if (!document.fullscreenElement) await target.requestFullscreen();
else await document.exitFullscreen();
} catch (error) {
console.warn('Fullscreen unavailable:', error);
}
});
window.addEventListener('keydown', event => {
if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) {
event.preventDefault();
jump();
}
if (event.code === 'Escape' || event.code === 'KeyP') {
event.preventDefault();
state === 'playing' ? pauseGame() : state === 'paused' && resumeGame();
}
if (event.code === 'KeyR' && ['playing', 'paused', 'dead'].includes(state)) beginGame();
});
canvas.addEventListener('pointerdown', event => {
event.preventDefault();
jump();
});
document.addEventListener('visibilitychange', () => {
if (document.hidden && state === 'playing') pauseGame();
});
window.addEventListener('resize', resizeCanvas);
document.addEventListener('fullscreenchange', resizeCanvas);
function updateMuteButton() {
ui.mute.textContent = muted ? '×' : '♫';
ui.mute.setAttribute('aria-pressed', String(muted));
ui.mute.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
}
updateMuteButton();
resizeCanvas();
resetPlayer(false);
requestAnimationFrame(loop);
})();
