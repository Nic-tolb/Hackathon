// ── BASE DE DATOS (localStorage) ──────────────────────────────
const ADMIN_CREDENTIALS = { email: 'admin@campuslands.com', pwd: 'Admin2025', name: 'ADMINISTRADOR', role: 'admin', id: 'NX-ADMIN', date: 'Sistema' };

const DB={
  users(){ try{ return JSON.parse(localStorage.getItem('nxac_users')||'{}'); }catch(e){ return {}; } },
  save(u){ localStorage.setItem('nxac_users', JSON.stringify(u)); },
  session(){ try{ return JSON.parse(localStorage.getItem('nxac_sess')||'null'); }catch(e){ return null; } },
  setSession(u){ localStorage.setItem('nxac_sess', JSON.stringify(u)); },
  clearSession(){ localStorage.removeItem('nxac_sess'); },
  logs(){ try{ return JSON.parse(localStorage.getItem('nxac_logs')||'[]'); }catch(e){ return []; } },
  addLog(action, detail){
    const ls = this.logs();
    ls.unshift({ action, detail, time: new Date().toLocaleString('es-CO') });
    if(ls.length > 100) ls.pop();
    localStorage.setItem('nxac_logs', JSON.stringify(ls));
  },
  register(name, email, pwd, role){
    const u = this.users();
    if(u[email]) return {ok:false, err:'Este correo ya tiene una cuenta registrada.'};
    const id = 'NX-' + Date.now().toString(36).toUpperCase();
    const date = new Date().toLocaleDateString('es-CO',{day:'2-digit',month:'long',year:'numeric'});
    u[email] = {name, email, pwd, id, date, role: role||'estudiante'};
    this.save(u);
    this.addLog('REGISTRO', `${name} (${role||'estudiante'}) — ${email}`);
    return {ok:true, user: u[email]};
  },
  login(email, pwd){
    // Check admin first
    if(email === ADMIN_CREDENTIALS.email && pwd === ADMIN_CREDENTIALS.pwd){
      this.addLog('LOGIN', 'Administrador del sistema');
      return {ok:true, user: ADMIN_CREDENTIALS};
    }
    const u = this.users();
    if(!u[email]) return {ok:false, err:'No existe una cuenta con ese correo.'};
    if(u[email].pwd !== pwd) return {ok:false, err:'Contraseña incorrecta.'};
    this.addLog('LOGIN', `${u[email].name} (${u[email].role}) — ${email}`);
    return {ok:true, user: u[email]};
  },
  deleteUser(email){
    const u = this.users();
    if(!u[email]) return false;
    const name = u[email].name;
    delete u[email];
    this.save(u);
    this.addLog('ELIMINAR', `${name} — ${email}`);
    return true;
  },
  exists(email){ return !!this.users()[email]; }
};

// ── SCREENS ───────────────────────────────────────────────────
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+id).classList.add('active');
}

// ── AUTH TABS ─────────────────────────────────────────────────
function switchTab(tab, btn){
  document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.auth-panel').forEach(p=>p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('panel-'+tab).classList.add('active');
  document.getElementById('reg-msg').className='auth-msg';
  document.getElementById('login-msg').className='auth-msg';
}

function showMsg(id, txt, type){ const el=document.getElementById(id); el.textContent=txt; el.className='auth-msg '+type; }
function setErr(fid, show){ const f=document.getElementById(fid); show?f.classList.add('error'):f.classList.remove('error'); if(!show)f.classList.add('ok'); else f.classList.remove('ok'); }

// ── VALIDACIONES ──────────────────────────────────────────────
function isGmail(e){ return /^[a-zA-Z0-9._%+\-]+@gmail\.com$/.test(e); }
function isValidPwd(p){ return p.length>=8 && p.length<=20 && /[A-Z]/.test(p); }

function checkEmail(inp){
  const v = inp.value;
  const f = inp.closest('.field');
  if(v && !isGmail(v)){ f.classList.add('error'); f.classList.remove('ok'); }
  else if(v){ f.classList.remove('error'); f.classList.add('ok'); }
  else{ f.classList.remove('error','ok'); }
}

function pwdStrength(pwd, prefix){
  prefix = prefix || '';
  const bars=[document.getElementById(prefix+'pb1'),document.getElementById(prefix+'pb2'),document.getElementById(prefix+'pb3'),document.getElementById(prefix+'pb4')];
  const lbl=document.getElementById(prefix+'plbl');
  let sc=0;
  if(pwd.length>=8)sc++;
  if(pwd.length>=12)sc++;
  if(/[A-Z]/.test(pwd))sc++;
  if(/[0-9]/.test(pwd)||/[^A-Za-z0-9]/.test(pwd))sc++;
  const cols=['var(--coral)','var(--amber)','var(--amber)','var(--teal)'];
  const lbls=['Muy débil','Débil','Aceptable','Fuerte 💪'];
  bars.forEach((b,i)=>{ if(b) b.style.background = i<sc ? cols[sc-1] : 'var(--bg4)'; });
  if(lbl) lbl.textContent = pwd.length>0 ? (lbls[Math.min(sc,4)-1]||'Muy débil') : 'Mín. 8 caracteres · Máx. 20 · Al menos 1 mayúscula';
}

