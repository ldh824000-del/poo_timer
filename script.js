let currentUser = localStorage.getItem('currentUser') || null;
let currentNick = localStorage.getItem('currentNick') || null;
let timerId = null, startTime = 0, elapsedTime = 0, isRunning = false;
let viewDate = new Date(), selectedType = "정상";

const poopTips = [
    "배변 시간은 3분 이내가 가장 건강해요!", "스마트폰을 들고 가면 치질 위험이 높아져요.",
    "발 아래 받침대를 두면 변비 예방에 도움이 됩니다.", "변비에는 식이섬유와 수분이 필수예요.",
    "변의를 느끼면 참지 말고 바로 가세요.", "아침 물 한 잔은 장 운동을 도와요.",
    "걷기 운동은 장의 연동 운동을 활발하게 합니다.", "요거트는 장내 유익균을 늘려줘요.",
    "지나친 다이어트는 변비의 원인이 됩니다.", "스트레스는 대장 증후군의 원인이 될 수 있어요."
];

window.onload = () => {
    if (currentUser && currentNick) loginUser(currentUser, currentNick);
    else showScreen('screen-login');
};

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    document.getElementById(screenId).style.display = 'block';
    if(screenId === 'screen-calendar') renderCalendar();
}

/* --- 회원 및 데이터 관리 --- */
function processSignup() {
    const nick = document.getElementById('signup-nick').value.trim();
    const id = document.getElementById('signup-id').value.trim();
    const pw = document.getElementById('signup-pw').value.trim();
    if(!nick || !id || !pw) return alert("모든 정보를 입력해주세요.");
    const idRegex = /^[a-zA-Z0-9]{4,12}$/;
    if(!idRegex.test(id)) return alert("아이디는 영문/숫자 4~12자만 가능합니다.");
    let users = JSON.parse(localStorage.getItem('app_users') || "{}");
    if(users[id]) return alert("이미 가입된 아이디입니다.");
    users[id] = { pw, nick };
    localStorage.setItem('app_users', JSON.stringify(users));
    alert("가입 완료!"); showScreen('screen-login');
}

function handleLogin() {
    const id = document.getElementById('login-id').value.trim();
    const pw = document.getElementById('login-pw').value.trim();
    let users = JSON.parse(localStorage.getItem('app_users') || "{}");
    if (users[id] && users[id].pw === pw) loginUser(id, users[id].nick);
    else alert("정보가 틀렸습니다.");
}

function loginUser(id, nick) {
    currentUser = id; currentNick = nick;
    localStorage.setItem('currentUser', id); localStorage.setItem('currentNick', nick);
    document.getElementById('user-display').innerText = nick;
    showScreen('screen-main');
}

function toggleUserMenu() {
    const menu = document.getElementById('user-menu');
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
}

function changeNickname() {
    const newNick = prompt("새로운 닉네임을 입력하세요.");
    if(!newNick) return;
    let users = JSON.parse(localStorage.getItem('app_users') || "{}");
    users[currentUser].nick = newNick;
    localStorage.setItem('app_users', JSON.stringify(users));
    loginUser(currentUser, newNick);
    toggleUserMenu();
}

function resetLogs() {
    if(confirm("기록을 리셋하시겠습니까?")) {
        localStorage.removeItem(`poop_logs_${currentUser}`);
        renderCalendar(); toggleUserMenu();
    }
}

