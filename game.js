// Game State
const gameState = {
    company: '',
    participants: [],
    apiToken: '',
    accountId: '',
    startTime: null,
    currentTasks: [],
    messages: [],
    documents: [],
    teamChat: [],
    metrics: {
        reputation: 70,
        trust: 60,
        crisisLevel: 80
    },
    npcs: [],
    eventLog: []
};

// Crisis scenarios
const crisisScenarios = [
    {
        title: "Tietoturvamurto paljastunut",
        description: "Sosiaalisessa mediassa leviää nopeasti tieto, että yrityksenne tietojärjestelmiin on murtauduttu ja asiakastietoja on mahdollisesti vuotanut. Asiakkaat ovat huolissaan, media soittelee, ja sijoittajat vaativat selityksiä.",
        initialCrisisLevel: 85
    },
    {
        title: "Tuotevirhe aiheuttaa kohun",
        description: "Eräässä tuote-erässänne on havaittu vakava laatuvirhe. Asiakkaat raportoivat ongelmista sosiaalisessa mediassa, ja tilanne leviää nopeasti. Viranomaiset ovat ottaneet yhteyttä.",
        initialCrisisLevel: 75
    },
    {
        title: "Johdon epäeettinen toiminta paljastunut",
        description: "Media raportoi väitteistä, joiden mukaan yksi johtoryhmän jäsenistä olisi toiminut epäeettisesti liikesuhteissa. Henkilöstö on järkyttynyt ja asiakkaat kyseenalaistavat yrityksen arvot.",
        initialCrisisLevel: 80
    }
];

// NPC Types
const npcTypes = {
    media: ['Toimittaja - Päälehti', 'Toimittaja - Talous', 'Päätoimittaja'],
    socialMedia: ['Somevaikuttaja', 'Tubettaja', 'Bloggaaja'],
    customers: ['Suuri yritysasiakas', 'Kuluttaja-asiakas', 'Pitkäaikainen partneri'],
    suppliers: ['Kriittinen alihankkija', 'Toimitusketjun partneri'],
    investors: ['Institutionaalinen sijoittaja', 'Pääomasijoittaja'],
    board: ['Hallituksen puheenjohtaja', 'Hallituksen jäsen']
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initSetupScreen();
});

function initSetupScreen() {
    const participantCountInput = document.getElementById('participant-count');
    const startButton = document.getElementById('start-game');
    
    participantCountInput.addEventListener('change', updateParticipantFields);
    updateParticipantFields();
    
    startButton.addEventListener('click', startGame);
}

function updateParticipantFields() {
    const count = parseInt(document.getElementById('participant-count').value);
    const container = document.getElementById('participants-container');
    container.innerHTML = '';
    
    const commonTitles = ['CEO', 'CFO', 'COO', 'CHRO', 'CCO', 'CISO', 'CTO', 'CLO'];
    
    for (let i = 0; i < count; i++) {
        const entry = document.createElement('div');
        entry.className = 'participant-entry';
        entry.innerHTML = `
            <div class="form-group">
                <input type="text" placeholder="Nimi" data-field="name" data-index="${i}" required>
            </div>
            <div class="form-group">
                <input type="text" placeholder="Titteli (esim. ${commonTitles[i] || 'Manager'})" data-field="title" data-index="${i}" required>
            </div>
        `;
        container.appendChild(entry);
    }
}

