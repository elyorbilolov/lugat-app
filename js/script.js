let lugatData = null;
let normalizedLugatData = {}; // Store data with normalized keys
let unitData = [];
let currentDegree = null;
let currentCategory = null;
let displayedWords = []; // Current words being shown in detail view
let quizWords = [];
let quizCurrentIndex = 0;
let quizStartTime = null;
let quizTimerInterval = null;
let quizCorrect = 0;
let quizIncorrectWords = 0;
let quizTimeLeft = 60; // 1 minute challenge
let quizMode = 'quiz'; // 'quiz' or 'practice'
let robotActive = false;
let robotTimeout = null;

let irregularRoyxat = [];
let irregularPlay = [];
let irregularQuizIndex = 0;
let irregularQuizCorrect = 0;
let irregularQuizIncorrect = 0;
let irregularQuizWords = [];

let allLugatWords = [];
let gameWords = [];
let gameOrigin = 'grid';
let gameCurrentIndex = 0;
let gameMode = 'challenge';
let gameCorrect = 0;
let gameIncorrect = 0;
let gameTimerLeft = 60;
let gameInterval = null;
let gameLimit = 40;
let gameAnswered = false;

function toggleRobot() {
    robotActive = !robotActive;
    const btn = document.getElementById('robotBtn');
    if (btn) {
        btn.classList.toggle('active', robotActive);
        btn.querySelector('span').innerText = robotActive ? 'Robot ON' : 'Robot';
    }
    
    if (robotActive) {
        autoSolve();
    } else {
        if (robotTimeout) clearTimeout(robotTimeout);
    }
}

function autoSolve() {
    if (!robotActive || document.getElementById('quizView').style.display === 'none') {
        robotActive = false;
        const btn = document.getElementById('robotBtn');
        if (btn) {
            btn.classList.remove('active');
            btn.querySelector('span').innerText = 'Robot';
        }
        return;
    }

    const currentWordObj = quizWords[quizCurrentIndex];
    if (!currentWordObj) return;

    const targetWord = currentWordObj.word.trim();
    const allInputs = Array.from(document.querySelectorAll('.letter-box'));
    
    if (allInputs.length === 0) {
        // Wait for inputs to be rendered
        robotTimeout = setTimeout(autoSolve, 100);
        return;
    }

    // Step by step typing
    let charIdx = 0;
    function typeNextChar() {
        if (!robotActive) return;
        
        if (charIdx < allInputs.length) {
            const input = allInputs[charIdx];
            const globalIdx = parseInt(input.dataset.index);
            const char = targetWord[globalIdx];
            
            input.value = char;
            input.classList.add('active');
            
            // Trigger the input event like a real user
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
            
            charIdx++;
            robotTimeout = setTimeout(typeNextChar, 150); // Speed of typing
        }
    }
    
    typeNextChar();
}

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
Promise.all([
    fetch('lugat.json').then(response => response.json()),
    fetch('unit.json').then(response => response.json()).catch(() => []),
    fetch('lesson.json').then(response => response.json()).catch(() => [])
])
.then(([lugat, units, lessons]) => {
    lugatData = lugat;
    // Pre-normalize keys and words from lugat.json
    for (let key in lugat) {
        const normKey = normalizeKey(key);
        normalizedLugatData[normKey] = lugat[key].map(normalizeWord);
        lugat[key].forEach(w => allLugatWords.push(normalizeWord(w)));
    }
    
    // Combine units and lessons, mapping lesson degree names to avoid collision
    const mappedLessons = lessons.map(item => ({
        ...item,
        Degre: `${item.Degre} (Lessons)`
    }));
    unitData = [...units, ...mappedLessons];
    
    // Parse units and lessons
    unitData.forEach(item => {
        const groupKey = `${item.Degre} - ${item.Unit}`;
        const normGroupKey = normalizeKey(groupKey);
        
        if (!normalizedLugatData[normGroupKey]) {
            normalizedLugatData[normGroupKey] = [];
        }
        
        const wordObj = {
            word: item.Eng || '',
            translation: item.Uzb || '',
            transcription: item.Transcription ? `/${item.Transcription}/` : ''
        };
        
        // Avoid duplicate word entries in the same unit/lesson
        if (!normalizedLugatData[normGroupKey].some(w => w.word === wordObj.word && w.translation === wordObj.translation)) {
            normalizedLugatData[normGroupKey].push(wordObj);
            allLugatWords.push(wordObj);
        }
    });
    
    initCards();
})
.catch(error => console.error('Error loading initialization data:', error));

fetch('iregular.json')
    .then(response => response.json())
    .then(data => {
        irregularRoyxat = data.royxat || [];
        irregularPlay = data.royxat || [];
        const irrCard = document.getElementById('irregularCount');
        if (irrCard) irrCard.innerText = `${irregularRoyxat.length} words`;
    })
    .catch(error => console.error('Error loading iregular data:', error));

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

    // Remove existing degree cards if they exist
    grid.querySelectorAll('.degree-card').forEach(c => c.remove());

    // Dynamically add Degree cards (e.g. Pre-Intermediate)
    const uniqueDegrees = [...new Set(unitData.map(item => item.Degre))];
    uniqueDegrees.forEach(degree => {
        const degCard = document.createElement('div');
        degCard.className = 'card degree-card';
        
        const isLessons = degree.includes('Lessons');
        degCard.style.borderColor = isLessons ? '#00bcd4' : '#9c27b0'; // Teal for lessons, purple for units
        const degreeWordsCount = unitData.filter(item => item.Degre === degree).length;
        const typeLabel = isLessons ? 'Lessons' : 'Units';
        const hueValue = isLessons ? '180deg' : '90deg';
        
        degCard.innerHTML = `
            <div class="card-content">
                <h2 class="card-title">${degree}</h2>
                <p class="card-subtitle">${degreeWordsCount} words • ${typeLabel}</p>
                <div class="progress-bar" style="display: none"><div class="progress" style="width: 0%;"></div></div>
            </div>
            <div class="card-illustration"><img src="assets/task1.png" alt="${degree}" style="opacity: 0.15; filter: hue-rotate(${hueValue});"></div>
        `;
        
        degCard.addEventListener('click', () => {
            showDegreeUnits(degree);
        });
        
        grid.prepend(degCard);
    });

    cards.forEach(card => {
        const title = card.querySelector('.card-title').innerText.trim();
        const normKey = normalizeKey(title);
        
        // Remove existing check button if it exists to avoid duplicates
        const existingCheck = card.querySelector('.card-check-btn');
        if (existingCheck) existingCheck.remove();
        
        const completedCategories = JSON.parse(localStorage.getItem('completedCategories') || '[]');
        const isCompleted = completedCategories.includes(normKey);
        
        if (isCompleted) {
            card.classList.add('completed-card');
        } else {
            card.classList.remove('completed-card');
        }

        if (title === 'Full Dictionary') {
            card.querySelector('.card-subtitle').innerText = `${allLugatWords.length} words`;
        } else if (normalizedLugatData[normKey]) {
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

        // Add checkmark toggle button for categories (excluding Favorites)
        if (title !== '⭐ Favorites' && title !== 'Favorites') {
            const checkBtn = document.createElement('button');
            checkBtn.className = `card-check-btn ${isCompleted ? 'completed' : ''}`;
            checkBtn.title = isCompleted ? 'Mark as incomplete' : 'Mark as completed';
            checkBtn.innerHTML = isCompleted 
                ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="#00c853" stroke="#00c853" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
                : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;
            
            checkBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent navigation
                toggleCategoryCompleted(normKey, checkBtn, card);
            });
            card.appendChild(checkBtn);
        }

        card.addEventListener('click', () => {
            if (title === 'Irregular Verbs') {
                showIrregularVerbs();
            } else {
                showCategory(title);
            }
        });
    });
}

function toggleCategoryCompleted(normKey, btn, card) {
    let completedCategories = JSON.parse(localStorage.getItem('completedCategories') || '[]');
    if (completedCategories.includes(normKey)) {
        completedCategories = completedCategories.filter(k => k !== normKey);
        card.classList.remove('completed-card');
        btn.classList.remove('completed');
        btn.title = 'Mark as completed';
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;
    } else {
        completedCategories.push(normKey);
        card.classList.add('completed-card');
        btn.classList.add('completed');
        btn.title = 'Mark as incomplete';
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="#00c853" stroke="#00c853" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    }
    localStorage.setItem('completedCategories', JSON.stringify(completedCategories));
}