function togglePwd(id, btn){
  const inp=document.getElementById(id);
  inp.type = inp.type==='password'?'text':'password';
  btn.textContent = inp.type==='password'?'👁':'🙈';
}

// ── REGISTRO ──────────────────────────────────────────────────
function doRegister(){
  const name  = document.getElementById('rname').value.trim();
  const email = document.getElementById('remail').value.trim().toLowerCase();
  const pwd   = document.getElementById('rpwd').value;
  const cpwd  = document.getElementById('rcpwd').value;
  const role  = 'estudiante';
  let ok = true;

  if(!name){ setErr('f-rname',true); ok=false; } else setErr('f-rname',false);
  if(!isGmail(email)){ setErr('f-remail',true); ok=false; } else setErr('f-remail',false);
  if(!isValidPwd(pwd)){ setErr('f-rpwd',true); ok=false; } else setErr('f-rpwd',false);
  if(pwd!==cpwd){ setErr('f-rcpwd',true); ok=false; } else setErr('f-rcpwd',false);

  if(!ok) return;
  const res = DB.register(name, email, pwd, role);
  if(!res.ok){ showMsg('reg-msg', res.err, 'err'); return; }
  DB.setSession(res.user);
  loadWelcome(res.user);
  showScreen('welcome');
}

// ── LOGIN ────────────────────────────────────────────────────
function doLogin(){
  const email = document.getElementById('lemail').value.trim().toLowerCase();
  const pwd   = document.getElementById('lpwd').value;
  let ok = true;

  if(!isGmail(email)){ setErr('f-lemail',true); ok=false; } else setErr('f-lemail',false);
  if(!pwd){ setErr('f-lpwd',true); ok=false; } else setErr('f-lpwd',false);

  if(!ok) return;
  const res = DB.login(email, pwd);
  if(!res.ok){ showMsg('login-msg', res.err, 'err'); setErr('f-lpwd',true); return; }
  DB.setSession(res.user);
  loadWelcome(res.user);
  showScreen('welcome');
}

// ── WELCOME ───────────────────────────────────────────────────
function initials(name){ return name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join(''); }

function loadWelcome(user){
  const ini = initials(user.name);
  document.getElementById('wc-av').textContent = ini;
  document.getElementById('wc-name').textContent = user.name;
  document.getElementById('wc-email').textContent = user.email;
  document.getElementById('wi-email').textContent = user.email;
  document.getElementById('wi-name').textContent = user.name;
  document.getElementById('wi-date').textContent = user.date;
  document.getElementById('wi-id').textContent = user.id;
  const roleLabels = {estudiante:'🎓 Estudiante', mentor:'👨‍🏫 Mentor / Trainer', coordinador:'🏛️ Coordinador'};
  document.getElementById('wi-role').textContent = roleLabels[user.role||'estudiante'];
  const progRow = document.getElementById('wi-prog-row');
  if(progRow) progRow.style.display = (user.role==='estudiante'||!user.role) ? 'flex' : 'none';
}

function enterApp(){
  const user = DB.session();
  if(!user){ showScreen('auth'); return; }
  const role = user.role || 'estudiante';
  if(role === 'admin'){
    loadAdminApp();
    showScreen('app-admin');
  } else if(role === 'mentor'){
    loadMentorApp(user);
    showScreen('app-mentor');
    initMentorChat(user);
  } else if(role === 'coordinador'){
    loadCoordApp(user);
    showScreen('app-coordinador');
    initCoordChat(user);
  } else {
    loadApp(user);
    showScreen('app');
    initChat(user);
  }
}

// ── APP ───────────────────────────────────────────────────────
function loadApp(user){
  const ini = initials(user.name);
  const firstName = user.name.split(' ')[0];
  document.getElementById('side-av').textContent = ini;
  document.getElementById('side-name').textContent = firstName;
  document.getElementById('dash-name').textContent = firstName;
  document.getElementById('perf-av').textContent = ini;
  document.getElementById('perf-name').textContent = user.name;
  document.getElementById('perf-email').textContent = user.email;
  document.getElementById('pd-name').textContent = user.name;
  document.getElementById('pd-email').textContent = user.email;
  document.getElementById('pd-date').textContent = user.date;
  document.getElementById('pd-id').textContent = user.id;
  buildMods();
}

