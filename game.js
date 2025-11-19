// Game State
const gameState = {
    company: '',
    participants: [],
    workerUrl: '',
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
    const testLink = document.getElementById('test-connection-link');
    
    participantCountInput.addEventListener('change', updateParticipantFields);
    updateParticipantFields();
    
    startButton.addEventListener('click', startGame);
    
    // Test connection functionality
    if (testLink) {
        testLink.addEventListener('click', (e) => {
            e.preventDefault();
            openTestModal();
        });
    }
}

function openTestModal() {
    const modal = document.getElementById('test-modal');
    const closeBtn = modal.querySelector('.modal-close');
    const runTestBtn = document.getElementById('run-test');
    const statusDiv = document.getElementById('test-status');
    
    modal.classList.add('active');
    
    closeBtn.onclick = () => modal.classList.remove('active');
    window.onclick = (e) => {
        if (e.target === modal) modal.classList.remove('active');
    };
    
    runTestBtn.onclick = async () => {
        const workerUrl = document.getElementById('worker-url').value;
        if (!workerUrl) {
            statusDiv.innerHTML = '<p style="color: red;">Syötä Worker URL ensin!</p>';
            return;
        }
        
        statusDiv.innerHTML = '<p>Testataan yhteyttä...</p>';
        runTestBtn.disabled = true;
        
        try {
            const result = await testWorkerConnection(workerUrl);
            if (result.success) {
                statusDiv.innerHTML = `
                    <p style="color: green;">✅ Yhteys toimii!</p>
                    <p>Vastaus: ${result.response}</p>
                `;
            } else {
                statusDiv.innerHTML = `
                    <p style="color: red;">❌ Yhteys epäonnistui</p>
                    <p>${result.error}</p>
                `;
            }
        } catch (error) {
            statusDiv.innerHTML = `
                <p style="color: red;">❌ Virhe</p>
                <p>${error.message}</p>
            `;
        } finally {
            runTestBtn.disabled = false;
        }
    };
}