function showDegreeUnits(degree) {
    currentDegree = degree;
    const grid = document.getElementById('categoryGrid');
    
    // Hide all existing cards
    const cards = Array.from(grid.querySelectorAll('.card'));
    cards.forEach(card => {
        card.style.display = 'none';
    });
    
    // Remove any existing dynamic unit cards
    grid.querySelectorAll('.unit-card').forEach(c => c.remove());
    
    // Find units for this degree
    const degreeUnits = [...new Set(unitData.filter(item => item.Degre === degree).map(item => item.Unit))];
    
    // Create a Back card to return to categories
    const backCard = document.createElement('div');
    backCard.className = 'card unit-card back-to-categories-card';
    backCard.style.borderColor = 'var(--text-secondary)';
    backCard.innerHTML = `
        <div class="card-content">
            <h2 class="card-title">🔙 Back</h2>
            <p class="card-subtitle">Return to categories</p>
        </div>
    `;
    backCard.addEventListener('click', (e) => {
        e.stopPropagation();
        exitDegreeUnits();
    });
    grid.appendChild(backCard);
    
    const isLessons = degree.includes('Lessons');
    const borderCol = isLessons ? '#00bcd4' : '#9c27b0';
    const hueVal = isLessons ? '180deg' : '90deg';

    // Create a card for each unit
    degreeUnits.forEach(unit => {
        const unitTitle = `${degree} - ${unit}`; // e.g. "Pre-Intermediate - Unit 1"
        const normKey = normalizeKey(unitTitle);
        const words = normalizedLugatData[normKey] || [];
        const count = words.length;
        
        const displayTitle = isLessons ? unit.replace(/Unit/i, 'Lesson') : unit;

        const unitCard = document.createElement('div');
        unitCard.className = 'card unit-card';
        unitCard.style.borderColor = borderCol;
        unitCard.innerHTML = `
            <div class="card-content">
                <h2 class="card-title">${displayTitle}</h2>
                <p class="card-subtitle">${count} words</p>
                <div class="progress-bar" style="display: none"><div class="progress" style="width: 0%;"></div></div>
            </div>
            <div class="card-illustration"><img src="assets/task1.png" alt="${unit}" style="opacity: 0.15; filter: hue-rotate(${hueVal});"></div>
        `;
        
        // Add check button to unit card
        const completedCategories = JSON.parse(localStorage.getItem('completedCategories') || '[]');
        const isCompleted = completedCategories.includes(normKey);
        if (isCompleted) {
            unitCard.classList.add('completed-card');
        }
        
        const checkBtn = document.createElement('button');
        checkBtn.className = `card-check-btn ${isCompleted ? 'completed' : ''}`;
        checkBtn.title = isCompleted ? 'Mark as incomplete' : 'Mark as completed';
        checkBtn.innerHTML = isCompleted 
            ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="#00c853" stroke="#00c853" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
            : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;
        
        checkBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleCategoryCompleted(normKey, checkBtn, unitCard);
        });
        unitCard.appendChild(checkBtn);
        
        // Clicking the unit card opens it in detail view
        unitCard.addEventListener('click', () => {
            showCategory(unitTitle);
        });
        
        grid.appendChild(unitCard);
    });
}

function exitDegreeUnits() {
    currentDegree = null;
    const grid = document.getElementById('categoryGrid');
    
    // Remove all dynamic unit cards
    grid.querySelectorAll('.unit-card').forEach(c => c.remove());
    
    // Re-run initCards to restore all standard cards
    initCards();
    
    // If there was a search term in categorySearch, filter categories
    filterCategories();
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
    } else if (category === 'Full Dictionary') {
        displayedWords = allLugatWords;
    } else {
        const normKey = normalizeKey(category);
        displayedWords = normalizedLugatData[normKey] || [];
    }
    
    document.getElementById('categoryGrid').style.display = 'none';
    const mainHeader = document.getElementById('mainHeader');
    if (mainHeader) mainHeader.style.display = 'none';
    document.getElementById('detailView').style.display = 'block';
    document.getElementById('categoryTitle').innerText = category;
    document.getElementById('categoryCount').innerText = `${displayedWords.length} words available`;
    
    renderWords(displayedWords);
    window.scrollTo(0, 0);
}

