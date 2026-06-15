const fs = require('fs');
const path = './js/script.js';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

const exitGameIdx = lines.findIndex(l => l.startsWith('function exitGame()'));
const wordObjIdx = lines.findIndex(l => l.includes('const wordObj = irregularQuizWords[irregularQuizIndex];'));

if (exitGameIdx !== -1 && wordObjIdx !== -1) {
    const missingCode = `function exitGame() {
    if(gameInterval) clearInterval(gameInterval);
    document.getElementById('gameView').style.display = 'none';
    document.getElementById('categoryGrid').style.display = 'grid';
    document.querySelector('header').style.display = 'block';
}

// ========================
// Irregular Verbs Logic
// ========================
function showIrregularVerbs() {
    document.getElementById('categoryGrid').style.display = 'none';
    document.getElementById('irregularDetailView').style.display = 'block';
    document.getElementById('irrCategoryCount').innerText = \`\${irregularRoyxat.length} words available\`;
    renderIrregularWords(irregularRoyxat);
    window.scrollTo(0, 0);
}

function renderIrregularWords(words) {
    const tbody = document.getElementById('irrWordListBody');
    tbody.innerHTML = words.map(w => {
        return \`
            <tr>
                <td style="text-align: center;"><input type="checkbox" class="irr-checkbox" value="\${w.Uzb_translate}"></td>
                <td><span class="translation">\${w.Uzb_translate}</span></td>
                <td>
                    <div style="display:flex;flex-direction:column;">
                        <span class="word-text">\${w.Base_form}</span>
                        <span class="transcription">\${w.Base_form_read}</span>
                    </div>
                </td>
                <td>
                    <div style="display:flex;flex-direction:column;">
                        <span class="word-text">\${w.Past_tense_V2}</span>
                        <span class="transcription">\${w.Past_tense_V2_read}</span>
                    </div>
                </td>
                <td>
                    <div style="display:flex;flex-direction:column;">
                        <span class="word-text">\${w.Past_participle_V3}</span>
                        <span class="transcription">\${w.Past_participle_V3_read}</span>
                    </div>
                </td>
            </tr>
        \`;
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

    const filtered = irregularRoyxat.filter(w => 
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

function startIrregularQuiz() {
    if (irregularPlay.length === 0) {
        alert('Data is loading, please try again in a moment.');
        return;
    }
    
    const checkedBoxes = Array.from(document.querySelectorAll('.irr-checkbox:checked')).map(cb => cb.value);
    let wordsToPlay = irregularPlay;
    
    if (checkedBoxes.length > 0) {
        wordsToPlay = irregularPlay.filter(w => checkedBoxes.includes(w.Uzb_translate));
    }
    
    irregularQuizWords = [...wordsToPlay].sort(() => 0.5 - Math.random());
    irregularQuizIndex = 0;
    irregularQuizCorrect = 0;
    irregularQuizIncorrect = 0;

    document.getElementById('irregularDetailView').style.display = 'none';
    document.getElementById('irregularQuizView').style.display = 'block';
    document.getElementById('irrQuizResult').style.display = 'none';
    document.getElementById('irrQuizBody').style.display = 'block';
    document.getElementById('irrTotalNum').innerText = irregularQuizWords.length;
    
    renderIrregularQuestion();
}

function renderIrregularQuestion() {
    if (irregularQuizIndex >= irregularQuizWords.length) {
        showIrregularQuizResult();
        return;
    }

    const wordObj = irregularQuizWords[irregularQuizIndex];`;

    const newLines = [...lines.slice(0, exitGameIdx), missingCode, ...lines.slice(wordObjIdx + 1)];
    fs.writeFileSync(path, newLines.join('\\r\\n'));
    console.log('Fixed successfully');
} else {
    console.log('Could not find indices', exitGameIdx, wordObjIdx);
}
