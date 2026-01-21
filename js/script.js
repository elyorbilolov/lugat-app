let lugatData = null;
let normalizedLugatData = {}; // Store data with normalized keys
let currentCategory = null;
let quizWords = [];
let quizCurrentIndex = 0;
let quizStartTime = null;
let quizTimerInterval = null;
let quizCorrect = 0;
let quizIncorrectWords = 0;
let quizTimeLeft = 60; // 1 minute challenge

function normalizeKey(key) {
    if (!key) return '';
    return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeWord(w) {
    return {
        word: w.word || w.en || '',
        translation: w.translation || w.uz || '',
        transcription: w.transcription || ''
    };
}

// Load JSON data
fetch('lugat.json')
    .then(response => response.json())
    .then(data => {
        lugatData = data;
        // Pre-normalize keys and words
        for (let key in data) {
            const normKey = normalizeKey(key);
            normalizedLugatData[normKey] = data[key].map(normalizeWord);
        }
        initCards();
    })
    .catch(error => console.error('Error loading lugat data:', error));

function initCards() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const title = card.querySelector('.card-title').innerText.trim();
        const normKey = normalizeKey(title);
        
        // Update word count if entry exists in JSON
        if (normalizedLugatData[normKey]) {
            const count = normalizedLugatData[normKey].length;
            card.querySelector('.card-subtitle').innerText = `${count} words`;
        }

        card.addEventListener('click', () => {
            showCategory(title);
        });
    });
}

function showCategory(category) {
    currentCategory = category;
    const normKey = normalizeKey(category);
    const words = normalizedLugatData[normKey] || [];
    
    document.getElementById('categoryGrid').style.display = 'none';
    document.getElementById('detailView').style.display = 'block';
    document.getElementById('categoryTitle').innerText = category;
    document.getElementById('categoryCount').innerText = `${words.length} words available`;
    
    renderWords(words);
    window.scrollTo(0, 0);
}

function showGrid() {
    document.getElementById('detailView').style.display = 'none';
    document.getElementById('categoryGrid').style.display = 'grid';
    document.getElementById('wordSearch').value = '';
}

function renderWords(words) {
    const tbody = document.getElementById('wordListBody');
    tbody.innerHTML = words.map(w => `
        <tr>
            <td><span class="translation">${w.translation}</span></td>
            <td><span class="word-text">${w.word}</span></td>
            <td><span class="transcription">${w.transcription}</span></td>
        </tr>
    `).join('');
}

function filterWords() {
    const searchTerm = document.getElementById('wordSearch').value.toLowerCase();
    const normKey = normalizeKey(currentCategory);
    const words = normalizedLugatData[normKey] || [];
    const filtered = words.filter(w => 
        w.word.toLowerCase().includes(searchTerm) || 
        w.translation.toLowerCase().includes(searchTerm)
    );
    renderWords(filtered);
}