function doLogout(){
  DB.clearSession();
  chatHistory = []; mentorChatHistory = []; coordChatHistory = [];
  ['chat-msgs','m-chat-msgs','c-chat-msgs'].forEach(id=>{ const el=document.getElementById(id); if(el) el.innerHTML=''; });
  document.querySelectorAll('.field').forEach(f=>f.classList.remove('error','ok'));
  ['rname','remail','rpwd','rcpwd','lemail','lpwd'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  ['reg-msg','login-msg'].forEach(id=>document.getElementById(id).className='auth-msg');
  showScreen('auth');
}

// ── NAVEGACIÓN ────────────────────────────────────────────────
const titles={dashboard:'Dashboard',perfil:'Mi Perfil',ruta:'Mi Ruta de Aprendizaje',nexo:'Asistente NEXO',riesgo:'Análisis de Riesgo',alertas:'Alertas del Sistema',logros:'Logros y Gamificación'};
function goTo(id, btn){
  document.querySelectorAll('#screen-app .page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  if(btn) btn.classList.add('active');
  else document.querySelectorAll('.nav-item').forEach(n=>{ if(n.getAttribute('onclick')&&n.getAttribute('onclick').includes("'"+id+"'")) n.classList.add('active'); });
  document.getElementById('page-title').textContent = titles[id]||id;
}

// ── MÓDULOS ────────────────────────────────────────────────
function buildMods(){
  const mods=[
    {ico:'🌐',name:'HTML & CSS Avanzado',desc:'Flexbox, Grid, animaciones, responsive design'},
    {ico:'⚡',name:'JavaScript ES6+',desc:'Promesas, async/await, módulos, manipulación del DOM'},
    {ico:'🔗',name:'Git & Colaboración',desc:'Ramas, pull requests, merge, flujos en GitHub'},
    {ico:'🗃️',name:'Bases de Datos Relacionales',desc:'SQL, normalización, JOINs, PostgreSQL'},
    {ico:'🚀',name:'APIs REST con Node.js',desc:'Express, endpoints, autenticación con JWT'},
    {ico:'⚛️',name:'React Fundamentals',desc:'Componentes, hooks, estado, React Router'},
    {ico:'☁️',name:'Despliegue en la nube',desc:'AWS, Docker, CI/CD, variables de entorno'},
  ];
  const el = document.getElementById('mods-list');
  el.innerHTML = '';
  mods.forEach((m,i) => {
    el.innerHTML += `<div class="mod-item"><div class="mod-ico">${m.ico}</div><div><div class="mod-n">Módulo ${i+1} · ${m.name}</div><div class="mod-d">${m.desc}</div></div><span class="mod-st">Próximo</span></div>`;
  });
}

// ── NEXO CHAT CON IA REAL ─────────────────────────────────────
let curUser = null;
let chatHistory = [];
let isAiLoading = false;

// System prompt que define a NEXO con capacidad de análisis de deserción
const NEXO_SYSTEM_PROMPT = `Eres NEXO, el asistente de inteligencia artificial de NexusAcad, la plataforma educativa de Campuslands para el programa Fullstack Developer. 

PERSONALIDAD:
- Eres cálido, motivador y empático, pero también directo y preciso
- Usas emojis con moderación para hacer la conversación más amena
- Siempre te diriges al estudiante por su nombre cuando lo conoces
- Hablas en español colombiano natural

CAPACIDADES PRINCIPALES:
1. Eres un asistente de IA completo: puedes responder cualquier pregunta sobre programación, tecnología, matemáticas, ciencias, cultura general, ayudar a escribir código, explicar conceptos, hacer traducciones, etc.
2. Tienes conocimiento especializado del programa Fullstack Developer de Campuslands (7 módulos: HTML&CSS, JavaScript ES6+, Git, Bases de Datos, APIs REST con Node.js, React, Despliegue en la nube)
3. Puedes analizar el riesgo de deserción académica de un estudiante

ANÁLISIS DE RIESGO DE DESERCIÓN:
Cuando el estudiante te pida analizar su riesgo de deserción, o cuando detectes señales de riesgo en la conversación, debes:
- Hacerle preguntas clave sobre: asistencia (%), promedio de notas (1.0-5.0), entregas a tiempo (%), horas de estudio por semana, nivel de motivación (1-10), dificultades actuales
- Calcular un porcentaje de riesgo de deserción basado en esos factores usando esta fórmula conceptual:
  * Asistencia <70% → +30 puntos de riesgo
  * Asistencia 70-85% → +15 puntos
  * Promedio <3.0 → +25 puntos de riesgo
  * Promedio 3.0-3.5 → +10 puntos
  * Entregas a tiempo <60% → +20 puntos de riesgo
  * Horas estudio <15/semana → +15 puntos
  * Motivación <5/10 → +20 puntos de riesgo
  * Presenta el resultado como un porcentaje (0-100%) con categorías: BAJO (0-25%), MODERADO (26-50%), ALTO (51-75%), CRÍTICO (76-100%)
- Siempre incluye recomendaciones específicas y motivadoras para reducir el riesgo
- Formatea el análisis claramente con el porcentaje destacado

CONTEXTO DEL PROGRAMA:
- Duración: 20 semanas (5 meses), lunes a viernes
- 7 módulos progresivos de desarrollo web fullstack
- Sistema de mentoría personalizada
- Gamificación con XP, rachas e insignias

Responde siempre en español. Sé útil, preciso y motivador. Si te hacen preguntas técnicas de programación, respóndelas completamente con ejemplos de código cuando sea útil.`;

async function callNexoAI(userMessage) {
  // Agregar mensaje del usuario al historial
  chatHistory.push({ role: 'user', content: userMessage });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: NEXO_SYSTEM_PROMPT,
      messages: chatHistory
    })
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  const assistantMessage = data.content.map(b => b.text || '').join('');

  // Agregar respuesta al historial
  chatHistory.push({ role: 'assistant', content: assistantMessage });

  // Mantener historial razonable (últimas 20 interacciones)
  if (chatHistory.length > 40) {
    chatHistory = chatHistory.slice(-40);
  }

  return assistantMessage;
}