async function testWorkerConnection(workerUrl) {
    try {
        const response = await fetch(workerUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'Vastaa lyhyesti.' },
                    { role: 'user', content: 'Testi: vastaa "OK"' }
                ]
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                error: `HTTP ${response.status}: ${errorData.error || response.statusText}`
            };
        }
        
        const data = await response.json();
        return {
            success: true,
            response: data.result?.response || 'Vastaus saatu'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
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
    gameState.workerUrl = document.getElementById('worker-url').value;
    
    if (!gameState.company || !gameState.workerUrl) {
        alert('Täytä kaikki pakolliset kentät');
        return;
    }
    
    // Validate Worker URL
    if (!gameState.workerUrl.startsWith('https://')) {
        alert('Worker URL:n pitää alkaa https://');
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
    
    // Test connection before starting
    const testResult = await testWorkerConnection(gameState.workerUrl);
    if (!testResult.success) {
        alert(`Worker-yhteys ei toimi:\n${testResult.error}\n\nTarkista Worker URL ja yritä uudelleen.`);
        return;
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
        name: name,
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
                <span class="message-sender">${message.name}</span>
                <span class="message-role">(${message.role})</span>
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
    
    // Populate author dropdown
    authorSelect.innerHTML = gameState.participants.map(p => 
        `<option value="${p.name}">${p.name} (${p.title})</option>`
    ).join('');
    
    createBtn.addEventListener('click', () => {
        modal.classList.add('active');
    });
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
    
    submitBtn.addEventListener('click', async () => {
        await createDocument();
    });
}

async function createDocument() {
    const type = document.getElementById('doc-type').value;
    const author = document.getElementById('doc-author').value;
    const content = document.getElementById('doc-content').value.trim();
    
    if (!content) {
        alert('Kirjoita dokumentin sisältö');
        return;
    }
    
    const typeNames = {
        'press-release': 'Lehdistötiedote',
        'internal-memo': 'Sisäinen viesti',
        'legal-brief': 'Juridinen riskinarvio',
        'technical-report': 'Tekninen selvitys'
    };
    
    // Generate AI feedback on the document
    const prompt = `Arvioi seuraava ${typeNames[type].toLowerCase()} mainekriisitilanteessa:

Yritys: ${gameState.company}
Kriisi: ${gameState.crisis.description}
Dokumentti:
${content}

Anna lyhyt (2-3 lausetta) palaute: onko viesti selkeä, asianmukainen ja riittävän luottamusta herättävä? Mainitse yksi vahvuus ja yksi kehityskohde.`;

    const submitBtn = document.getElementById('submit-document');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Julkaistaan...';
    
    try {
        const feedback = await callCloudflareAI(prompt);
        
        const document = {
            type: typeNames[type],
            author: author,
            content: content,
            feedback: feedback,
            time: new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
        };
        
        gameState.documents.push(document);
        displayDocument(document);
        
        // Update metrics based on document quality
        const impact = analyzeDocumentImpact(content, type);
        updateMetrics(impact);
        
        // Log event
        logEvent(`${author} julkaisi ${typeNames[type].toLowerCase()}en`);
        
        // Close modal and reset
        document.getElementById('document-modal').classList.remove('active');
        document.getElementById('doc-content').value = '';
        
    } catch (error) {
        console.error('Error creating document:', error);
        alert('Dokumentin luominen epäonnistui. Tarkista Worker-yhteys.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Julkaise dokumentti';
    }
}

function analyzeDocumentImpact(content, type) {
    // Simple heuristic analysis
    const wordCount = content.split(/\s+/).length;
    const hasApology = /pahoittel|anteeksi|pahoittelu/i.test(content);
    const hasAction = /toimenpide|ratkaisu|selvitä|korjaa/i.test(content);
    
    let reputation = 0;
    let trust = 0;
    let crisisLevel = 0;
    
    if (wordCount > 50) {
        reputation += 2;
        trust += 1;
    }
    
    if (hasApology) {
        trust += 2;
    }
    
    if (hasAction) {
        reputation += 3;
        trust += 2;
        crisisLevel -= 5;
    }
    
    if (type === 'press-release') {
        reputation += 2;
    }
    
    return { reputation, trust, crisisLevel };
}

function displayDocument(document) {
    const docEl = document.createElement('div');
    docEl.className = 'document-card';
    docEl.innerHTML = `
        <div class="document-header">
            <span class="document-title">${document.type}</span>
            <span class="document-author">${document.author} • ${document.time}</span>
        </div>
        <div class="document-content">${document.content}</div>
        <div class="document-reactions">
            <strong>AI-palaute:</strong> ${document.feedback}
        </div>
    `;
    
    document.getElementById('documents-list').appendChild(docEl);
}

function generateInitialTasks() {
    const tasks = [
        {
            id: 'task-1',
            title: 'Arvioi tilanteen vakavuus',
            description: 'Määrittele kriisin laajuus ja välittömät riskit',
            deadline: 5,
            urgent: true,
            options: [
                { text: 'Kriisi on vakava, vaatii välittömiä toimia', impact: { crisisLevel: -5, trust: 3 } },
                { text: 'Tilanne on hallittavissa sisäisesti', impact: { reputation: -3, trust: -2 } }
            ]
        },
        {
            id: 'task-2',
            title: 'Nimeä kriisiryhmä',
            description: 'Valitse vastuuhenkilöt ja määrittele roolit',
            deadline: 10,
            urgent: false,
            options: [
                { text: 'CEO johtaa, viestintäjohtaja päävastuussa', impact: { reputation: 2, trust: 2 } },
                { text: 'Hajautettu vastuu eri osastoille', impact: { reputation: -2, crisisLevel: 3 } }
            ]
        },
        {
            id: 'task-3',
            title: 'Laadi viestintästrategia',
            description: 'Päätä sisäisen ja ulkoisen viestinnän linjaukset',
            deadline: 15,
            urgent: false,
            options: [
                { text: 'Avoin ja läpinäkyvä viestintä kaikille', impact: { reputation: 5, trust: 5, crisisLevel: -10 } },
                { text: 'Rajoitettu tiedotus, vain välttämätön', impact: { reputation: -5, trust: -8 } }
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
    taskEl.id = task.id;
    taskEl.innerHTML = `
        <div class="task-header">
            <span class="task-title">${task.title}</span>
            <span class="task-timer ${task.urgent ? 'urgent' : ''}" data-deadline="${task.deadline}">
                ${task.deadline}:00
            </span>
        </div>
        <div class="task-description">${task.description}</div>
    `;
    
    taskEl.addEventListener('click', () => openTaskModal(task));
    
    document.getElementById('active-tasks').appendChild(taskEl);
}

function startTaskTimer(task) {
    const timerEl = document.querySelector(`#${task.id} .task-timer`);
    const deadline = task.deadline * 60; // Convert to seconds
    let elapsed = 0;
    
    const interval = setInterval(() => {
        elapsed++;
        const remaining = deadline - elapsed;
        
        if (remaining <= 0) {
            clearInterval(interval);
            timerEl.textContent = 'AIKAKATKO!';
            timerEl.classList.add('urgent');
            // Auto-complete with negative impact
            completeTask(task, null, true);
        } else {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timerEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
            
            if (remaining < 60) {
                timerEl.classList.add('urgent');
            }
        }
    }, 1000);
}

function openTaskModal(task) {
    const modal = document.getElementById('task-modal');
    const title = document.getElementById('task-modal-title');
    const body = document.getElementById('task-modal-body');
    const actions = document.getElementById('task-modal-actions');
    const closeBtn = modal.querySelector('.modal-close');
    
    title.textContent = task.title;
    body.textContent = task.description;
    
    actions.innerHTML = '';
    task.options.forEach(option => {
        const optionEl = document.createElement('div');
        optionEl.className = 'task-option';
        optionEl.textContent = option.text;
        optionEl.addEventListener('click', () => {
            completeTask(task, option);
            modal.classList.remove('active');
        });
        actions.appendChild(optionEl);
    });
    
    modal.classList.add('active');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

function completeTask(task, option, timeout = false) {
    // Remove task from display
    const taskEl = document.getElementById(task.id);
    if (taskEl) {
        taskEl.remove();
    }
    
    // Remove from active tasks
    gameState.currentTasks = gameState.currentTasks.filter(t => t.id !== task.id);
    
    if (timeout) {
        // Negative impact for timeout
        updateMetrics({ reputation: -5, trust: -5, crisisLevel: 10 });
        logEvent(`⏱️ Aikakatko: ${task.title}`);
    } else if (option) {
        // Apply selected option's impact
        updateMetrics(option.impact);
        logEvent(`✅ ${task.title}: ${option.text}`);
        
        // Possibly generate a new task based on the choice
        if (Math.random() > 0.5) {
            setTimeout(() => generateDynamicTask(task, option), 3000);
        }
    }
}

function generateDynamicTask(previousTask, choice) {
    const newTask = {
        id: `task-dynamic-${Date.now()}`,
        title: 'Jatkotoimenpiteet',
        description: `Edellinen päätöksenne "${choice.text}" vaatii lisätoimia. Miten jatkatte?`,
        deadline: 8,
        urgent: false,
        options: [
            { text: 'Jatka avointa dialogia', impact: { reputation: 3, trust: 3 } },
            { text: 'Eskaloi johdolle', impact: { reputation: 1, trust: 5 } }
        ]
    };
    gameState.currentTasks.push(newTask);
    displayTask(newTask);
    startTaskTimer(newTask);
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
    const response = await fetch(gameState.workerUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: 'Olet asiantuntija mainekriisien hallinnassa. Vastaa aina suomeksi, ytimekkäästi ja realistisesti.' },
                { role: 'user', content: prompt }
            ]
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Worker error: ${response.status} - ${errorData.error || response.statusText}`);
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