function filterCategories() {
    const searchTerm = document.getElementById('categorySearch').value.toLowerCase();
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
        const title = card.querySelector('.card-title').innerText.toLowerCase();
        if (title.includes(searchTerm)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Quiz Functions
function startQuiz() {
    const normKey = normalizeKey(currentCategory);
    const allWords = normalizedLugatData[normKey] || [];
    
    if (allWords.length === 0) {
        alert('No words in this category to start quiz!');
        return;
    }

    // Shuffle ALL words in the category for the 1-min challenge
    quizWords = [...allWords].sort(() => 0.5 - Math.random());
    quizCurrentIndex = 0;
    quizCorrect = 0;
    quizIncorrectWords = 0;
    quizTimeLeft = 60; // Reset to 1 minute
    
    document.getElementById('detailView').style.display = 'none';
    document.getElementById('quizView').style.display = 'block';
    document.getElementById('quizResult').style.display = 'none';
    document.querySelector('.quiz-body').style.display = 'block';
    
    document.getElementById('totalQuestionsNum').innerText = quizWords.length;
    
    startTimer();
    renderQuizWord();
}

function exitQuiz() {
    stopTimer();
    document.getElementById('quizView').style.display = 'none';
    document.getElementById('detailView').style.display = 'block';
}

function startTimer() {
    updateTimerDisplay();
    quizTimerInterval = setInterval(() => {
        quizTimeLeft--;
        updateTimerDisplay();
        if (quizTimeLeft <= 0) {
            stopTimer();
            showResult();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(quizTimerInterval);
}

function updateTimerDisplay() {
    const minutes = Math.floor(quizTimeLeft / 60).toString().padStart(2, '0');
    const seconds = (quizTimeLeft % 60).toString().padStart(2, '0');
    const timeStr = `${minutes}:${seconds}`;
    document.getElementById('timerText').innerText = timeStr;
    
    // Visual warning when time is low
    if (quizTimeLeft <= 10) {
        document.getElementById('timerText').parentElement.style.color = '#ff5252';
        document.getElementById('timerText').parentElement.style.background = 'rgba(255, 82, 82, 0.1)';
    } else {
        document.getElementById('timerText').parentElement.style.color = 'var(--accent)';
        document.getElementById('timerText').parentElement.style.background = 'rgba(24, 119, 242, 0.1)';
    }
    
    return timeStr;
}

function renderQuizWord() {
    if (quizCurrentIndex >= quizWords.length) {
        showResult();
        return;
    }

    const wordObj = quizWords[quizCurrentIndex];
    document.getElementById('currentQuestionNum').innerText = quizCurrentIndex + 1;
    document.getElementById('quizUzbekWord').innerText = wordObj.translation;
    document.getElementById('quizMessage').innerText = '';
    
    const targetWord = wordObj.word.trim();
    const inputsContainer = document.getElementById('letterInputs');
    inputsContainer.innerHTML = '';
    
    const words = targetWord.split(' ');
    
    words.forEach((word, wordIdx) => {
        const wordGroup = document.createElement('div');
        wordGroup.className = 'word-group';
        wordGroup.style.display = 'flex';
        wordGroup.style.gap = '8px';
        wordGroup.style.margin = '0 10px 10px 0';
        
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            if (char === '-' || char === '\'') {
                const span = document.createElement('span');
                span.innerText = char;
                span.className = 'separator';
                wordGroup.appendChild(span);
            } else {
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.className = 'letter-box';
                const globalIndex = words.slice(0, wordIdx).join(' ').length + (wordIdx > 0 ? 1 : 0) + i;
                input.dataset.index = globalIndex;
                
                input.addEventListener('input', (e) => handleLetterInput(e, targetWord));
                input.addEventListener('keydown', (e) => handleKeydown(e, globalIndex));
                
                // Add active class on focus for styling
                input.addEventListener('focus', () => {
                    document.querySelectorAll('.letter-box').forEach(box => box.classList.remove('active'));
                    input.classList.add('active');
                });
                
                wordGroup.appendChild(input);
            }
        }
        inputsContainer.appendChild(wordGroup);
    });
    
    setTimeout(() => {
        const firstInput = inputsContainer.querySelector('input');
        if (firstInput) {
            firstInput.focus();
            firstInput.classList.add('active');
        }
    }, 50);
}

function handleLetterInput(e, targetWord) {
    const input = e.target;
    const val = input.value.toLowerCase();
    
    if (val === '') return;

    const allInputs = Array.from(document.querySelectorAll('.letter-box'));
    const currIdx = allInputs.indexOf(input);
    
    if (currIdx < allInputs.length - 1) {
        allInputs[currIdx + 1].focus();
    } else {
        // Last letter typed, check the whole word
        setTimeout(() => checkWordComplete(targetWord), 100);
    }
}

function handleKeydown(e, globalIndex) {
    if (e.key === 'Backspace' && !e.target.value) {
        const allInputs = Array.from(document.querySelectorAll('.letter-box'));
        const currIdx = allInputs.indexOf(e.target);
        if (currIdx > 0) {
            allInputs[currIdx - 1].focus();
        }
    }
}

function checkWordComplete(targetWord) {
    const allInputs = Array.from(document.querySelectorAll('.letter-box'));
    let errorsInThisWord = 0;
    
    allInputs.forEach(input => {
        const index = parseInt(input.dataset.index);
        const targetChar = targetWord[index].toLowerCase();
        const typedChar = input.value.toLowerCase();
        
        if (typedChar === targetChar) {
            input.classList.add('correct');
        } else {
            input.classList.add('incorrect');
            errorsInThisWord++;
        }
    });

    let displayDelay = 400; // Default 0.4s for correct answers

    if (errorsInThisWord === 0) {
        quizCorrect++;
        document.getElementById('quizMessage').innerText = 'Correct! ✨';
        document.getElementById('quizMessage').style.color = '#00c853';
    } else {
        quizIncorrectWords++;
        document.getElementById('quizMessage').innerHTML = `Incorrect! ❌ <div class="correct-answer">Correct: ${targetWord}</div>`;
        document.getElementById('quizMessage').style.color = '#ff5252';
        displayDelay = 1500; // Give 1.5s to read the correct answer on error
    }
    
    setTimeout(() => {
        quizCurrentIndex++;
        if (quizCurrentIndex < quizWords.length && quizTimeLeft > 0) {
            renderQuizWord();
        } else {
            showResult();
        }
    }, displayDelay);
}

function showResult() {
    stopTimer();
    document.querySelector('.quiz-body').style.display = 'none';
    document.getElementById('quizResult').style.display = 'block';
    
    const statsContainer = document.querySelector('.result-stats');
    statsContainer.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Challenge Type</span>
            <span class="stat-value" style="font-size: 1.2rem">1 MINUTE CHALLENGE</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Correct Words</span>
            <span class="stat-value" style="color: #00c853">${quizCorrect}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Incorrect Words</span>
            <span class="stat-value" style="color: #ff5252">${quizIncorrectWords}</span>
        </div>
    `;
}