function formatNexoResponse(text) {
  // Convertir markdown básico a HTML
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--bg4);padding:2px 6px;border-radius:4px;font-family:monospace;font-size:12px">$1</code>')
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre style="background:var(--bg4);border:1px solid var(--border2);border-radius:8px;padding:12px;margin:8px 0;overflow-x:auto;font-family:monospace;font-size:12px;line-height:1.5">$2</pre>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function initChat(user){
  curUser = user;
  chatHistory = [];
  const msgs = document.getElementById('chat-msgs');
  msgs.innerHTML = '';
  const fn = user.name.split(' ')[0];

  // Mensaje de bienvenida estático (sin llamada a la API)
  const welcomeText = `¡Hola, <strong>${fn}</strong>! Bienvenido a NexusAcad 🎉<br><br>Soy <strong>NEXO</strong>, tu asistente de IA personal. Estoy aquí para acompañarte en todo momento:<br><br>🤖 <strong>Asistente completo:</strong> pregúntame lo que quieras — código, matemáticas, tecnología, cultura general...<br>📊 <strong>Análisis de deserción:</strong> puedo evaluar tu riesgo académico y darte recomendaciones personalizadas.<br>🎓 <strong>Experto en tu programa:</strong> sé todo sobre los 7 módulos del Fullstack Developer.<br><br>¿En qué te puedo ayudar hoy?`;
  addMsg(welcomeText, false);

  // Pre-cargar contexto en el historial sin mostrar
  chatHistory.push({
    role: 'assistant',
    content: `¡Hola, ${fn}! Bienvenido a NexusAcad 🎉 Soy NEXO, tu asistente de IA personal. Estoy aquí para ayudarte con cualquier pregunta, analizar tu riesgo académico y acompañarte en tu programa Fullstack Developer. ¿En qué te puedo ayudar hoy?`
  });
}