async function startGame() {
    // Collect data
    gameState.company = document.getElementById('company-name').value;
    gameState.apiToken = document.getElementById('cloudflare-api').value;
    gameState.accountId = document.getElementById('cloudflare-account').value;
    
    if (!gameState.company || !gameState.apiToken || !gameState.accountId) {
        alert('Täytä kaikki pakolliset kentät');
        return;
    }
    
    // Collect participants
    gameState.participants = [];
    const nameInputs = document.querySelectorAll('[data-field="name"]');
    const titleInputs = document.querySelectorAll('[data-field="title"]');
    
    for (let i = 0; i < nameInputs.length; i++) {
        if (!nameInputs[i].value || !titleInputs[i].value) {
            alert('Täytä kaikkien osallistujien tiedot');
            return;
        }
        gameState.participants.push({
            name: nameInputs[i].value,
            title: titleInputs[i].value
        });
    }
    
    // Initialize game
    gameState.startTime = Date.now();
    
    // Select random crisis
    const crisis = crisisScenarios[Math.floor(Math.random() * crisisScenarios.length)];
    gameState.crisis = crisis;
    gameState.metrics.crisisLevel = crisis.initialCrisisLevel;
    
    // Generate NPCs
    await generateNPCs();
    
    // Switch to game screen
    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    
    // Initialize game screen
    initGameScreen();
}

async function generateNPCs() {
    // Generate diverse NPCs
    const allNPCs = [];
    
    for (const [category, types] of Object.entries(npcTypes)) {
        const npcCount = category === 'media' ? 2 : 1;
        for (let i = 0; i < Math.min(npcCount, types.length); i++) {
            const npc = {
                id: `npc-${allNPCs.length}`,
                category,
                role: types[i],
                sentiment: 'negative',
                trustLevel: 40,
                messages: []
            };
            allNPCs.push(npc);
        }
    }
    
    gameState.npcs = allNPCs;
}

function initGameScreen() {
    // Set company name
    document.getElementById('game-company-name').textContent = gameState.company;
    
    // Display crisis
    document.getElementById('crisis-description').textContent = gameState.crisis.description;
    
    // Start timer
    startGameTimer();
    
    // Initialize tabs
    initTabs();
    
    // Initialize team chat
    initTeamChat();
    
    // Initialize document creation
    initDocuments();
    
    // Generate initial tasks
    generateInitialTasks();
    
    // Generate initial NPC messages
    generateInitialNPCMessages();
    
    // End game button
    document.getElementById('end-game').addEventListener('click', endGame);
    
    // Update metrics display
    updateMetricsDisplay();
}

