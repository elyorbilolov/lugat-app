const fs = require('fs');

const path = 'js/script.js';
let content = fs.readFileSync(path, 'utf8');

const replacement = `
function renderIrrLetterBoxes(containerId, targetWord, prefix) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const wordGroup = document.createElement('div');
    wordGroup.className = 'word-group';
    
    for (let i = 0; i < targetWord.length; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.className = \`letter-box irr-box \${prefix}-box\`;
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

    const allInputs = Array.from(document.querySelectorAll(\`.\${prefix}-box\`));
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
        const allInputs = Array.from(document.querySelectorAll(\`.\${prefix}-box\`));
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

    const getWord = (prefix) => Array.from(document.querySelectorAll(\`.\${prefix}-box\`)).map(inp => inp.value).join('');
    
    const v1InputStr = getWord('v1').toLowerCase();
    const v2InputStr = getWord('v2').toLowerCase();
    const v3InputStr = getWord('v3').toLowerCase();

    const isCorrectV1 = v1Target.split('/').some(t => t.trim() === v1InputStr);
    const isCorrectV2 = v2Target.split('/').some(t => t.trim() === v2InputStr);
    const isCorrectV3 = v3Target.split('/').some(t => t.trim() === v3InputStr);

    const markBoxes = (prefix, targetStr) => {
        const boxes = document.querySelectorAll(\`.\${prefix}-box\`);
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
        document.getElementById('irrQuizMessage').innerHTML = \`
            <div style="color: #ff5252; font-weight: bold; margin-bottom: 5px;">Incorrect! ❌</div>
            <div style="color: #1877f2; font-size: 0.95rem;">
                Correct answers:<br>
                V1: <strong>\${wordObj.Base_form}</strong><br>
                V2: <strong>\${wordObj.Past_tense_V2}</strong><br>
                V3: <strong>\${wordObj.Past_participle_V3}</strong>
            </div>
        \`;
    }

    document.getElementById('irrCheckContainer').style.display = 'none';
    document.getElementById('irrNextContainer').style.display = 'block';
    document.getElementById('irrNextBtn').focus();
}
`;

const startIndex = content.indexOf('function renderIrregularQuestion() {');
const endIndex = content.indexOf('function nextIrregularQuestion() {');

if(startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex) + replacement + "\n" + content.substring(endIndex);
    fs.writeFileSync(path, newContent);
    console.log("Updated script.js successfully");
} else {
    console.log("Could not find start or end index");
}