function addMsg(text, isUser){
  const msgs = document.getElementById('chat-msgs');
  const div = document.createElement('div');
  div.className = `msg ${isUser?'user':'nexo'}`;
  const now = new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});
  const ini = curUser ? initials(curUser.name) : 'TU';
  div.innerHTML = `<div class="msg-av ${isUser?'usr-av':'nav-av'}">${isUser?ini:'🤖'}</div><div><div class="msg-b">${text}</div><div class="msg-t">${now}</div></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTyp(){
  const msgs=document.getElementById('chat-msgs');
  const d=document.createElement('div'); d.className='msg nexo'; d.id='typ';
  d.innerHTML=`<div class="msg-av nav-av">🤖</div><div class="typing-ind"><span></span><span></span><span></span></div>`;
  msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight;
}
function hideTyp(){ const t=document.getElementById('typ'); if(t)t.remove(); }

async function sendMsg(){
  if(isAiLoading) return;
  const inp=document.getElementById('cin');
  const txt=inp.value.trim();
  if(!txt) return;

  addMsg(txt, true);
  inp.value=''; inp.style.height='auto';
  document.getElementById('qchips').style.display='none';

  isAiLoading = true;
  document.getElementById('snd-btn-main').disabled = true;
  document.getElementById('snd-btn-main').style.opacity = '0.5';
  showTyp();

  try {
    const aiResponse = await callNexoAI(txt);
    hideTyp();
    addMsg(formatNexoResponse(aiResponse), false);
  } catch(err) {
    hideTyp();
    console.error('NEXO AI error:', err);
    addMsg('⚠️ Tuve un problema de conexión momentáneo. Por favor intenta de nuevo en un momento.', false);
    // Remover el último mensaje del usuario del historial si hubo error
    chatHistory.pop();
  } finally {
    isAiLoading = false;
    document.getElementById('snd-btn-main').disabled = false;
    document.getElementById('snd-btn-main').style.opacity = '1';
  }
}

function sendQ(el){ document.getElementById('cin').value=el.textContent; sendMsg(); }
function handleKey(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMsg(); } }
function autoR(el){ el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,120)+'px'; }

// ── MENTOR APP ────────────────────────────────────────────────
function loadMentorApp(user){
  const ini = initials(user.name);
  const firstName = user.name.split(' ')[0];
  document.getElementById('m-side-av').textContent = ini;
  document.getElementById('m-side-name').textContent = firstName;
  document.getElementById('m-dash-name').textContent = firstName;
  document.getElementById('m-perf-av').textContent = ini;
  document.getElementById('m-perf-name').textContent = user.name;
  document.getElementById('m-perf-email').textContent = user.email;
  document.getElementById('m-pd-name').textContent = user.name;
  document.getElementById('m-pd-email').textContent = user.email;
  document.getElementById('m-pd-date').textContent = user.date;
  document.getElementById('m-pd-id').textContent = user.id;
}

const mTitles={dashboard:'Dashboard Mentor','m-dashboard':'Dashboard',perfil:'Mi Perfil',estudiantes:'Mis Estudiantes',nexo:'Asistente NEXO',riesgo:'Riesgo del Grupo',alertas:'Alertas',sesiones:'Sesiones'};
function goToM(id, btn){
  document.querySelectorAll('#screen-app-mentor .page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-m-'+id.replace('m-','')).classList.add('active');
  document.querySelectorAll('#screen-app-mentor .nav-item').forEach(n=>n.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.getElementById('m-page-title').textContent = id.replace('m-','').charAt(0).toUpperCase()+id.replace('m-','').slice(1);
}

let mentorChatHistory = [];
let isMentorAiLoading = false;

const NEXO_MENTOR_SYSTEM = `Eres NEXO en modo Mentor, asistente IA para mentores/trainers de Campuslands. Ayudas con:
- Estrategias de intervención para estudiantes en riesgo de deserción
- Análisis del rendimiento grupal e individual
- Técnicas pedagógicas y de motivación estudiantil
- Planificación de sesiones y seguimiento académico
Tienes datos del grupo actual: 12 estudiantes, semana 8, módulo JavaScript ES6+. 2 estudiantes en riesgo: Carlos M. (78% crítico) y Laura P. (62% alto).
Responde en español colombiano, sé directo, práctico y empático con el rol de mentor.`;

async function callMentorAI(msg){
  mentorChatHistory.push({role:'user', content:msg});
  const res = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,system:NEXO_MENTOR_SYSTEM,messages:mentorChatHistory})});
  if(!res.ok) throw new Error('API error');
  const data = await res.json();
  const reply = data.content.map(b=>b.text||'').join('');
  mentorChatHistory.push({role:'assistant', content:reply});
  if(mentorChatHistory.length>40) mentorChatHistory=mentorChatHistory.slice(-40);
  return reply;
}

function initMentorChat(user){
  curUser = user;
  mentorChatHistory = [];
  const msgs = document.getElementById('m-chat-msgs');
  msgs.innerHTML='';
  const fn = user.name.split(' ')[0];
  const welcome = `¡Hola, <strong>${fn}</strong>! 👋 Soy <strong>NEXO</strong> en modo Mentor.<br><br>📊 <strong>Tu grupo hoy:</strong> 12 estudiantes activos · Semana 8 · Módulo JS ES6+<br>🚨 <strong>Alertas activas:</strong> Carlos M. (riesgo 78%) y Laura P. (riesgo 62%)<br><br>¿Con qué quieres que te ayude hoy?`;
  addMsgTo('m-chat-msgs', welcome, false);
  mentorChatHistory.push({role:'assistant',content:`¡Hola ${fn}! Soy NEXO modo Mentor. Tu grupo tiene 12 estudiantes en semana 8. Hay 2 alertas activas: Carlos M. riesgo crítico 78% y Laura P. riesgo alto 62%. ¿En qué te ayudo?`});
}

function addMsgTo(containerId, text, isUser){
  const msgs = document.getElementById(containerId);
  const div = document.createElement('div');
  div.className = `msg ${isUser?'user':'nexo'}`;
  const now = new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});
  const ini = curUser ? initials(curUser.name) : 'TU';
  div.innerHTML = `<div class="msg-av ${isUser?'usr-av':'nav-av'}">${isUser?ini:'🤖'}</div><div><div class="msg-b">${isUser?text:text}</div><div class="msg-t">${now}</div></div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function showTypIn(containerId){
  const msgs=document.getElementById(containerId);
  const d=document.createElement('div'); d.className='msg nexo'; d.id='typ-'+containerId;
  d.innerHTML=`<div class="msg-av nav-av">🤖</div><div class="typing-ind"><span></span><span></span><span></span></div>`;
  msgs.appendChild(d); msgs.scrollTop=msgs.scrollHeight;
}
function hideTypIn(containerId){ const t=document.getElementById('typ-'+containerId); if(t)t.remove(); }