function showGrid() {
    document.getElementById('detailView').style.display = 'none';
    document.getElementById('irregularDetailView').style.display = 'none';
    document.getElementById('categoryGrid').style.display = 'grid';
    const mainHeader = document.getElementById('mainHeader');
    if (mainHeader) mainHeader.style.display = 'block';
    document.getElementById('wordSearch').value = '';
    
    const irrSearch = document.getElementById('irrWordSearch');
    if (irrSearch) irrSearch.value = '';
    
    // Clear category search when returning
    const catSearch = document.getElementById('categorySearch');
    catSearch.value = '';
    filterCategories();
    
    // Refresh card stats and dynamic Favorites card
    initCards();
    if (currentDegree) {
        showDegreeUnits(currentDegree);
    }
    
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
    const learned = JSON.parse(localStorage.getItem('learnedWords') || '[]');
    
    tbody.innerHTML = words.map(w => {
        const isFav = favorites.includes(w.word);
        const isLearned = learned.includes(w.word);
        const escapedWord = w.word.replace(/'/g, "\\'");
        return `
            <tr class="${isLearned ? 'learned-row' : ''}">
                <td style="text-align: center;">
                    <input type="checkbox" class="learned-checkbox" ${isLearned ? 'checked' : ''} onclick="toggleLearned('${escapedWord}', this)">
                </td>
                <td><span class="translation">${w.translation}</span></td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span class="word-text">${w.word}</span>
                        <button class="icon-btn-small" onclick="speakWord('${escapedWord}')" title="Pronounce">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                        </button>
                        <button class="icon-btn-small favorite-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite('${escapedWord}', this)" title="Add to Favorites">
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

function toggleLearned(word, checkbox) {
    let learned = JSON.parse(localStorage.getItem('learnedWords') || '[]');
    const row = checkbox.closest('tr');
    
    if (learned.includes(word)) {
        learned = learned.filter(w => w !== word);
        if (row) row.classList.remove('learned-row');
    } else {
        learned.push(word);
        if (row) row.classList.add('learned-row');
    }
    localStorage.setItem('learnedWords', JSON.stringify(learned));
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
        const isUnitCard = card.classList.contains('unit-card');
        const isBackCard = card.classList.contains('back-to-categories-card');
        
        if (currentDegree) {
            // We are inside a degree units view
            if (!isUnitCard) {
                // Hide standard category cards
                card.style.display = 'none';
            } else if (isBackCard) {
                // Always show the Back card
                card.style.display = 'flex';
            } else {
                // Show/hide unit cards based on search term
                const title = card.querySelector('.card-title').innerText.toLowerCase();
                card.style.display = title.includes(searchTerm) ? 'flex' : 'none';
            }
        } else {
            // We are on the main category grid
            if (isUnitCard) {
                // Hide any leftover unit cards
                card.style.display = 'none';
            } else {
                // Show/hide standard cards based on search term
                const title = card.querySelector('.card-title').innerText.toLowerCase();
                card.style.display = title.includes(searchTerm) ? 'flex' : 'none';
            }
        }
    });
}

// Quiz Functions
function startPractice() {
    if (displayedWords.length === 0) {
        alert('No words in this category to start practice!');
        return;
    }

    quizMode = 'practice';
    // Shuffle words
    quizWords = [...displayedWords].sort(() => 0.5 - Math.random());
    quizCurrentIndex = 0;
    quizCorrect = 0;
    quizIncorrectWords = 0;
    
    document.getElementById('detailView').style.display = 'none';
    document.getElementById('quizView').style.display = 'block';
    document.getElementById('quizResult').style.display = 'none';
    document.querySelector('.quiz-body').style.display = 'block';
    
    // Hide timer for practice mode
    document.querySelector('.quiz-timer').style.display = 'none';
    
    document.getElementById('totalQuestionsNum').innerText = quizWords.length;
    
    renderQuizWord();
}

function startQuiz() {
    if (displayedWords.length === 0) {
        alert('No words in this category to start quiz!');
        return;
    }

    quizMode = 'quiz';
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
    
    // Show timer for quiz mode
    document.querySelector('.quiz-timer').style.display = 'flex';
    
    document.getElementById('totalQuestionsNum').innerText = quizWords.length;
    
    startTimer();
    renderQuizWord();
}

function exitQuiz() {
    stopTimer();
    robotActive = false;
    const btn = document.getElementById('robotBtn');
    if (btn) {
        btn.classList.remove('active');
        btn.querySelector('span').innerText = 'Robot';
    }
    if (robotTimeout) clearTimeout(robotTimeout);
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

    // Update total questions count in case it increased due to errors in practice mode
    document.getElementById('totalQuestionsNum').innerText = quizWords.length;

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

        // If practice mode, add the word to the end of the queue
        if (quizMode === 'practice') {
            quizWords.push(quizWords[quizCurrentIndex]);
        }
    }
    
    setTimeout(() => {
        quizCurrentIndex++;
        if (quizCurrentIndex < quizWords.length && (quizMode === 'practice' || quizTimeLeft > 0)) {
            renderQuizWord();
            if (robotActive) {
                robotTimeout = setTimeout(autoSolve, 500); // Delay before starting next word
            }
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
    const totalAttempted = quizCorrect + quizIncorrectWords;
    statsContainer.innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Challenge Type</span>
            <span class="stat-value" style="font-size: 1.2rem">${quizMode.toUpperCase()} MODE</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Correct Words</span>
            <span class="stat-value" style="color: #00c853">${quizCorrect}</span>
        </div>
        ${quizMode === 'quiz' ? `
        <div class="stat-item">
            <span class="stat-label">Incorrect Words</span>
            <span class="stat-value" style="color: #ff5252">${quizIncorrectWords}</span>
        </div>
        ` : `
        <div class="stat-item">
            <span class="stat-label">Mistakes Made</span>
            <span class="stat-value" style="color: #ff5252">${quizIncorrectWords}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Total Completed</span>
            <span class="stat-value">${quizWords.length} words</span>
        </div>
        `}
    `;
}

// Global Game Logic
function startGlobalChallenge() {
    if (allLugatWords.length === 0) return;
    
    gameOrigin = 'grid';
    gameMode = 'challenge';
    gameLimit = 40;
    gameCorrect = 0;
    gameIncorrect = 0;
    gameCurrentIndex = 0;
    gameTimerLeft = 60;
    gameAnswered = false;

    // shuffle all words and take 40
    gameWords = [...allLugatWords].sort(() => 0.5 - Math.random()).slice(0, gameLimit);

    document.getElementById('categoryGrid').style.display = 'none';
    document.querySelector('header').style.display = 'none';
    document.getElementById('gameView').style.display = 'block';
    document.getElementById('gameResult').style.display = 'none';
    document.getElementById('gameBody').style.display = 'block';
    
    document.getElementById('gameTimerText').style.display = 'block';

    startGameTimer();
    renderGameQuestion();
}

function startGlobalPractice() {
    if (allLugatWords.length === 0) return;

    gameOrigin = 'grid';
    gameMode = 'practice';
    gameLimit = allLugatWords.length;
    gameCorrect = 0;
    gameIncorrect = 0;
    gameCurrentIndex = 0;
    gameAnswered = false;

    // shuffle all words
    gameWords = [...allLugatWords].sort(() => 0.5 - Math.random());

    document.getElementById('categoryGrid').style.display = 'none';
    document.querySelector('header').style.display = 'none';
    document.getElementById('gameView').style.display = 'block';
    document.getElementById('gameResult').style.display = 'none';
    document.getElementById('gameBody').style.display = 'block';
    
    document.getElementById('gameTimerText').style.display = 'none';

    renderGameQuestion();
}

function startCategoryChallenge() {
    if (displayedWords.length === 0) {
        alert('No words in this category to start challenge!');
        return;
    }
    
    gameOrigin = 'detail';
    gameMode = 'challenge';
    gameLimit = Math.min(displayedWords.length, 40);
    gameCorrect = 0;
    gameIncorrect = 0;
    gameCurrentIndex = 0;
    gameTimerLeft = 60;
    gameAnswered = false;

    // shuffle category words and take gameLimit
    gameWords = [...displayedWords].sort(() => 0.5 - Math.random()).slice(0, gameLimit);

    document.getElementById('detailView').style.display = 'none';
    document.getElementById('gameView').style.display = 'block';
    document.getElementById('gameResult').style.display = 'none';
    document.getElementById('gameBody').style.display = 'block';
    
    document.getElementById('gameTimerText').style.display = 'block';

    startGameTimer();
    renderGameQuestion();
}

function startCategoryPractice() {
    if (displayedWords.length === 0) {
        alert('No words in this category to start practice!');
        return;
    }
    
    gameOrigin = 'detail';
    gameMode = 'practice';
    gameLimit = displayedWords.length;
    gameCorrect = 0;
    gameIncorrect = 0;
    gameCurrentIndex = 0;
    gameAnswered = false;

    // shuffle category words
    gameWords = [...displayedWords].sort(() => 0.5 - Math.random());

    document.getElementById('detailView').style.display = 'none';
    document.getElementById('gameView').style.display = 'block';
    document.getElementById('gameResult').style.display = 'none';
    document.getElementById('gameBody').style.display = 'block';
    
    document.getElementById('gameTimerText').style.display = 'none';

    renderGameQuestion();
}

function renderGameQuestion() {
    if(gameCurrentIndex >= gameLimit) {
        showGameResult();
        return;
    }
    gameAnswered = false;
    
    // Update progress bar
    let progressPercent = 0;
    if (gameMode === 'practice') {
        progressPercent = (gameCorrect / gameLimit) * 100;
        document.getElementById('gameHeaderTitle').innerText = 'Vocabulary - Practice';
    } else {
        progressPercent = (gameCurrentIndex / gameLimit) * 100;
        document.getElementById('gameHeaderTitle').innerText = (gameOrigin === 'detail') ? `${currentCategory} - 1 Min` : '1 Min Challenge';
    }
    document.getElementById('gameProgressBar').style.width = `${progressPercent}%`;

    document.getElementById('gameFooter').style.display = 'none';
    document.getElementById('gameMessage').innerHTML = '';

    let currentWord = gameWords[gameCurrentIndex];
    document.getElementById('gameEnglishWord').innerText = currentWord.word; // Main word is English
    
    // Show transcription
    const transDiv = document.getElementById('gameTranscription');
    if (currentWord.transcription) {
        transDiv.innerText = currentWord.transcription;
        transDiv.style.display = 'inline-block';
    } else {
        transDiv.style.display = 'none';
    }
    
    // Show speak button
    const speakBtn = document.getElementById('gameSpeakBtn');
    speakBtn.style.display = 'flex';
    speakBtn.onclick = () => speakWord(currentWord.word);

    // generate 4 options (Uzbek translations)
    let options = [currentWord];
    let pool = (gameOrigin === 'detail') ? displayedWords : allLugatWords;
    let otherWords = pool.filter(w => w.word !== currentWord.word);
    
    if (otherWords.length < 3) {
        otherWords = allLugatWords.filter(w => w.word !== currentWord.word);
    }
    
    otherWords.sort(() => 0.5 - Math.random());
    options.push(...otherWords.slice(0, 3));
    options.sort(() => 0.5 - Math.random());

    const optionsContainer = document.getElementById('gameOptions');
    optionsContainer.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt.translation;
        btn.onclick = () => handleGameAnswer(btn, opt.word === currentWord.word);
        optionsContainer.appendChild(btn);
    });
}

function handleGameAnswer(btn, isCorrect) {
    if(gameAnswered) return;
    gameAnswered = true;

    // disable all buttons
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(b => {
        b.disabled = true;
        if(b.innerText === gameWords[gameCurrentIndex].translation) {
            b.classList.add('correct'); // always show correct
        }
    });

    if(isCorrect) {
        btn.classList.add('correct');
        gameCorrect++;
        document.getElementById('gameFooter').className = 'game-footer correct';
        document.getElementById('gameMessage').innerHTML = `
            <div class="footer-icon-circle"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
            <div class="footer-text">Correct answer</div>
        `;
    } else {
        btn.classList.add('incorrect');
        gameIncorrect++;
        
        // If it's practice mode, push the word to the end to repeat it until answered correctly
        if (gameMode === 'practice') {
            gameWords.push(gameWords[gameCurrentIndex]);
            gameLimit++;
        }
        
        document.getElementById('gameFooter').className = 'game-footer incorrect';
        document.getElementById('gameMessage').innerHTML = `
            <div class="footer-icon-circle"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></div>
            <div class="footer-text">Correct: ${gameWords[gameCurrentIndex].translation}</div>
        `;
    }

    document.getElementById('gameFooter').style.display = 'block';
}

function nextGameQuestion() {
    gameCurrentIndex++;
    if (gameCurrentIndex < gameLimit) {
        renderGameQuestion();
    } else {
        showGameResult();
    }
}

function startGameTimer() {
    updateGameTimerDisplay();
    gameInterval = setInterval(() => {
        gameTimerLeft--;
        updateGameTimerDisplay();
        if(gameTimerLeft <= 0) {
            clearInterval(gameInterval);
            showGameResult();
        }
    }, 1000);
}

function updateGameTimerDisplay() {
    const minutes = Math.floor(gameTimerLeft / 60).toString().padStart(2, '0');
    const seconds = (gameTimerLeft % 60).toString().padStart(2, '0');
    document.getElementById('gameTimerText').innerText = `${minutes}:${seconds}`;
    
    // Visual warning when time is low
    if (gameTimerLeft <= 10) {
        document.getElementById('gameTimerText').parentElement.style.color = '#ff5252';
        document.getElementById('gameTimerText').parentElement.style.background = 'rgba(255, 82, 82, 0.1)';
    } else {
        document.getElementById('gameTimerText').parentElement.style.color = 'var(--accent)';
        document.getElementById('gameTimerText').parentElement.style.background = 'rgba(24, 119, 242, 0.1)';
    }
}

function showGameResult() {
    if(gameInterval) clearInterval(gameInterval);
    document.getElementById('gameBody').style.display = 'none';
    document.getElementById('gameFooter').style.display = 'none';
    document.getElementById('gameMessage').innerHTML = '';
    document.getElementById('gameResult').style.display = 'block';

    const unattempted = gameMode === 'challenge' 
        ? gameLimit - (gameCorrect + gameIncorrect)
        : gameLimit - gameCurrentIndex;
    
    document.getElementById('gameResultStats').innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Mode</span>
            <span class="stat-value" style="font-size: 1.2rem; color: var(--text-primary)">
                ${gameMode === 'challenge' ? '1 MIN CHALLENGE' : 'PRACTICE'}
            </span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Correct</span>
            <span class="stat-value" style="color: #00c853">${gameCorrect}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Incorrect</span>
            <span class="stat-value" style="color: #ff5252">${gameIncorrect}</span>
        </div>
        ${gameMode === 'challenge' ? `
        <div class="stat-item">
            <span class="stat-label">Unattempted</span>
            <span class="stat-value" style="color: var(--text-secondary)">${Math.max(0, unattempted)}</span>
        </div>
        ` : `
        <div class="stat-item">
            <span class="stat-label">Total Completed</span>
            <span class="stat-value" style="color: var(--text-secondary)">${gameCurrentIndex} / ${gameLimit}</span>
        </div>
        `}
    `;

    const backBtn = document.getElementById('gameResultBackBtn');
    if (backBtn) {
        backBtn.innerText = gameOrigin === 'detail' ? 'Back to Category' : 'Back to Home';
    }
}

function exitGame() {
    if(gameInterval) clearInterval(gameInterval);
    document.getElementById('gameView').style.display = 'none';
    if (gameOrigin === 'detail') {
        document.getElementById('detailView').style.display = 'block';
    } else {
        document.getElementById('categoryGrid').style.display = 'grid';
        document.querySelector('header').style.display = 'block';
        initCards();
        if (currentDegree) {
            showDegreeUnits(currentDegree);
        }
    }
}

// ========================
// Irregular Verbs Logic
// ========================
// Irregular Verbs Modern Enhancements State
let currentIrrPattern = 'ALL';
let filteredIrrList = [];
let currentFcIndex = 0;
let fcIsFlipped = false;
let speedTimerInterval = null;
let speedScore = 0;
let speedTimeLeft = 60;
let speedCurrentWord = null;

// Speech synthesis audio helper
function speakIrrWord(text, e) {
    if (e) e.stopPropagation();
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}

function speakIrrFull(idx) {
    const list = filteredIrrList.length > 0 ? filteredIrrList : irregularRoyxat;
    const w = list[idx];
    if (w) {
        speakIrrWord(`${w.Base_form}, ${w.Past_tense_V2}, ${w.Past_participle_V3}`);
    }
}

function speakIrrQuizPrompt() {
    if (irregularQuizWords && irregularQuizWords[irregularQuizIndex]) {
        const w = irregularQuizWords[irregularQuizIndex];
        speakIrrWord(w.Base_form);
    }
}

// Pattern categorizer
function getVerbPattern(w) {
    if (!w || !w.Base_form || !w.Past_tense_V2 || !w.Past_participle_V3) return 'ABC';
    const v1 = w.Base_form.trim().toLowerCase();
    const v2 = w.Past_tense_V2.trim().toLowerCase();
    const v3 = w.Past_participle_V3.trim().toLowerCase();

    if (v1 === v2 && v2 === v3) return 'AAA';
    if (v1 === v3 && v1 !== v2) return 'ABA';
    if (v2 === v3 && v1 !== v2) return 'ABB';
    return 'ABC';
}

// Mistakes / Error Tracker Storage
function getIrrErrors() {
    return JSON.parse(localStorage.getItem('irr_errors') || '[]');
}

function saveIrrError(w) {
    const errors = getIrrErrors();
    if (!errors.some(item => item.Base_form === w.Base_form)) {
        errors.push(w);
        localStorage.setItem('irr_errors', JSON.stringify(errors));
        updateIrrErrorBadge();
    }
}

function updateIrrErrorBadge() {
    const badge = document.getElementById('irrErrorCount');
    if (badge) badge.innerText = getIrrErrors().length;
}

function showIrregularVerbs() {
    document.getElementById('categoryGrid').style.display = 'none';
    const mainHeader = document.getElementById('mainHeader');
    if (mainHeader) mainHeader.style.display = 'none';
    document.getElementById('irregularDetailView').style.display = 'block';
    filteredIrrList = [...irregularRoyxat];
    document.getElementById('irrCategoryCount').innerText = `${irregularRoyxat.length} words available`;
    updateIrrErrorBadge();
    renderIrregularWords(filteredIrrList);
    switchIrrMode('table');
    window.scrollTo(0, 0);
}

function filterIrrByPattern(pattern, btnElement) {
    currentIrrPattern = pattern;
    
    document.querySelectorAll('#irrFilterTabs .irr-tab').forEach(t => t.classList.remove('active'));
    if (btnElement) btnElement.classList.add('active');

    if (pattern === 'ALL') {
        filteredIrrList = [...irregularRoyxat];
    } else if (pattern === 'ERRORS') {
        filteredIrrList = getIrrErrors();
    } else {
        filteredIrrList = irregularRoyxat.filter(w => getVerbPattern(w) === pattern);
    }

    document.getElementById('irrCategoryCount').innerText = `${filteredIrrList.length} words available (${pattern})`;
    renderIrregularWords(filteredIrrList);

    if (document.getElementById('irregularFlashcardView').style.display !== 'none') {
        currentFcIndex = 0;
        renderIrrFlashcard();
    }
}

function renderIrregularWords(words) {
    const tbody = document.getElementById('irrWordListBody');
    if (!words || words.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--text-secondary);">Birorta fe'l topilmadi</td></tr>`;
        return;
    }
    tbody.innerHTML = words.map(w => {
        const pat = getVerbPattern(w);
        return `
            <tr>
                <td style="text-align: center;"><input type="checkbox" class="irr-checkbox" value="${w.Uzb_translate}"></td>
                <td>
                    <span class="translation">${w.Uzb_translate}</span>
                    <span class="pattern-badge pattern-${pat}">${pat}</span>
                </td>
                <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <div style="display:flex;flex-direction:column;">
                            <span class="word-text">${w.Base_form}</span>
                            <span class="transcription">${w.Base_form_read}</span>
                        </div>
                        <button class="irr-audio-btn" onclick="speakIrrWord('${w.Base_form}', event)">🔊</button>
                    </div>
                </td>
                <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <div style="display:flex;flex-direction:column;">
                            <span class="word-text">${w.Past_tense_V2}</span>
                            <span class="transcription">${w.Past_tense_V2_read}</span>
                        </div>
                        <button class="irr-audio-btn" onclick="speakIrrWord('${w.Past_tense_V2}', event)">🔊</button>
                    </div>
                </td>
                <td>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <div style="display:flex;flex-direction:column;">
                            <span class="word-text">${w.Past_participle_V3}</span>
                            <span class="transcription">${w.Past_participle_V3_read}</span>
                        </div>
                        <button class="irr-audio-btn" onclick="speakIrrWord('${w.Past_participle_V3}', event)">🔊</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    const selectAll = document.getElementById('irrSelectAll');
    if (selectAll) selectAll.checked = false;
}

function toggleAllIrrCheckboxes(source) {
    const checkboxes = document.querySelectorAll('.irr-checkbox');
    checkboxes.forEach(cb => cb.checked = source.checked);
}

function filterIrrWords() {
    const searchInput = document.getElementById('irrWordSearch');
    const searchTerm = searchInput.value.toLowerCase();
    const clearBtn = document.getElementById('clearIrrSearch');
    clearBtn.style.display = searchTerm ? 'block' : 'none';

    const baseList = (currentIrrPattern === 'ALL') ? irregularRoyxat : filteredIrrList;
    const filtered = baseList.filter(w => 
        w.Uzb_translate.toLowerCase().includes(searchTerm) || 
        w.Base_form.toLowerCase().includes(searchTerm) ||
        w.Past_tense_V2.toLowerCase().includes(searchTerm) ||
        w.Past_participle_V3.toLowerCase().includes(searchTerm)
    );
    renderIrregularWords(filtered);
}

function clearIrrSearch() {
    const input = document.getElementById('irrWordSearch');
    input.value = '';
    filterIrrWords();
    input.focus();
}

// Switch Mode (Table vs Flashcards vs Speed)
function switchIrrMode(mode) {
    const tableView = document.getElementById('irrTableView');
    const fcView = document.getElementById('irregularFlashcardView');
    const speedView = document.getElementById('irregularSpeedView');

    document.getElementById('irrModeTableBtn').classList.remove('active');
    document.getElementById('irrModeFlashcardBtn').classList.remove('active');

    if (mode === 'table') {
        tableView.style.display = 'block';
        fcView.style.display = 'none';
        speedView.style.display = 'none';
        document.getElementById('irrModeTableBtn').classList.add('active');
    } else if (mode === 'flashcards') {
        tableView.style.display = 'none';
        fcView.style.display = 'block';
        speedView.style.display = 'none';
        document.getElementById('irrModeFlashcardBtn').classList.add('active');
        currentFcIndex = 0;
        renderIrrFlashcard();
    }
}

// 3D Flashcard Controls
function renderIrrFlashcard() {
    const list = (filteredIrrList && filteredIrrList.length > 0) ? filteredIrrList : irregularRoyxat;
    if (!list || list.length === 0) return;
    if (currentFcIndex >= list.length) currentFcIndex = 0;
    if (currentFcIndex < 0) currentFcIndex = list.length - 1;

    const w = list[currentFcIndex];
    const card = document.getElementById('irrFlashcardCard');
    card.classList.remove('flipped');
    fcIsFlipped = false;

    const pat = getVerbPattern(w);
    document.getElementById('fcUzbek').innerText = w.Uzb_translate;
    document.getElementById('fcPatternBadge').innerHTML = `<span class="pattern-badge pattern-${pat}">${pat} pattern</span>`;
    
    document.getElementById('fcV1').innerText = w.Base_form;
    document.getElementById('fcV1Read').innerText = `/${w.Base_form_read}/`;
    document.getElementById('fcV2').innerText = w.Past_tense_V2;
    document.getElementById('fcV2Read').innerText = `/${w.Past_tense_V2_read}/`;
    document.getElementById('fcV3').innerText = w.Past_participle_V3;
    document.getElementById('fcV3Read').innerText = `/${w.Past_participle_V3_read}/`;

    document.getElementById('fcProgress').innerText = `${currentFcIndex + 1} / ${list.length}`;
}

function flipIrrFlashcard() {
    const card = document.getElementById('irrFlashcardCard');
    card.classList.toggle('flipped');
    fcIsFlipped = !fcIsFlipped;
}

function nextIrrFlashcard() {
    currentFcIndex++;
    renderIrrFlashcard();
}

function prevIrrFlashcard() {
    currentFcIndex--;
    renderIrrFlashcard();
}

function shuffleIrrFlashcards() {
    const list = (filteredIrrList && filteredIrrList.length > 0) ? filteredIrrList : irregularRoyxat;
    currentFcIndex = Math.floor(Math.random() * list.length);
    renderIrrFlashcard();
}

// 1-Min Speed Challenge Logic
function startIrrSpeedChallenge() {
    document.getElementById('irrTableView').style.display = 'none';
    document.getElementById('irregularFlashcardView').style.display = 'none';
    document.getElementById('irregularSpeedView').style.display = 'block';

    speedScore = 0;
    speedTimeLeft = 60;
    document.getElementById('speedScore').innerText = '0';
    document.getElementById('speedTimer').innerText = '60';

    if (speedTimerInterval) clearInterval(speedTimerInterval);
    speedTimerInterval = setInterval(() => {
        speedTimeLeft--;
        document.getElementById('speedTimer').innerText = speedTimeLeft;
        if (speedTimeLeft <= 0) {
            clearInterval(speedTimerInterval);
            alert(`⏱️ Vaqt tugadi! Sizning natijangiz: ${speedScore} ball! 🎉`);
            switchIrrMode('table');
        }
    }, 1000);

    nextIrrSpeedQuestion();
}

function nextIrrSpeedQuestion() {
    const list = irregularRoyxat;
    if (!list || list.length === 0) return;

    speedCurrentWord = list[Math.floor(Math.random() * list.length)];
    const pat = getVerbPattern(speedCurrentWord);

    document.getElementById('speedUzbekWord').innerText = speedCurrentWord.Uzb_translate;
    document.getElementById('speedV1Hint').innerText = `V1: ${speedCurrentWord.Base_form}`;
    document.getElementById('speedPatternBadge').innerHTML = `<span class="pattern-badge pattern-${pat}">${pat}</span>`;

    let options = [speedCurrentWord];
    let pool = list.filter(w => w.Base_form !== speedCurrentWord.Base_form);
    pool.sort(() => 0.5 - Math.random());
    options.push(...pool.slice(0, 3));
    options.sort(() => 0.5 - Math.random());

    const grid = document.getElementById('speedOptionsGrid');
    grid.innerHTML = '';
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'speed-opt-btn';
        btn.innerText = `${opt.Past_tense_V2} – ${opt.Past_participle_V3}`;
        btn.onclick = () => handleIrrSpeedAnswer(btn, opt.Base_form === speedCurrentWord.Base_form);
        grid.appendChild(btn);
    });
}

function handleIrrSpeedAnswer(btn, isCorrect) {
    if (isCorrect) {
        btn.classList.add('correct');
        speedScore += 10;
        document.getElementById('speedScore').innerText = speedScore;
        speakIrrWord(speedCurrentWord.Base_form);
        setTimeout(() => nextIrrSpeedQuestion(), 400);
    } else {
        btn.classList.add('incorrect');
        saveIrrError(speedCurrentWord);
        setTimeout(() => nextIrrSpeedQuestion(), 600);
    }
}

function startIrregularQuiz() {
    if (irregularPlay.length === 0) {
        alert('Data is loading, please try again in a moment.');
        return;
    }

    // Use the currently active filtered list (by pattern or errors)
    const activeList = (filteredIrrList && filteredIrrList.length > 0) ? filteredIrrList : irregularPlay;

    const checkedBoxes = Array.from(document.querySelectorAll('.irr-checkbox:checked')).map(cb => cb.value);
    let wordsToPlay = activeList;

    if (checkedBoxes.length > 0) {
        wordsToPlay = activeList.filter(w => checkedBoxes.includes(w.Uzb_translate));
    }

    if (wordsToPlay.length === 0) {
        alert("Bu guruhda fe'l topilmadi!");
        return;
    }

    irregularQuizWords = [...wordsToPlay].sort(() => 0.5 - Math.random());
    irregularQuizIndex = 0;
    irregularQuizCorrect = 0;
    irregularQuizIncorrect = 0;

    // Show which group is being tested
    const patternLabel = currentIrrPattern === 'ALL' ? 'Barchasi' : currentIrrPattern;
    const groupLabelEl = document.getElementById('irrQuizGroupLabel');
    if (groupLabelEl) groupLabelEl.innerText = patternLabel;

    document.getElementById('irregularDetailView').style.display = 'none';
    document.getElementById('irregularQuizView').style.display = 'block';
    document.getElementById('irrQuizResult').style.display = 'none';
    document.getElementById('irrQuizBody').style.display = 'block';
    document.getElementById('irrTotalNum').innerText = irregularQuizWords.length;
    
    renderIrregularQuestion();
}


function renderIrrLetterBoxes(containerId, targetWord, prefix) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const wordGroup = document.createElement('div');
    wordGroup.className = 'word-group';
    
    for (let i = 0; i < targetWord.length; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.className = `letter-box irr-box ${prefix}-box`;
        input.dataset.prefix = prefix;
        
        input.addEventListener('input', (e) => handleIrrLetterInput(e, prefix));
        input.addEventListener('keydown', (e) => handleIrrKeydown(e, prefix));
        
        input.addEventListener('focus', () => {
            document.querySelectorAll('.irr-box').forEach(box => box.classList.remove('active'));
            input.classList.add('active');
        });
        
        wordGroup.appendChild(input);
    }
    container.appendChild(wordGroup);
}

function handleIrrLetterInput(e, prefix) {
    const input = e.target;
    const val = input.value;
    input.value = val.replace(/[^a-zA-Z-]/g, '').toLowerCase();
    
    if (input.value === '') return;

    const allInputs = Array.from(document.querySelectorAll(`.${prefix}-box`));
    const currIdx = allInputs.indexOf(input);
    
    if (currIdx < allInputs.length - 1) {
        allInputs[currIdx + 1].focus();
    } else {
        if (prefix === 'v1') {
            const nextInputs = document.querySelectorAll('.v2-box');
            if (nextInputs.length > 0) nextInputs[0].focus();
        } else if (prefix === 'v2') {
            const nextInputs = document.querySelectorAll('.v3-box');
            if (nextInputs.length > 0) nextInputs[0].focus();
        } else {
            // End of v3, trigger check automatically
            setTimeout(() => {
                document.querySelector('#irrCheckContainer button').click();
            }, 100);
        }
    }
}

function handleIrrKeydown(e, prefix) {
    if (e.key === 'Backspace' && !e.target.value) {
        const allInputs = Array.from(document.querySelectorAll(`.${prefix}-box`));
        const currIdx = allInputs.indexOf(e.target);
        if (currIdx > 0) {
            allInputs[currIdx - 1].focus();
        } else {
            if (prefix === 'v3') {
                const prevInputs = document.querySelectorAll('.v2-box');
                if (prevInputs.length > 0) prevInputs[prevInputs.length - 1].focus();
            } else if (prefix === 'v2') {
                const prevInputs = document.querySelectorAll('.v1-box');
                if (prevInputs.length > 0) prevInputs[prevInputs.length - 1].focus();
            }
        }
    }
}

function renderIrregularQuestion() {
    if (irregularQuizIndex >= irregularQuizWords.length) {
        showIrregularQuizResult();
        return;
    }

    const wordObj = irregularQuizWords[irregularQuizIndex];
    document.getElementById('irrCurrentNum').innerText = irregularQuizIndex + 1;
    document.getElementById('irrUzbekWord').innerText = wordObj.Uzb_translate;
    document.getElementById('irrQuizMessage').innerText = '';
    document.getElementById('irrNextContainer').style.display = 'none';
    document.getElementById('irrCheckContainer').style.display = 'block';
    
    const v1Target = wordObj.Base_form.trim().toLowerCase();
    const v2Target = wordObj.Past_tense_V2.trim().toLowerCase();
    const v3Target = wordObj.Past_participle_V3.trim().toLowerCase();

    renderIrrLetterBoxes('irrV1Container', v1Target, 'v1');
    renderIrrLetterBoxes('irrV2Container', v2Target, 'v2');
    renderIrrLetterBoxes('irrV3Container', v3Target, 'v3');

    setTimeout(() => {
        const firstBox = document.querySelector('.v1-box');
        if(firstBox) firstBox.focus();
    }, 50);
}

function checkIrregularAnswer() {
    const wordObj = irregularQuizWords[irregularQuizIndex];
    
    const v1Target = wordObj.Base_form.trim().toLowerCase();
    const v2Target = wordObj.Past_tense_V2.trim().toLowerCase();
    const v3Target = wordObj.Past_participle_V3.trim().toLowerCase();

    const getWord = (prefix) => Array.from(document.querySelectorAll(`.${prefix}-box`)).map(inp => inp.value).join('');
    
    const v1InputStr = getWord('v1').toLowerCase();
    const v2InputStr = getWord('v2').toLowerCase();
    const v3InputStr = getWord('v3').toLowerCase();

    const isCorrectV1 = v1Target.split('/').some(t => t.trim() === v1InputStr);
    const isCorrectV2 = v2Target.split('/').some(t => t.trim() === v2InputStr);
    const isCorrectV3 = v3Target.split('/').some(t => t.trim() === v3InputStr);

    const markBoxes = (prefix, targetStr) => {
        const boxes = document.querySelectorAll(`.${prefix}-box`);
        boxes.forEach((box, i) => {
            box.disabled = true;
            if (box.value.toLowerCase() === targetStr[i]?.toLowerCase()) {
                box.classList.add('correct');
            } else {
                box.classList.add('incorrect');
            }
        });
    };

    markBoxes('v1', v1Target);
    markBoxes('v2', v2Target);
    markBoxes('v3', v3Target);

    const isAllCorrect = isCorrectV1 && isCorrectV2 && isCorrectV3;

    if (isAllCorrect) {
        irregularQuizCorrect++;
        document.getElementById('irrQuizMessage').innerHTML = 'Correct! ✨';
        document.getElementById('irrQuizMessage').style.color = '#00c853';
    } else {
        irregularQuizIncorrect++;
        saveIrrError(wordObj);
        document.getElementById('irrQuizMessage').innerHTML = `
            <div style="color: #ff5252; font-weight: bold; margin-bottom: 5px;">Incorrect! ❌</div>
            <div style="color: #1877f2; font-size: 0.95rem;">
                Correct answers:<br>
                V1: <strong>${wordObj.Base_form}</strong><br>
                V2: <strong>${wordObj.Past_tense_V2}</strong><br>
                V3: <strong>${wordObj.Past_participle_V3}</strong>
            </div>
        `;
    }

    document.getElementById('irrCheckContainer').style.display = 'none';
    document.getElementById('irrNextContainer').style.display = 'block';
    document.getElementById('irrNextBtn').focus();
}

function nextIrregularQuestion() {
    irregularQuizIndex++;
    renderIrregularQuestion();
}

function showIrregularQuizResult() {
    document.getElementById('irrQuizBody').style.display = 'none';
    document.getElementById('irrQuizResult').style.display = 'block';
    
    document.getElementById('irrResultStats').innerHTML = `
        <div class="stat-item">
            <span class="stat-label">Correct Forms</span>
            <span class="stat-value" style="color: #00c853">${irregularQuizCorrect}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Incorrect Forms</span>
            <span class="stat-value" style="color: #ff5252">${irregularQuizIncorrect}</span>
        </div>
        <div class="stat-item">
            <span class="stat-label">Total Completed</span>
            <span class="stat-value">${irregularQuizWords.length} words</span>
        </div>
    `;
    
    // Update progress
    const totalCount = irregularQuizCorrect + irregularQuizIncorrect;
    if (totalCount > 0) {
        saveProgress('irregularverbs', irregularQuizCorrect, totalCount);
        const progressValue = getProgress('irregularverbs');
        const pb = document.getElementById('irregularProgress');
        if (pb) {
            pb.style.width = `${progressValue}%`;
            pb.parentElement.style.display = 'block';
        }
    }
}

function exitIrregularQuiz() {
    document.getElementById('irregularQuizView').style.display = 'none';
    document.getElementById('irregularDetailView').style.display = 'block';
}

/* ==========================================
   NEW MEMORIZATION ENHANCEMENTS LOGIC
   ========================================== */

// 1. STREAK MANAGER
function initStreak() {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = localStorage.getItem('lugat_last_active');
    let streak = parseInt(localStorage.getItem('lugat_streak_count') || '1', 10);

    if (lastActive) {
        const lastDate = new Date(lastActive);
        const currentDate = new Date(today);
        const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            streak += 1;
            localStorage.setItem('lugat_streak_count', streak);
            localStorage.setItem('lugat_last_active', today);
        } else if (diffDays > 1) {
            streak = 1;
            localStorage.setItem('lugat_streak_count', streak);
            localStorage.setItem('lugat_last_active', today);
        }
    } else {
        localStorage.setItem('lugat_last_active', today);
        localStorage.setItem('lugat_streak_count', '1');
    }

    const streakEl = document.getElementById('streakCount');
    if (streakEl) streakEl.innerText = streak;
}

// 2. SRS (SPACED REPETITION) MANAGER
function getSRSData() {
    return JSON.parse(localStorage.getItem('lugat_srs_data') || '{}');
}

function saveSRSWordResult(wordStr, isCorrect) {
    const srs = getSRSData();
    const now = Date.now();
    const boxIntervals = [0, 1, 3, 7, 14, 30]; // Days for box 1 to 5

    let item = srs[wordStr] || { box: 1, nextReview: now };
    if (isCorrect) {
        item.box = Math.min(item.box + 1, 5);
    } else {
        item.box = 1;
    }
    item.nextReview = now + boxIntervals[item.box] * 86400000;
    srs[wordStr] = item;
    localStorage.setItem('lugat_srs_data', JSON.stringify(srs));
    updateSRSCounter();
}

function updateSRSCounter() {
    const srs = getSRSData();
    const now = Date.now();
    let dueCount = 0;
    for (let key in srs) {
        if (srs[key].nextReview <= now) {
            dueCount++;
        }
    }
    const badgeEl = document.getElementById('srsDueCount');
    if (badgeEl) badgeEl.innerText = dueCount;
}

function startSRSReview() {
    const srs = getSRSData();
    const now = Date.now();
    const dueWordsKeys = Object.keys(srs).filter(k => srs[k].nextReview <= now);
    
    if (dueWordsKeys.length === 0) {
        alert("Bugun takrorlanishi kerak bo'lgan so'zlar yo'q! Barcha so'zlar o'zlashtirilgan. 🎉");
        return;
    }

    const dueWords = allLugatWords.filter(w => dueWordsKeys.includes(w.word));
    if (dueWords.length > 0) {
        gameWords = dueWords;
        gameMode = 'practice';
        startChallengeGame('SRS Review');
    } else {
        alert("Takrorlash so'zlari topilmadi.");
    }
}

// 3. ⭐ FAVORITES MANAGER
function getFavorites() {
    return JSON.parse(localStorage.getItem('lugat_favorites_list') || '[]');
}

function toggleFavoriteWord(wordObj, btnElement) {
    let favs = getFavorites();
    const existsIndex = favs.findIndex(f => f.word === wordObj.word);

    if (existsIndex > -1) {
        favs.splice(existsIndex, 1);
        if (btnElement) btnElement.classList.remove('active');
    } else {
        favs.push(wordObj);
        if (btnElement) btnElement.classList.add('active');
    }
    localStorage.setItem('lugat_favorites_list', JSON.stringify(favs));
    updateFavCounter();
}

function updateFavCounter() {
    const favs = getFavorites();
    const el = document.getElementById('favCount');
    if (el) el.innerText = favs.length;
}

function openFavoritesView() {
    const favs = getFavorites();
    const container = document.getElementById('favoritesListContainer');
    if (!container) return;

    if (favs.length === 0) {
        container.innerHTML = `<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Hali tanlangan so'zlar yo'q. So'zlar yonidagi ⭐ belgisini bosib saqlang.</p>`;
    } else {
        container.innerHTML = favs.map((item, idx) => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border-color);">
                <div>
                    <strong style="font-size: 1.1rem; color: var(--text-primary);">${item.word}</strong>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">${item.translation}</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="irr-audio-btn" onclick="speakText('${item.word.replace(/'/g, "\\'")}')">🔊</button>
                    <button class="fav-star-btn active" onclick="removeFavAndRefresh(${idx})">⭐</button>
                </div>
            </div>
        `).join('');
    }

    document.getElementById('favoritesModal').style.display = 'flex';
}

function removeFavAndRefresh(index) {
    let favs = getFavorites();
    favs.splice(index, 1);
    localStorage.setItem('lugat_favorites_list', JSON.stringify(favs));
    updateFavCounter();
    openFavoritesView();
}

function closeFavoritesView() {
    document.getElementById('favoritesModal').style.display = 'none';
}

// 4. 🧩 MATCHING GAME (JUFTINI TOP)
let matchSelectedTile = null;
let matchTimerInterval = null;
let matchSeconds = 0;
let matchScore = 0;
let matchMoves = 0;
let matchPairsLeft = 0;

function getCurrentCategoryLabel() {
    const irrView = document.getElementById('irregularDetailView');
    if (irrView && irrView.style.display !== 'none') {
        const p = currentIrrPattern === 'ALL' ? 'Barchasi' : currentIrrPattern;
        return `Irregular Verbs (${p})`;
    }
    const catView = document.getElementById('detailView');
    if (catView && catView.style.display !== 'none') {
        const title = document.getElementById('categoryTitle')?.innerText;
        if (title) return title;
    }
    return "Barcha lug'at";
}

function getCategoryPoolWords() {
    let pool = [];
    const irrView = document.getElementById('irregularDetailView');
    const catView = document.getElementById('detailView');

    if (irrView && irrView.style.display !== 'none' && filteredIrrList && filteredIrrList.length > 0) {
        pool = filteredIrrList.map(i => ({ word: i.V1, translation: i.Uzb_translate }));
    } else if (catView && catView.style.display !== 'none' && displayedWords && displayedWords.length > 0) {
        pool = displayedWords;
    } else {
        pool = allLugatWords.length > 0 ? allLugatWords : irregularRoyxat.map(i => ({ word: i.V1, translation: i.Uzb_translate }));
    }

    return pool;
}

function getRandomPoolWords(count = 6) {
    let pool = getCategoryPoolWords();
    if (pool.length === 0) return [];
    let shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, pool.length));
}

function startMatchingGame() {
    const words = getRandomPoolWords(6);
    if (words.length === 0) {
        alert("So'zlar yuklanmoqda, iltimos biroz kuting.");
        return;
    }

    matchScore = 0;
    matchMoves = 0;
    matchSeconds = 0;
    matchPairsLeft = words.length;
    matchSelectedTile = null;

    const topicLabelEl = document.getElementById('matchTopicLabel');
    if (topicLabelEl) topicLabelEl.innerText = `Mavzu: ${getCurrentCategoryLabel()}`;

    document.getElementById('matchScore').innerText = matchScore;
    document.getElementById('matchMoves').innerText = matchMoves;
    document.getElementById('matchTimer').innerText = '0s';
    document.getElementById('matchingResult').style.display = 'none';

    let tilesData = [];
    words.forEach((w, id) => {
        tilesData.push({ id, text: w.word, type: 'ENG' });
        tilesData.push({ id, text: w.translation, type: 'UZB' });
    });

    tilesData.sort(() => 0.5 - Math.random());

    const grid = document.getElementById('matchingGrid');
    grid.style.display = 'grid';
    grid.innerHTML = tilesData.map((tile, i) => `
        <div class="matching-tile" data-pair-id="${tile.id}" data-index="${i}" onclick="onMatchingTileClick(this)">
            ${tile.text}
        </div>
    `).join('');

    if (matchTimerInterval) clearInterval(matchTimerInterval);
    matchTimerInterval = setInterval(() => {
        matchSeconds++;
        document.getElementById('matchTimer').innerText = `${matchSeconds}s`;
    }, 1000);

    document.getElementById('matchingGameModal').style.display = 'flex';
}

function onMatchingTileClick(tileEl) {
    if (tileEl.classList.contains('matched') || tileEl.classList.contains('selected')) return;

    tileEl.classList.add('selected');

    if (!matchSelectedTile) {
        matchSelectedTile = tileEl;
    } else {
        matchMoves++;
        document.getElementById('matchMoves').innerText = matchMoves;

        const pair1 = matchSelectedTile.getAttribute('data-pair-id');
        const pair2 = tileEl.getAttribute('data-pair-id');

        if (pair1 === pair2) {
            matchSelectedTile.classList.remove('selected');
            tileEl.classList.remove('selected');

            matchSelectedTile.classList.add('matched');
            tileEl.classList.add('matched');

            matchScore += 10;
            document.getElementById('matchScore').innerText = matchScore;

            matchPairsLeft--;
            matchSelectedTile = null;

            if (matchPairsLeft === 0) {
                clearInterval(matchTimerInterval);
                setTimeout(() => {
                    document.getElementById('matchingGrid').style.display = 'none';
                    document.getElementById('matchSummaryText').innerText = `Siz ${matchSeconds} soniyada ${matchMoves} ta urinishda barcha juftliklarni topdingiz! Ball: ${matchScore}`;
                    document.getElementById('matchingResult').style.display = 'block';
                }, 400);
            }
        } else {
            const tile1 = matchSelectedTile;
            const tile2 = tileEl;
            tile1.classList.add('mismatch');
            tile2.classList.add('mismatch');

            matchSelectedTile = null;
            setTimeout(() => {
                tile1.classList.remove('selected', 'mismatch');
                tile2.classList.remove('selected', 'mismatch');
            }, 500);
        }
    }
}

function closeMatchingGame() {
    if (matchTimerInterval) clearInterval(matchTimerInterval);
    document.getElementById('matchingGameModal').style.display = 'none';
}

// 5. 🎧 LISTENING & DICTATION PRACTICE
let listeningQueue = [];
let listeningQueueIndex = 0;
let listeningCurrentCategory = null;
let listeningCurrentWord = null;
let listeningAnswered = false;

function startListeningPractice(forceRestart = false) {
    listeningAnswered = false;
    const activeLabel = getCurrentCategoryLabel();

    if (forceRestart || listeningCurrentCategory !== activeLabel || listeningQueue.length === 0 || listeningQueueIndex >= listeningQueue.length) {
        const pool = getCategoryPoolWords();
        if (pool.length === 0) {
            alert("So'zlar topilmadi.");
            return;
        }
        listeningQueue = [...pool].sort(() => 0.5 - Math.random());
        listeningQueueIndex = 0;
        listeningCurrentCategory = activeLabel;
    }

    listeningCurrentWord = listeningQueue[listeningQueueIndex];

    const topicLabelEl = document.getElementById('listeningTopicLabel');
    if (topicLabelEl) {
        topicLabelEl.innerText = `${listeningQueueIndex + 1} / ${listeningQueue.length} · Mavzu: ${activeLabel}`;
    }

    const input = document.getElementById('listeningInput');
    input.value = '';
    input.disabled = false;
    document.getElementById('listeningHintText').innerText = '';
    document.getElementById('listeningFeedback').innerText = '';
    
    const nextBtnContainer = document.getElementById('listeningNextContainer');
    if (nextBtnContainer) nextBtnContainer.style.display = 'none';
    const checkBtn = document.getElementById('listeningCheckBtn');
    if (checkBtn) checkBtn.style.display = 'inline-block';

    document.getElementById('listeningModal').style.display = 'flex';

    setTimeout(() => {
        input.focus();
        playListeningAudio();
    }, 300);
}

function handleListeningNext() {
    listeningQueueIndex++;
    if (listeningQueueIndex >= listeningQueue.length) {
        const feedback = document.getElementById('listeningFeedback');
        const checkBtn = document.getElementById('listeningCheckBtn');
        const nextBtnContainer = document.getElementById('listeningNextContainer');

        if (checkBtn) checkBtn.style.display = 'none';
        if (nextBtnContainer) nextBtnContainer.style.display = 'none';

        feedback.innerHTML = `
            <div style="font-size: 1.2rem; font-weight: 800; color: #00c853; text-align: center; margin-top: 10px;">
                🎉 Mavzudagi barcha ${listeningQueue.length} ta so'z bajarildi!
            </div>
            <div style="text-align: center; margin-top: 15px;">
                <button class="game-btn-primary" onclick="startListeningPractice(true)" style="padding: 10px 25px; background: #1877f2;">🔁 Qayta boshlash</button>
            </div>
        `;
        feedback.className = "quiz-message correct";
        return;
    }
    startListeningPractice(false);
}

function handleListeningEnter() {
    if (!listeningAnswered) {
        checkListeningAnswer();
    } else {
        handleListeningNext();
    }
}

function playListeningAudio() {
    if (listeningCurrentWord) {
        speakText(listeningCurrentWord.word);
    }
}

function showListeningHint() {
    if (!listeningCurrentWord) return;
    const w = listeningCurrentWord.word;
    const hint = w[0] + ' ' + '_ '.repeat(w.length - 1);
    document.getElementById('listeningHintText').innerText = `Ishora: ${hint} (${w.length} harf)`;
}

function checkListeningAnswer() {
    if (!listeningCurrentWord || listeningAnswered) return;
    listeningAnswered = true;

    const input = document.getElementById('listeningInput');
    const val = input.value.trim().toLowerCase();
    const target = listeningCurrentWord.word.trim().toLowerCase();
    const feedback = document.getElementById('listeningFeedback');
    const nextBtnContainer = document.getElementById('listeningNextContainer');
    const checkBtn = document.getElementById('listeningCheckBtn');

    if (checkBtn) checkBtn.style.display = 'none';
    if (nextBtnContainer) nextBtnContainer.style.display = 'block';

    const wordText = listeningCurrentWord.word;
    const uzbText = listeningCurrentWord.translation || listeningCurrentWord.Uzb_translate || '';

    if (val === target) {
        feedback.innerHTML = `
            <div style="font-size: 1.1rem; font-weight: 800; color: #00c853;">To'g'ri! Barakalla! 🎉</div>
            <div style="margin-top: 6px; font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">
                ${wordText} <span style="color: var(--text-secondary); font-weight: 500;">— ${uzbText}</span>
            </div>
        `;
        feedback.className = "quiz-message correct";
        saveSRSWordResult(listeningCurrentWord.word, true);
    } else {
        feedback.innerHTML = `
            <div style="font-size: 1.1rem; font-weight: 800; color: #ff5252;">Noto'g'ri ❌</div>
            <div style="margin-top: 6px; font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">
                To'g'ri javob: <span style="color: #ff5252;">${wordText}</span> <span style="color: var(--text-secondary); font-weight: 500;">— ${uzbText}</span>
            </div>
        `;
        feedback.className = "quiz-message incorrect";
        saveSRSWordResult(listeningCurrentWord.word, false);
    }
}

function closeListeningPractice() {
    document.getElementById('listeningModal').style.display = 'none';
}

// 6. 🎤 TALAFFUZ MASHQI (SPEECH PRACTICE)
let speechCurrentWord = null;
let speechRecognitionObj = null;

function startSpeechPractice() {
    const words = getRandomPoolWords(1);
    if (words.length === 0) return;

    speechCurrentWord = words[0];
    const topicLabelEl = document.getElementById('speechTopicLabel');
    if (topicLabelEl) topicLabelEl.innerText = `Mavzu: ${getCurrentCategoryLabel()}`;

    document.getElementById('speechTargetWord').innerText = speechCurrentWord.word;
    document.getElementById('speechUzbekHint').innerText = speechCurrentWord.translation;
    document.getElementById('speechTranscriptBox').style.display = 'none';
    document.getElementById('speechStatus').innerText = "Tugmani bosib, so'zni ayting";

    document.getElementById('speechModal').style.display = 'flex';
}

function speakTargetWord() {
    if (speechCurrentWord) speakText(speechCurrentWord.word);
}

function toggleSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Kechirasiz, brauzeringiz nutqni aniqlash (Speech Recognition) API ini qo'llamaydi. Chrome brauzeridan foydalaning.");
        return;
    }

    const btn = document.getElementById('speechMicBtn');
    const status = document.getElementById('speechStatus');

    if (speechRecognitionObj) {
        speechRecognitionObj.stop();
        return;
    }

    speechRecognitionObj = new SpeechRecognition();
    speechRecognitionObj.lang = 'en-US';
    speechRecognitionObj.interimResults = false;

    speechRecognitionObj.onstart = () => {
        btn.classList.add('recording');
        btn.innerText = "🔴 Eshitilmoqda...";
        status.innerText = "Gapiring...";
    };

    speechRecognitionObj.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        evaluateSpeech(transcript);
    };

    speechRecognitionObj.onerror = () => {
        status.innerText = "Ovoz eshitilmadi. Qayta urinib ko'ring.";
        btn.classList.remove('recording');
        btn.innerText = "🎙️ Bosib gapiring";
        speechRecognitionObj = null;
    };

    speechRecognitionObj.onend = () => {
        btn.classList.remove('recording');
        btn.innerText = "🎙️ Bosib gapiring";
        speechRecognitionObj = null;
    };

    speechRecognitionObj.start();
}

function evaluateSpeech(userSpoken) {
    if (!speechCurrentWord) return;
    const target = speechCurrentWord.word.toLowerCase();
    const spoken = userSpoken.toLowerCase();

    document.getElementById('speechUserText').innerText = `"${userSpoken}"`;
    const ratingEl = document.getElementById('speechRating');
    const box = document.getElementById('speechTranscriptBox');
    box.style.display = 'block';

    if (spoken === target || spoken.includes(target) || target.includes(spoken)) {
        ratingEl.innerText = "A'lo talaffuz! 🌟 (100%)";
        ratingEl.style.color = "#00c853";
        saveSRSWordResult(speechCurrentWord.word, true);
    } else {
        ratingEl.innerText = "Qayta urinib ko'ring 🔁";
        ratingEl.style.color = "#ff5252";
        saveSRSWordResult(speechCurrentWord.word, false);
    }
}

function nextSpeechWord() {
    startSpeechPractice();
}

function closeSpeechPractice() {
    if (speechRecognitionObj) {
        speechRecognitionObj.stop();
        speechRecognitionObj = null;
    }
    document.getElementById('speechModal').style.display = 'none';
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initStreak();
    updateSRSCounter();
    updateFavCounter();
});