function startGameTimer() {
    setInterval(() => {
        const elapsed = Date.now() - gameState.startTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        document.getElementById('game-timer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

function initTeamChat() {
    const sendButton = document.getElementById('send-team-message');
    const input = document.getElementById('team-message-input');
    
    const sendMessage = () => {
        const message = input.value.trim();
        if (!message) return;
        
        // Add to team chat (as facilitator)
        addTeamMessage('Fasilitaattori', 'Ohjaaja', message);
        input.value = '';
    };
    
    sendButton.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

function addTeamMessage(name, role, content) {
    const message = {
        sender: name,
        role: role,
        content: content,
        time: new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
    };
    
    gameState.teamChat.push(message);
    
    const messageEl = document.createElement('div');
    messageEl.className = 'message team';
    messageEl.innerHTML = `
        <div class="message-header">
            <div>
                <span class="message-sender">${message.sender}</span>
                <span class="message-role"> - ${message.role}</span>
            </div>
            <span class="message-time">${message.time}</span>
        </div>
        <div class="message-content">${message.content}</div>
    `;
    
    document.getElementById('team-chat').appendChild(messageEl);
    messageEl.scrollIntoView({ behavior: 'smooth' });
}

function initDocuments() {
    const createBtn = document.getElementById('create-document-btn');
    const modal = document.getElementById('document-modal');
    const closeBtn = modal.querySelector('.modal-close');
    const submitBtn = document.getElementById('submit-document');
    const authorSelect = document.getElementById('doc-author');
    
    // Populate author select
    gameState.participants.forEach(p => {
        const option = document.createElement('option');
        option.value = p.name;
        option.textContent = `${p.name} (${p.title})`;
        authorSelect.appendChild(option);
    });
    
    createBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    submitBtn.addEventListener('click', async () => {
        const type = document.getElementById('doc-type').value;
        const author = document.getElementById('doc-author').value;
        const content = document.getElementById('doc-content').value;
        
        if (!content.trim()) {
            alert('Kirjoita dokumentin sisältö');
            return;
        }
        
        await submitDocument(type, author, content);
        modal.classList.remove('active');
        document.getElementById('doc-content').value = '';
    });
}

async function submitDocument(type, author, content) {
    const typeNames = {
        'press-release': 'Lehdistötiedote',
        'internal-memo': 'Sisäinen viesti',
        'legal-brief': 'Juridinen riskinarvio',
        'technical-report': 'Tekninen selvitys'
    };
    
    const document = {
        id: `doc-${gameState.documents.length}`,
        type: typeNames[type],
        author: author,
        content: content,
        time: new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }),
        reactions: []
    };
    
    gameState.documents.push(document);
    logEvent(`Dokumentti julkaistu: ${document.type} (${author})`);
    
    // Display document
    displayDocument(document);
    
    // Generate NPC reactions
    await generateDocumentReactions(document);
}

function displayDocument(doc) {
    const docEl = document.createElement('div');
    docEl.className = 'document-card';
    docEl.innerHTML = `
        <div class="document-header">
            <span class="document-title">${doc.type}</span>
            <span class="document-author">${doc.author} • ${doc.time}</span>
        </div>
        <div class="document-content">${doc.content}</div>
        <div class="document-reactions" id="reactions-${doc.id}">Analysoidaan sidosryhmäreaktioita...</div>
    `;
    
    document.getElementById('documents-list').appendChild(docEl);
}

async function generateDocumentReactions(doc) {
    const prompt = `Arvioi seuraava ${gameState.company}-yrityksen julkaisema dokumentti mainekriisitilanteessa:

Kriisi: ${gameState.crisis.description}

Dokumentti (${doc.type}):
${doc.content}

Anna lyhyt (1-2 lausetta) arvio siitä, miten eri sidosryhmät (media, asiakkaat, sijoittajat) todennäköisesti reagoisivat tähän dokumenttiin. Ole realistinen ja kriittinen.`;

    try {
        const reactions = await callCloudflareAI(prompt);
        const reactionsEl = document.getElementById(`reactions-${doc.id}`);
        if (reactionsEl) {
            reactionsEl.textContent = `📊 Reaktiot: ${reactions}`;
        }
        
        // Update metrics based on document quality
        updateMetrics({ reputation: 2, trust: 1 });
        
    } catch (error) {
        console.error('Error generating reactions:', error);
        const reactionsEl = document.getElementById(`reactions-${doc.id}`);
        if (reactionsEl) {
            reactionsEl.textContent = '⚠️ Virhe reaktioiden analysoinnissa';
        }
    }
}

function generateInitialTasks() {
    const tasks = [
        {
            id: 'task-1',
            title: 'Median yhteydenotto',
            description: 'Suurimman päälehden toimittaja vaatii lausuntoa kriisistä. Aikaa vastata 10 minuuttia.',
            timeLimit: 600,
            urgent: true,
            options: [
                { text: 'Anna välitön lausunto', impact: { reputation: -5, trust: 5 } },
                { text: 'Pyydä lisäaikaa perusteelliseen vastaukseen', impact: { reputation: 2, trust: -3 } },
                { text: 'Kieltäydy kommentoimasta toistaiseksi', impact: { reputation: -10, trust: -5 } }
            ]
        },
        {
            id: 'task-2',
            title: 'Asiakkaan huoli',
            description: 'Suurin asiakkaanne uhkaa lopettaa sopimuksen välittömästi ellei saa vakuuttavaa selitystä.',
            timeLimit: 900,
            urgent: false,
            options: [
                { text: 'Soita asiakkaalle henkilökohtaisesti', impact: { reputation: 3, trust: 8 } },
                { text: 'Lähetä virallinen kirje', impact: { reputation: 1, trust: 2 } },
                { text: 'Tarjoa kompensaatiota', impact: { reputation: -2, trust: 5 } }
            ]
        }
    ];
    
    tasks.forEach(task => {
        gameState.currentTasks.push(task);
        displayTask(task);
        startTaskTimer(task);
    });
}

function displayTask(task) {
    const taskEl = document.createElement('div');
    taskEl.className = `task-card ${task.urgent ? 'urgent' : ''}`;
    taskEl.dataset.taskId = task.id;
    taskEl.innerHTML = `
        <div class="task-header">
            <span class="task-title">${task.title}</span>
            <span class="task-timer ${task.urgent ? 'urgent' : ''}" id="timer-${task.id}">
                ${Math.floor(task.timeLimit / 60)}:${(task.timeLimit % 60).toString().padStart(2, '0')}
            </span>
        </div>
        <div class="task-description">${task.description}</div>
    `;
    
    taskEl.addEventListener('click', () => openTaskModal(task));
    document.getElementById('active-tasks').appendChild(taskEl);
}

function startTaskTimer(task) {
    const timerEl = document.getElementById(`timer-${task.id}`);
    
    const interval = setInterval(() => {
        task.timeLimit--;
        
        if (task.timeLimit <= 0) {
            clearInterval(interval);
            handleTaskTimeout(task);
            return;
        }
        
        const minutes = Math.floor(task.timeLimit / 60);
        const seconds = task.timeLimit % 60;
        timerEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (task.timeLimit <= 60) {
            timerEl.classList.add('urgent');
        }
    }, 1000);
}

function openTaskModal(task) {
    const modal = document.getElementById('task-modal');
    document.getElementById('task-modal-title').textContent = task.title;
    document.getElementById('task-modal-body').textContent = task.description;
    
    const actionsContainer = document.getElementById('task-modal-actions');
    actionsContainer.innerHTML = '';
    
    task.options.forEach((option, index) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'task-option';
        optionEl.textContent = option.text;
        optionEl.addEventListener('click', () => {
            handleTaskChoice(task, option);
            modal.classList.remove('active');
        });
        actionsContainer.appendChild(optionEl);
    });
    
    modal.classList.add('active');
    
    // Close modal
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.classList.remove('active');
    });
}