async function sendMMsg(){
  if(isMentorAiLoading) return;
  const inp=document.getElementById('m-cin');
  const txt=inp.value.trim();
  if(!txt) return;
  addMsgTo('m-chat-msgs', txt, true);
  inp.value=''; inp.style.height='auto';
  document.getElementById('m-qchips').style.display='none';
  isMentorAiLoading=true;
  document.getElementById('m-snd-btn').disabled=true;
  document.getElementById('m-snd-btn').style.opacity='0.5';
  showTypIn('m-chat-msgs');
  try{
    const reply = await callMentorAI(txt);
    hideTypIn('m-chat-msgs');
    addMsgTo('m-chat-msgs', formatNexoResponse(reply), false);
  }catch(err){
    hideTypIn('m-chat-msgs');
    addMsgTo('m-chat-msgs','⚠️ Error de conexión. Intenta de nuevo.', false);
    mentorChatHistory.pop();
  }finally{
    isMentorAiLoading=false;
    document.getElementById('m-snd-btn').disabled=false;
    document.getElementById('m-snd-btn').style.opacity='1';
  }
}
function sendMQ(el){ document.getElementById('m-cin').value=el.textContent; sendMMsg(); }
function handleMKey(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMMsg(); } }

// ── COORDINADOR APP ───────────────────────────────────────────
function loadCoordApp(user){
  const ini = initials(user.name);
  const firstName = user.name.split(' ')[0];
  document.getElementById('c-side-av').textContent = ini;
  document.getElementById('c-side-name').textContent = firstName;
  document.getElementById('c-dash-name').textContent = firstName;
  document.getElementById('c-perf-av').textContent = ini;
  document.getElementById('c-perf-name').textContent = user.name;
  document.getElementById('c-perf-email').textContent = user.email;
  document.getElementById('c-pd-name').textContent = user.name;
  document.getElementById('c-pd-email').textContent = user.email;
  document.getElementById('c-pd-date').textContent = user.date;
  document.getElementById('c-pd-id').textContent = user.id;
}

function goToC(id, btn){
  document.querySelectorAll('#screen-app-coordinador .page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.querySelectorAll('#screen-app-coordinador .nav-item').forEach(n=>n.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const labels={'c-dashboard':'Dashboard Coordinación','c-perfil':'Mi Perfil','c-cohortes':'Cohortes','c-nexo':'Asistente NEXO','c-desercion':'Monitor de Deserción','c-reportes':'Reportes','c-mentores':'Equipo Mentores'};
  document.getElementById('c-page-title').textContent = labels[id]||id;
}

let coordChatHistory = [];
let isCoordAiLoading = false;

const NEXO_COORD_SYSTEM = `Eres NEXO en modo Coordinación, asistente IA para coordinadores de Campuslands. Ayudas con:
- Analítica institucional y predicción de deserción
- Gestión de cohortes y seguimiento de mentores
- Reportes ejecutivos y estrategias de retención
- Toma de decisiones basada en datos del programa
Contexto: 3 cohortes activas, 67 estudiantes, tasa de deserción 11%, 5 casos críticos activos. Objetivo institucional: reducir deserción al 80% de retención.
Responde en español colombiano con visión estratégica y datos precisos.`;

async function callCoordAI(msg){
  coordChatHistory.push({role:'user', content:msg});
  const res = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,system:NEXO_COORD_SYSTEM,messages:coordChatHistory})});
  if(!res.ok) throw new Error('API error');
  const data = await res.json();
  const reply = data.content.map(b=>b.text||'').join('');
  coordChatHistory.push({role:'assistant', content:reply});
  if(coordChatHistory.length>40) coordChatHistory=coordChatHistory.slice(-40);
  return reply;
}

function initCoordChat(user){
  curUser = user;
  coordChatHistory = [];
  const msgs = document.getElementById('c-chat-msgs');
  msgs.innerHTML='';
  const fn = user.name.split(' ')[0];
  const welcome = `¡Hola, <strong>${fn}</strong>! 🏛️ Soy <strong>NEXO</strong> en modo Coordinación.<br><br>📊 <strong>Resumen institucional:</strong><br>· 3 cohortes activas · 67 estudiantes<br>· Tasa deserción: 11% · 5 casos críticos<br>· Cohorte B bajo observación (semana 4)<br><br>¿Qué análisis o reporte necesitas hoy?`;
  addMsgTo('c-chat-msgs', welcome, false);
  coordChatHistory.push({role:'assistant',content:`¡Hola ${fn}! Soy NEXO modo Coordinación. Resumen: 3 cohortes, 67 estudiantes, deserción 11%, 5 casos críticos. ¿Qué necesitas?`});
}