function withdrawAccount() {
    if(confirm("탈퇴하시겠습니까?")) {
        let users = JSON.parse(localStorage.getItem('app_users') || "{}");
        delete users[currentUser];
        localStorage.setItem('app_users', JSON.stringify(users));
        localStorage.removeItem(`poop_logs_${currentUser}`);
        handleLogout();
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser'); localStorage.removeItem('currentNick');
    location.reload();
}

/* --- 타이머 로직 --- */
function toggleTimer() {
    const btn = document.getElementById('btn-action');
    const selector = document.getElementById('status-selector');
    const img = document.getElementById('cat-img');
    const statusMsg = document.getElementById('status-msg');

    if (!isRunning) {
        isRunning = true; startTime = Date.now(); selectedType = "정상";
        btn.innerText = "끗!"; btn.classList.add('btn-stop');
        selector.style.display = 'flex';
        statusMsg.innerText = poopTips[Math.floor(Math.random() * poopTips.length)];
        img.src = "pooping.png";
        timerId = setInterval(() => { elapsedTime = Date.now() - startTime; updateDisplay(); }, 10);
    } else {
        isRunning = false; clearInterval(timerId); saveLog();
        btn.innerText = "쾌변 시작!"; btn.classList.remove('btn-stop');
        selector.style.display = 'none';
        img.src = elapsedTime / 1000 <= 180 ? "happy.png" : "angry.png";
        setTimeout(() => { if(!isRunning) img.src = "sleeping.png"; }, 3000);
        elapsedTime = 0; updateDisplay();
    }
}

function updateDisplay() {
    const totalMs = elapsedTime;
    const mins = Math.floor(totalMs / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const ms = Math.floor((totalMs % 1000) / 10);
    const timerDisplay = document.getElementById('timer');
    timerDisplay.innerText = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}:${String(ms).padStart(2,'0')}`;
    timerDisplay.style.color = totalMs >= 180000 ? "#f44336" : "#333";
}

function selectType(t) {
    selectedType = t;
    document.querySelectorAll('.btn-type').forEach(b => b.classList.remove('active'));
    document.getElementById(`type-${t}`).classList.add('active');
}

function saveLog() {
    const now = new Date();
    const logKey = `poop_logs_${currentUser}`;
    let logs = JSON.parse(localStorage.getItem(logKey) || "[]");
    logs.push({
        id: Date.now(),
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: false}),
        duration: document.getElementById('timer').innerText,
        type: elapsedTime / 1000 > 180 ? "실패" : selectedType,
        isFail: elapsedTime / 1000 > 180
    });
    localStorage.setItem(logKey, JSON.stringify(logs));
}

/* --- 달력 및 개별 삭제 --- */
function changeMonth(v) {
    viewDate.setMonth(viewDate.getMonth() + v);
    renderCalendar();
}

function renderCalendar() {
    const year = viewDate.getFullYear(); const month = viewDate.getMonth();
    document.getElementById('current-month-year').innerText = `${year}년 ${month + 1}월`;
    const grid = document.getElementById('calendar-grid'); grid.innerHTML = "";
    
    ['일','월','화','수','목','금','토'].forEach(d => {
        const h = document.createElement('div'); h.className='calendar-day header'; h.innerText=d; grid.appendChild(h);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    for(let i=0; i<firstDay; i++) grid.appendChild(document.createElement('div')).className='calendar-day empty';

    const logs = JSON.parse(localStorage.getItem(`poop_logs_${currentUser}`) || "[]");
    for(let i=1; i<=lastDate; i++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const dayLogs = logs.filter(l => l.date === dateStr);
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.innerHTML = `<span class="date-num">${i}</span><div class="dot-grid"></div>`;
        const dotGrid = dayEl.querySelector('.dot-grid');
        dayLogs.slice(0, 9).forEach(log => {
            const dot = document.createElement('div');
            if (log.isFail) { dot.className = "status-dot fail-x"; dot.innerText = "×"; }
            else {
                let color = log.type === '설사'?'yellow':log.type === '변비'?'brown':log.type === '장염'?'purple':log.type === '혈변'?'red':'success';
                dot.className = `status-dot ${color}`;
            }
            dotGrid.appendChild(dot);
        });
        if(dayLogs.length > 0) { dayEl.classList.add('has-log'); dayEl.onclick = () => showDetail(dateStr, dayLogs); }
        grid.appendChild(dayEl);
    }
}

function showDetail(d, l) {
    document.getElementById('modal-date').innerText = d + " 기록";
    const list = document.getElementById('modal-timeline');
    list.innerHTML = l.map(i => {
        let color = i.type === "혈변"?"#f44336":i.type === "설사"?"#fbc02d":i.type === "변비"?"#8d6e63":i.type === "장염"?"#ba68c8":i.isFail?"#000":"#81c784";
        return `<li style="color:${color}; border-bottom:1px solid #eee; padding:10px 0; display:flex; align-items:center;">
                    <input type="checkbox" class="log-check" value="${i.id}" onchange="updateDeleteBtn()">
                    <span style="margin-left:10px;">[${i.time}] ${i.duration} - ${i.type}${i.isFail ? '(실패)':''}</span>
                </li>`;
    }).join('');
    document.getElementById('log-modal').style.display = 'flex';
}

function updateDeleteBtn() {
    const checks = document.querySelectorAll('.log-check:checked');
    document.getElementById('btn-delete-selected').style.display = checks.length > 0 ? 'block' : 'none';
}

function deleteSelectedLogs() {
    const checks = Array.from(document.querySelectorAll('.log-check:checked')).map(c => Number(c.value));
    let logs = JSON.parse(localStorage.getItem(`poop_logs_${currentUser}`) || "[]");
    logs = logs.filter(l => !checks.includes(l.id));
    localStorage.setItem(`poop_logs_${currentUser}`, JSON.stringify(logs));
    closeModal(); renderCalendar();
}

function closeModal() { document.getElementById('log-modal').style.display = 'none'; }
function closeModalExternally(e) { if(e.target.id === 'log-modal') closeModal(); }