function handleTaskChoice(task, option) {
    // Remove task
    removeTask(task.id);
    
    // Apply impact
    updateMetrics(option.impact);
    
    // Log event
    logEvent(`Tehtävä ratkaistu: ${task.title} - Valinta: ${option.text}`);
    
    // Generate follow-up
    setTimeout(() => generateFollowUpTask(task, option), 3000);
}

function handleTaskTimeout(task) {
    removeTask(task.id);
    updateMetrics({ reputation: -10, trust: -10, crisisLevel: 5 });
    logEvent(`Tehtävä aikakatkaisu: ${task.title}`);
}

function removeTask(taskId) {
    const taskEl = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskEl) {
        taskEl.style.opacity = '0';
        setTimeout(() => taskEl.remove(), 300);
    }
    gameState.currentTasks = gameState.currentTasks.filter(t => t.id !== taskId);
}

function generateFollowUpTask(previousTask, choice) {
    const followUps = {
        'task-1': {
            title: 'Median jatkokysymys',
            description: `Toimittaja lähettää jatkokysymyksiä vastauksenne pohjalta. Media vaikuttaa ${choice.impact.reputation > 0 ? 'tyytyväiseltä' : 'skeptiseltä'}.`,
            timeLimit: 420,
            urgent: true
        },
        'task-2': {
            title: 'Asiakkaan päätös',
            description: `Asiakas ${choice.impact.trust > 5 ? 'vaikuttaa tyytyväiseltä ja harkitsee jatkamista' : 'vaatii lisätoimenpiteitä luottamuksen palauttamiseksi'}.`,
            timeLimit: 600,
            urgent: false
        }
    };
    
    const followUp = followUps[previousTask.id];
    if (followUp) {
        const newTask = {
            ...followUp,
            id: `task-followup-${Date.now()}`,
            options: [
                { text: 'Jatka avointa dialogia', impact: { reputation: 3, trust: 3 } },
                { text: 'Eskaloi johdolle', impact: { reputation: 1, trust: 5 } }
            ]
        };
        gameState.currentTasks.push(newTask);
        displayTask(newTask);
        startTaskTimer(newTask);
    }
}