async function sendCMsg(){
  if(isCoordAiLoading) return;
  const inp=document.getElementById('c-cin');
  const txt=inp.value.trim();
  if(!txt) return;
  addMsgTo('c-chat-msgs', txt, true);
  inp.value=''; inp.style.height='auto';
  document.getElementById('c-qchips').style.display='none';
  isCoordAiLoading=true;
  document.getElementById('c-snd-btn').disabled=true;
  document.getElementById('c-snd-btn').style.opacity='0.5';
  showTypIn('c-chat-msgs');
  try{
    const reply = await callCoordAI(txt);
    hideTypIn('c-chat-msgs');
    addMsgTo('c-chat-msgs', formatNexoResponse(reply), false);
  }catch(err){
    hideTypIn('c-chat-msgs');
    addMsgTo('c-chat-msgs','⚠️ Error de conexión. Intenta de nuevo.', false);
    coordChatHistory.pop();
  }finally{
    isCoordAiLoading=false;
    document.getElementById('c-snd-btn').disabled=false;
    document.getElementById('c-snd-btn').style.opacity='1';
  }
}
function sendCQ(el){ document.getElementById('c-cin').value=el.textContent; sendCMsg(); }
function handleCKey(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendCMsg(); } }

// ── ADMIN APP ─────────────────────────────────────────────────
function loadAdminApp(){
  refreshAdminDash();
  renderUserTable();
  renderLogs();
}

