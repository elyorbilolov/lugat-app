let lugatData = null;
let normalizedLugatData = {}; // Store data with normalized keys
let currentCategory = null;
let displayedWords = []; // Current words being shown in detail view
let quizWords = [];
let quizCurrentIndex = 0;
let quizStartTime = null;
let quizTimerInterval = null;
let quizCorrect = 0;
let quizIncorrectWords = 0;
let quizTimeLeft = 60; // 1 minute challenge

// Initialize Theme
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
});

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.getElementById('themeIcon');
    if (!themeIcon) return;
    
    if (theme === 'dark') {
        // Sun Icon
        themeIcon.innerHTML = `
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        `;
    } else {
        // Moon Icon
        themeIcon.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    }
}

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
    const grid = document.getElementById('categoryGrid');
    const cards = Array.from(grid.querySelectorAll('.card'));
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    // Remove existing Favorites card if it exists
    const existingFav = document.getElementById('favoritesCard');
    if (existingFav) existingFav.remove();

    // Add Favorites card if there are favorites
    if (favorites.length > 0) {
        const favCard = document.createElement('div');
        favCard.className = 'card';
        favCard.id = 'favoritesCard';
        favCard.style.borderColor = 'var(--accent)';
        favCard.innerHTML = `
            <div class="card-content">
                <h2 class="card-title">⭐ Favorites</h2>
                <p class="card-subtitle">${favorites.length} words</p>
                <div class="progress-bar" style="display: block"><div class="progress" style="width: 100%;"></div></div>
            </div>
            <div class="card-illustration"><img src="assets/favorites.png" alt="Favorites" style="opacity: 0.5"></div>
        `;
        favCard.addEventListener('click', () => showCategory('Favorites'));
        grid.prepend(favCard);
    }

    cards.forEach(card => {
        const title = card.querySelector('.card-title').innerText.trim();
        const normKey = normalizeKey(title);
        
        if (normalizedLugatData[normKey]) {
            const words = normalizedLugatData[normKey];
            const count = words.length;
            card.querySelector('.card-subtitle').innerText = `${count} words`;
            
            // Progress Bar
            const progressValue = getProgress(normKey);
            const progressBar = card.querySelector('.progress-bar');
            if (progressBar) {
                progressBar.style.display = 'block';
                progressBar.querySelector('.progress').style.width = `${progressValue}%`;
            }
        }

        card.addEventListener('click', () => {
            showCategory(title);
        });
    });
}

function getProgress(categoryKey) {
    const progressData = JSON.parse(localStorage.getItem('progress') || '{}');
    return progressData[categoryKey] || 0;
}

function saveProgress(categoryKey, correctCount, totalCount) {
    const progressData = JSON.parse(localStorage.getItem('progress') || '{}');
    const currentPercent = progressData[categoryKey] || 0;
    const newPercent = Math.round((correctCount / totalCount) * 100);
    
    // Only update if the new result is better
    if (newPercent > currentPercent) {
        progressData[categoryKey] = newPercent;
        localStorage.setItem('progress', JSON.stringify(progressData));
    }
}

function showCategory(category) {
    currentCategory = category;
    
    if (category === 'Favorites') {
        const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
        displayedWords = [];
        
        // Find favorite words in normalized data
        for (let key in normalizedLugatData) {
            normalizedLugatData[key].forEach(w => {
                if (favorites.includes(w.word)) {
                    // Check if already added to avoid duplicates from multiple categories
                    if (!displayedWords.some(dw => dw.word === w.word)) {
                        displayedWords.push(w);
                    }
                }
            });
        }
    } else {
        const normKey = normalizeKey(category);
        displayedWords = normalizedLugatData[normKey] || [];
    }
    
    document.getElementById('categoryGrid').style.display = 'none';
    document.getElementById('detailView').style.display = 'block';
    document.getElementById('categoryTitle').innerText = category;
    document.getElementById('categoryCount').innerText = `${displayedWords.length} words available`;
    
    renderWords(displayedWords);
    window.scrollTo(0, 0);
}

function showGrid() {
    document.getElementById('detailView').style.display = 'none';
    document.getElementById('categoryGrid').style.display = 'grid';
    document.getElementById('wordSearch').value = '';
    
    // Clear category search when returning
    const catSearch = document.getElementById('categorySearch');
    catSearch.value = '';
    filterCategories();
    
    window.scrollTo(0, 0);
}

function clearSearch(inputId) {
    const input = document.getElementById(inputId);
    input.value = '';
    if (inputId === 'categorySearch') {
        filterCategories();
    } else {
        filterWords();
    }
    input.focus();
}

function renderWords(words) {
    const tbody = document.getElementById('wordListBody');
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    
    tbody.innerHTML = words.map(w => {
        const isFav = favorites.includes(w.word);
        return `
            <tr>
                <td><span class="translation">${w.translation}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="word-text">${w.word}</span>
                        <button class="icon-btn-small" onclick="speakWord('${w.word}')" title="Pronounce">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                        </button>
                        <button class="icon-btn-small favorite-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${w.word}', this)" title="Add to Favorites">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="${isFav ? 'var(--accent)' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                    </div>
                </td>
                <td><span class="transcription">${w.transcription}</span></td>
            </tr>
        `;
    }).join('');
}

function speakWord(text) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
}

function toggleFavorite(word, btn) {
    let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    if (favorites.includes(word)) {
        favorites = favorites.filter(f => f !== word);
        btn.classList.remove('active');
        btn.querySelector('svg').setAttribute('fill', 'none');
    } else {
        favorites.push(word);
        btn.classList.add('active');
        btn.querySelector('svg').setAttribute('fill', 'var(--accent)');
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function filterWords() {
    const searchInput = document.getElementById('wordSearch');
    const searchTerm = searchInput.value.toLowerCase();
    const clearBtn = document.getElementById('clearWordSearch');
    
    // Toggle clear button visibility
    clearBtn.style.display = searchTerm ? 'block' : 'none';

    const filtered = displayedWords.filter(w => 
        w.word.toLowerCase().includes(searchTerm) || 
        w.translation.toLowerCase().includes(searchTerm)
    );
    renderWords(filtered);
}

function filterCategories() {
    const searchInput = document.getElementById('categorySearch');
    const searchTerm = searchInput.value.toLowerCase();
    const clearBtn = document.getElementById('clearCategorySearch');
    
    // Toggle clear button visibility
    clearBtn.style.display = searchTerm ? 'block' : 'none';

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
    if (displayedWords.length === 0) {
        alert('No words in this category to start quiz!');
        return;
    }

    // Shuffle words currently shown for the 1-min challenge
    quizWords = [...displayedWords].sort(() => 0.5 - Math.random());
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
    
    // Save Progress
    if (currentCategory !== 'Favorites') {
        const normKey = normalizeKey(currentCategory);
        saveProgress(normKey, quizCorrect, quizCorrect + quizIncorrectWords);
    }
    
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