async function generateInitialNPCMessages() {
    const selectedNPCs = gameState.npcs.slice(0, 3);
    
    for (const npc of selectedNPCs) {
        setTimeout(async () => {
            await generateNPCMessage(npc);
        }, Math.random() * 5000);
    }
}

async function generateNPCMessage(npc) {
    const prompt = `Olet ${npc.role} joka reagoi seuraavaan yrityksen mainekriisiin:

Yritys: ${gameState.company}
Kriisi: ${gameState.crisis.description}

Kirjoita lyhyt (2-3 lausetta), realistinen viesti tai kysymys joka tämä henkilö lähettäisi yritykselle. Ole ${npc.sentiment === 'negative' ? 'huolestunut ja vaativa' : 'huolestunut mutta rakentava'}.`;

    try {
        const message = await callCloudflareAI(prompt);
        addNPCMessage(npc, message);
    } catch (error) {
        console.error('Error generating NPC message:', error);
        addNPCMessage(npc, `[${npc.role}] Vaatii kiireellistä selvitystä tilanteesta.`);
    }
}

function addNPCMessage(npc, content) {
    const message = {
        npcId: npc.id,
        role: npc.role,
        content: content,
        time: new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
    };
    
    gameState.messages.push(message);
    
    const messageEl = document.createElement('div');
    messageEl.className = 'message npc';
    messageEl.innerHTML = `
        <div class="message-header">
            <div>
                <span class="message-sender">${message.role}</span>
            </div>
            <span class="message-time">${message.time}</span>
        </div>
        <div class="message-content">${message.content}</div>
    `;
    
    document.getElementById('npc-messages').appendChild(messageEl);
    messageEl.scrollIntoView({ behavior: 'smooth' });
}

function updateMetrics(changes) {
    if (changes.reputation) {
        gameState.metrics.reputation = Math.max(0, Math.min(100, gameState.metrics.reputation + changes.reputation));
    }
    if (changes.trust) {
        gameState.metrics.trust = Math.max(0, Math.min(100, gameState.metrics.trust + changes.trust));
    }
    if (changes.crisisLevel) {
        gameState.metrics.crisisLevel = Math.max(0, Math.min(100, gameState.metrics.crisisLevel + changes.crisisLevel));
    }
    
    updateMetricsDisplay();
}

function updateMetricsDisplay() {
    document.getElementById('reputation-bar').style.width = `${gameState.metrics.reputation}%`;
    document.getElementById('reputation-value').textContent = `${Math.round(gameState.metrics.reputation)}%`;
    
    document.getElementById('trust-bar').style.width = `${gameState.metrics.trust}%`;
    document.getElementById('trust-value').textContent = `${Math.round(gameState.metrics.trust)}%`;
    
    document.getElementById('crisis-bar').style.width = `${gameState.metrics.crisisLevel}%`;
    const crisisLabels = ['Matala', 'Kohtalainen', 'Korkea', 'Kriittinen'];
    const crisisIndex = Math.floor(gameState.metrics.crisisLevel / 25);
    document.getElementById('crisis-value').textContent = crisisLabels[Math.min(crisisIndex, 3)];
}

function logEvent(description) {
    const elapsed = Date.now() - gameState.startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    gameState.eventLog.push({
        time: `${minutes}:${seconds.toString().padStart(2, '0')}`,
        description: description
    });
}