function goToA(id, btn){
  document.querySelectorAll('#screen-app-admin .page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+id).classList.add('active');
  document.querySelectorAll('#screen-app-admin .nav-item').forEach(n=>n.classList.remove('active'));
  if(btn) btn.classList.add('active');
  const labels={'a-dashboard':'Panel de Administración','a-usuarios':'Gestión de Usuarios','a-crear':'Crear Cuenta','a-logs':'Registro del Sistema'};
  document.getElementById('a-page-title').textContent = labels[id]||id;
  if(id==='a-usuarios') renderUserTable();
  if(id==='a-dashboard') refreshAdminDash();
  if(id==='a-logs') renderLogs();
}

function refreshAdminDash(){
  const users = Object.values(DB.users());
  const est = users.filter(u=>u.role==='estudiante'||!u.role).length;
  const men = users.filter(u=>u.role==='mentor').length;
  const coo = users.filter(u=>u.role==='coordinador').length;
  document.getElementById('a-kpi-total').textContent = users.length;
  document.getElementById('a-kpi-est').textContent = est;
  document.getElementById('a-kpi-men').textContent = men;
  document.getElementById('a-kpi-coord').textContent = coo;
  const recent = users.sort((a,b)=>b.id.localeCompare(a.id)).slice(0,5);
  const roleIcon={estudiante:'🎓',mentor:'👨‍🏫',coordinador:'🏛️'};
  const roleColor={estudiante:'var(--teal)',mentor:'var(--amber)',coordinador:'var(--blue)'};
  const el = document.getElementById('a-recent-list');
  if(!recent.length){ el.innerHTML='<div class="t3 f13" style="padding:12px">No hay usuarios registrados aún.</div>'; return; }
  el.innerHTML = recent.map(u=>`
    <div class="al al-info" style="margin:0;border-radius:0;border-left:none;border-right:none;border-top:none;border-bottom:1px solid var(--border)">
      <div class="al-dot" style="background:${roleColor[u.role]||'var(--teal)'}"></div>
      <div><div class="al-t">${u.name}</div><div class="al-d">${u.email} · ID: ${u.id}</div></div>
      <div style="margin-left:auto;font-size:11px;font-weight:700;padding:3px 9px;border-radius:50px;background:var(--bg4);color:var(--text3);flex-shrink:0">${roleIcon[u.role]||'🎓'} ${(u.role||'estudiante').charAt(0).toUpperCase()+(u.role||'estudiante').slice(1)}</div>
    </div>`).join('');
}

function renderUserTable(){
  const search = (document.getElementById('a-search')||{}).value||'';
  const filter = (document.getElementById('a-filter')||{}).value||'';
  let users = Object.values(DB.users());
  if(search) users = users.filter(u=>u.name.toLowerCase().includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase()));
  if(filter) users = users.filter(u=>(u.role||'estudiante')===filter);
  const roleIcon={estudiante:'🎓',mentor:'👨‍🏫',coordinador:'🏛️'};
  const roleColor={estudiante:'rgba(45,212,160,.15)',mentor:'rgba(245,166,35,.15)',coordinador:'rgba(74,158,255,.15)'};
  const roleTxt={estudiante:'var(--teal)',mentor:'var(--amber)',coordinador:'var(--blue)'};
  const el = document.getElementById('a-user-table');
  if(!el) return;
  if(!users.length){ el.innerHTML='<div class="t3 f13" style="padding:20px">No se encontraron usuarios.</div>'; return; }
  el.innerHTML = `
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="background:var(--bg3);font-size:11px;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:.06em">
          <th style="padding:12px 18px;text-align:left">Nombre</th>
          <th style="padding:12px 18px;text-align:left">Correo</th>
          <th style="padding:12px 18px;text-align:left">Rol</th>
          <th style="padding:12px 18px;text-align:left">ID</th>
          <th style="padding:12px 18px;text-align:left">Registro</th>
          <th style="padding:12px 18px;text-align:center">Acción</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(u=>`
        <tr style="border-bottom:1px solid var(--border);font-size:13px;transition:background .15s" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background=''">
          <td style="padding:12px 18px;font-weight:600">${u.name}</td>
          <td style="padding:12px 18px;color:var(--text2)">${u.email}</td>
          <td style="padding:12px 18px"><span style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:50px;background:${roleColor[u.role]||roleColor.estudiante};color:${roleTxt[u.role]||roleTxt.estudiante}">${roleIcon[u.role]||'🎓'} ${(u.role||'estudiante').charAt(0).toUpperCase()+(u.role||'estudiante').slice(1)}</span></td>
          <td style="padding:12px 18px;color:var(--text3);font-family:monospace;font-size:12px">${u.id}</td>
          <td style="padding:12px 18px;color:var(--text3);font-size:12px">${u.date}</td>
          <td style="padding:12px 18px;text-align:center"><button onclick="adminDeleteUser('${u.email}')" style="background:rgba(240,96,96,.12);border:1px solid rgba(240,96,96,.3);color:var(--coral);border-radius:7px;padding:5px 11px;font-size:11px;font-weight:700;cursor:pointer" onmouseover="this.style.background='rgba(240,96,96,.25)'" onmouseout="this.style.background='rgba(240,96,96,.12)'">🗑 Eliminar</button></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function adminDeleteUser(email){
  if(!confirm(`¿Eliminar la cuenta de ${email}? Esta acción no se puede deshacer.`)) return;
  DB.deleteUser(email);
  renderUserTable();
  refreshAdminDash();
}

function adminCreateUser(){
  const name  = document.getElementById('a-name').value.trim();
  const email = document.getElementById('a-email').value.trim().toLowerCase();
  const role  = document.getElementById('a-role').value;
  const pwd   = document.getElementById('a-pwd').value;
  let ok = true;

  if(!name){ setErr('fa-name',true); ok=false; } else setErr('fa-name',false);
  if(!isGmail(email)){ setErr('fa-email',true); ok=false; } else setErr('fa-email',false);
  if(!isValidPwd(pwd)){ setErr('fa-pwd',true); ok=false; } else setErr('fa-pwd',false);
  if(!ok) return;

  const res = DB.register(name, email, pwd, role);
  if(!res.ok){ showAdminMsg(res.err, 'err'); return; }

  const roleLabel = role==='mentor' ? 'Mentor / Trainer' : 'Coordinador';
  showAdminMsg(`✅ Cuenta de ${roleLabel} creada para ${name}. Correo: ${email}`, 'ok');
  document.getElementById('a-name').value='';
  document.getElementById('a-email').value='';
  document.getElementById('a-pwd').value='';
  ['apb1','apb2','apb3','apb4'].forEach(id=>{ const el=document.getElementById(id); if(el) el.style.background='var(--bg4)'; });
  ['fa-name','fa-email','fa-pwd'].forEach(id=>{ const el=document.getElementById(id); if(el){ el.classList.remove('error','ok'); }});
  refreshAdminDash();
}

function showAdminMsg(txt, type){
  const el=document.getElementById('a-crear-msg');
  if(!el) return;
  el.textContent=txt;
  el.className='auth-msg'+(type?' '+type:'');
}

function renderLogs(){
  const logs = DB.logs();
  const el = document.getElementById('a-logs-list');
  if(!el) return;
  if(!logs.length){ el.innerHTML='<div class="t3 f13" style="padding:20px">No hay actividad registrada.</div>'; return; }
  const actionColor={'LOGIN':'var(--teal)','REGISTRO':'var(--purple-l)','ELIMINAR':'var(--coral)'};
  el.innerHTML = logs.map(l=>`
    <div style="display:flex;align-items:center;gap:14px;padding:12px 18px;border-bottom:1px solid var(--border);font-size:13px">
      <span style="font-size:11px;font-weight:700;padding:3px 9px;border-radius:50px;background:var(--bg4);color:${actionColor[l.action]||'var(--text3)'};flex-shrink:0;min-width:80px;text-align:center">${l.action}</span>
      <span style="flex:1;color:var(--text2)">${l.detail}</span>
      <span style="font-size:11px;color:var(--text3);flex-shrink:0">${l.time}</span>
    </div>`).join('');
}

(function(){
  const sess = DB.session();
  if(sess){ loadWelcome(sess); showScreen('welcome'); }
  else showScreen('auth');
})();