async function callCloudflareAI(prompt) {
    const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${gameState.accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${gameState.apiToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'Olet asiantuntija mainekriisien hallinnassa. Vastaa aina suomeksi, ytimekkäästi ja realistisesti.' },
                    { role: 'user', content: prompt }
                ]
            })
        }
    );
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.result.response;
}

async function endGame() {
    if (!confirm('Haluatko varmasti päättää simulaation?')) {
        return;
    }
    
    document.getElementById('game-screen').classList.remove('active');
    document.getElementById('results-screen').classList.add('active');
    
    await generateResults();
}

async function generateResults() {
    const duration = Math.floor((Date.now() - gameState.startTime) / 60000);
    
    let resultsHTML = `
        <div class="results-section">
            <h2>Suorituskyvyn yhteenveto</h2>
            <div class="results-grid">
                <div class="result-card">
                    <div class="result-label">Maine</div>
                    <div class="result-value">${Math.round(gameState.metrics.reputation)}%</div>
                </div>
                <div class="result-card">
                    <div class="result-label">Luottamus</div>
                    <div class="result-value">${Math.round(gameState.metrics.trust)}%</div>
                </div>
                <div class="result-card">
                    <div class="result-label">Kesto</div>
                    <div class="result-value">${duration} min</div>
                </div>
                <div class="result-card">
                    <div class="result-label">Tehtäviä</div>
                    <div class="result-value">${gameState.eventLog.length}</div>
                </div>
            </div>
        </div>
        
        <div class="results-section">
            <h2>Tapahtumien kronologia</h2>
            <div class="timeline">
    `;
    
    gameState.eventLog.forEach(event => {
        resultsHTML += `
            <div class="timeline-item">
                <div class="timeline-time">${event.time}</div>
                <div class="timeline-content">${event.description}</div>
            </div>
        `;
    });
    
    resultsHTML += `
            </div>
        </div>
        
        <div class="results-section">
            <h2>Kokonaisarvio</h2>
            <div class="recommendations">
                <h3>Vahvuudet:</h3>
                <ul>
    `;
    
    if (gameState.metrics.reputation > 60) {
        resultsHTML += '<li>Maine säilyi kohtuullisen hyvänä kriisin aikana</li>';
    }
    if (gameState.documents.length > 0) {
        resultsHTML += '<li>Aktiivinen viestintä sidosryhmille</li>';
    }
    if (gameState.teamChat.length > 5) {
        resultsHTML += '<li>Hyvä sisäinen kommunikaatio</li>';
    }
    
    resultsHTML += `
                </ul>
                <h3>Kehityskohteet:</h3>
                <ul>
    `;
    
    if (gameState.metrics.reputation < 50) {
        resultsHTML += '<li>Maineen hallinta vaatii nopeampia ja vaikuttavampia toimenpiteitä</li>';
    }
    if (gameState.documents.length < 2) {
        resultsHTML += '<li>Aktiivisempi dokumentointi ja viestintä tarvitaan</li>';
    }
    if (gameState.metrics.trust < 50) {
        resultsHTML += '<li>Sidosryhmien luottamuksen rakentaminen vaatii enemmän huomiota</li>';
    }
    
    resultsHTML += `
                </ul>
            </div>
        </div>
        
        <div class="results-section">
            <h2>Suositukset</h2>
            <p>Kokonaisuutena johtoryhmä ${gameState.metrics.reputation > 60 ? 'onnistui kohtuullisen hyvin' : 'tarvitsee lisäharjoittelua'} 
            mainekriisin hallinnassa. Tärkeintä on nopea reagointi, läpinäkyvä viestintä ja johdonmukainen päätöksenteko.</p>
        </div>
    `;
    
    document.getElementById('results-content').innerHTML = resultsHTML;
    
    document.getElementById('restart-game').addEventListener('click', () => {
        location.reload();
    });
}