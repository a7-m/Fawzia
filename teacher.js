
import { auth, db } from "./firebase.js";
import { 
    collection, 
    addDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// --- State ---
let testMetadata = {};
let questions = []; 
let currentQIndex = 0;

// --- DOM Elements ---
const views = {
    setup: document.getElementById('setupView'),
    editor: document.getElementById('editorView')
};

const setupForm = document.getElementById('setupForm');
const backToSetupBtn = document.getElementById('backToSetupBtn');

// Editor Elements
const prevQBtn = document.getElementById('prevQBtn');
const nextQBtn = document.getElementById('nextQBtn');
const deleteQBtn = document.getElementById('deleteQBtn');
const savePublishBtn = document.getElementById('savePublishBtn'); // Save & Finish
const editorSubtitle = document.getElementById('editorSubtitle');

const qTextInput = document.getElementById('qTextInput');
const qTypeSelect = document.getElementById('qTypeSelect');
const qLevelInput = document.getElementById('qLevelInput');
const qDynamicContent = document.getElementById('qDynamicContent');

// Templates
const tplOptionsList = document.getElementById('tpl-options-list');
const tplOptionItem = document.getElementById('tpl-option-item');
const tplEssay = document.getElementById('tpl-essay');
const tplOrdering = document.getElementById('tpl-ordering');
const tplMatching = document.getElementById('tpl-matching');
const tplClickDrag = document.getElementById('tpl-click-drag');

// --- Auth ---
onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = 'login.html';
});

// --- Flow Control ---

setupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // 1. Capture Metadata
    testMetadata = {
        title: document.getElementById('testTitle').value,
        passage: document.getElementById('readingPassage').value,
        image: document.getElementById('passageImage').value,
        duration: document.getElementById('testDuration').value,
        subject: document.getElementById('subject').value,
        isPublic: document.querySelector('input[name="publishStatus"]:checked').value === 'public'
    };

    // 2. Switch View
    views.setup.classList.add('hidden');
    views.setup.classList.remove('active');
    
    views.editor.classList.remove('hidden');
    views.editor.classList.add('active');

    // 3. Initialize first question if empty
    if (questions.length === 0) {
        questions.push(createEmptyQuestion());
        currentQIndex = 0;
    }

    renderQuestion();
});

backToSetupBtn.addEventListener('click', () => {
    // Save current state first
    saveCurrentQuestionState();

    views.editor.classList.add('hidden');
    views.editor.classList.remove('active');

    views.setup.classList.remove('hidden');
    views.setup.classList.add('active');
});

// --- Question Logic ---

function createEmptyQuestion() {
    return {
        q: '',
        type: 'multiple_choice',
        level: '',
        options: ['', ''],
        correct: 0,
        // other defaults
    };
}

function renderQuestion() {
    const q = questions[currentQIndex];
    if (!q) return;

    // Header
    editorSubtitle.textContent = `السؤال ${currentQIndex + 1} من ${questions.length}`;

    // Common Inputs
    qTextInput.value = q.q || '';
    qTypeSelect.value = q.type || 'multiple_choice';
    qLevelInput.value = q.level || '';

    // specific rendering
    renderTypeContent(q);

    // Update Buttons
    prevQBtn.disabled = (currentQIndex === 0);
    // Next button text logic if needed, but we essentially have "Next/New" button always
}

function renderTypeContent(q) {
    qDynamicContent.innerHTML = '';
    const type = qTypeSelect.value;
    q.type = type; // ensure sync

    // Same injection logic as before but adapted for single view
    if (['multiple_choice', 'multiple_select', 'dropdown'].includes(type)) {
        const content = tplOptionsList.content.cloneNode(true);
        const wrapper = content.querySelector('.options-wrapper');
        const addBtn = content.querySelector('.add-option-btn');

        // Logic to prepopulate options
        const opts = q.options || ['', ''];
        opts.forEach((optText, idx) => {
            addOptionDOM(wrapper, type, idx, optText, q);
        });

        addBtn.addEventListener('click', () => {
            addOptionDOM(wrapper, type, wrapper.children.length, '', q);
        });

        qDynamicContent.appendChild(content);

    } else if (type === 'essay') {
        const content = tplEssay.content.cloneNode(true);
        const textarea = content.querySelector('.q-model-answer');
        textarea.value = q.modelAnswer || '';
        qDynamicContent.appendChild(content);

    } else if (type === 'ordering') {
        const content = tplOrdering.content.cloneNode(true);
        const wrapper = content.querySelector('.items-wrapper');
        const addBtn = content.querySelector('.add-order-item-btn');
        
        let items = q.items || ['', '', '']; 
        // Note: For ordering creation, we treat `items` as the CORRECT order.
        const headerRow = wrapper.firstElementChild; // Header row
        headerRow.nextElementSibling.remove(); // Remove default example row if template has it? 
        // Wait, template has one default item row. Let's clear and rebuild.
        wrapper.innerHTML = ''; // Clear default
        
        items.forEach((txt, idx) => addOrderingItemDOM(wrapper, idx, txt));

        addBtn.addEventListener('click', () => {
            addOrderingItemDOM(wrapper, wrapper.children.length, '');
        });
        qDynamicContent.appendChild(content);

    } else if (type === 'matching') {
        const content = tplMatching.content.cloneNode(true);
        const wrapper = content.querySelector('.pairs-wrapper');
        const addBtn = content.querySelector('.add-pair-btn');
        
        wrapper.innerHTML = ''; // CLear defaults
        const header = document.createElement('div');
        header.className = 'grid grid-cols-2 gap-2';
        header.innerHTML = '<p class="text-xs text-slate-500">العمود الأيمن</p><p class="text-xs text-slate-500">العمود الأيسر (المطابق له)</p>';
        wrapper.appendChild(header);

        // Load existing
        // structure: leftColumn: [], rightColumn: [], mapping usually implied by index here for simplicity in UI, 
        // but storage needs keys. We'll reconstruct from arrays.
        // Let's rely on q.leftColumn and q.rightColumn being same length.
        const lefts = q.leftColumn || ['', ''];
        const rights = q.rightColumn || ['', ''];
        
        // Math.min length?
        lefts.forEach((lVal, idx) => {
            addMatchingPairDOM(wrapper, rights[idx] || '', lVal);
        });

        addBtn.addEventListener('click', () => {
            addMatchingPairDOM(wrapper, '', '');
        });
        qDynamicContent.appendChild(content);

    } else if (type === 'click_drag') {
        const content = tplClickDrag.content.cloneNode(true);
        content.querySelector('.range-min').value = (q.range && q.range[0]) || 1;
        content.querySelector('.range-max').value = (q.range && q.range[1]) || 10;
        content.querySelector('.range-correct').value = q.correct || '';
        qDynamicContent.appendChild(content);
    }
}

// --- Theme Toggle ---

// Theme handled by script.js


// --- DOM Helpers for specific types (Updated styles) ---

function addOptionDOM(wrapper, type, idx, text, q) {
    const clone = tplOptionItem.content.cloneNode(true);
    const radio = clone.querySelector('.option-correct-radio');
    const input = clone.querySelector('.option-text');
    
    // Update classes for light/dark
    input.classList.remove('bg-slate-800', 'border-slate-700');
    input.classList.add('bg-white', 'dark:bg-slate-900', 'border-slate-300', 'dark:border-slate-700', 'text-slate-900', 'dark:text-slate-100');
    
    input.value = text || '';

    if (type === 'multiple_choice' || type === 'dropdown') {
        radio.type = 'radio';
        radio.name = `q_${currentQIndex}_correct`;
        radio.checked = (q.correct === idx);
    } else {
        radio.type = 'checkbox';
        radio.name = `q_${currentQIndex}_correct`;
        radio.checked = (Array.isArray(q.correct) && q.correct.includes(idx));
    }

    clone.querySelector('.remove-option-btn').addEventListener('click', (e) => {
        e.target.closest('.flex').remove();
    });

    wrapper.appendChild(clone);
}

function addOrderingItemDOM(wrapper, idx, text) {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 mb-2';
    div.innerHTML = `
        <span class="text-slate-600 dark:text-slate-400 text-xs index-indicator">${idx + 1}</span>
        <input type="text" class="order-item w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm focus:border-emerald-500 outline-none text-slate-900 dark:text-slate-100" placeholder="الترتيب ${idx + 1}" value="${text}">
        <button type="button" class="remove-order-item text-slate-500 hover:text-red-400">✕</button>
    `;
    div.querySelector('.remove-order-item').addEventListener('click', () => {
        div.remove();
        wrapper.querySelectorAll('.index-indicator').forEach((span, i) => span.textContent = i + 1);
    });
    wrapper.appendChild(div);
}

function addMatchingPairDOM(wrapper, rightText, leftText) {
    const div = document.createElement('div');
    div.className = 'grid grid-cols-2 gap-2 mt-2';
    div.innerHTML = `
        <input type="text" class="match-right w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm focus:border-emerald-500 outline-none text-slate-900 dark:text-slate-100" placeholder="السؤال/اليمين" value="${rightText}">
        <div class="flex gap-1">
            <input type="text" class="match-left w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm focus:border-emerald-500 outline-none text-slate-900 dark:text-slate-100" placeholder="الجواب/اليسار" value="${leftText}">
            <button type="button" class="remove-pair text-slate-500 hover:text-red-400 px-1">✕</button>
        </div>
    `;
    div.querySelector('.remove-pair').addEventListener('click', () => div.remove());
    wrapper.appendChild(div);
}

// --- Listeners for dynamic changes ---
// We generally save when navigating away, but we can also listen to type change to re-render
qTypeSelect.addEventListener('change', () => {
    // When type changes, we might lose type-specific data if we don't save carefully.
    // For simplicity, just re-render content area empty or with defaults for new type.
    // We update the type in the object immediately.
    questions[currentQIndex].type = qTypeSelect.value;
    // Reset type specific fields? Maybe keep 'q' and 'level'.
    // questions[currentQIndex] = { ...questions[currentQIndex], options:[], ... };
    renderTypeContent(questions[currentQIndex]);
});


function saveCurrentQuestionState() {
    const q = questions[currentQIndex];
    q.q = qTextInput.value;
    q.level = qLevelInput.value;
    q.type = qTypeSelect.value;

    const type = q.type;

    if (['multiple_choice', 'multiple_select', 'dropdown'].includes(type)) {
        const opts = [];
        let correct = null;
        let correctArr = [];
        
        const rows = qDynamicContent.querySelectorAll('.flex.items-center.gap-2'); // simplistic
        rows.forEach((row, idx) => {
            const txt = row.querySelector('.option-text').value;
            opts.push(txt);
            const chk = row.querySelector('.option-correct-radio');
            if (chk.checked) {
                if(type === 'multiple_select') correctArr.push(idx);
                else correct = idx;
            }
        });
        q.options = opts;
        q.correct = (type === 'multiple_select') ? correctArr : correct;

    } else if (type === 'essay') {
        q.modelAnswer = qDynamicContent.querySelector('.q-model-answer').value;

    } else if (type === 'ordering') {
        const items = [];
        /* Note: items-wrapper contains headers first? No, we cleared it in render.
           But wait, render clears ONLY if we allow it. 
           In renderTypeContent for ordering, we appended 'content'.
           Actually our addOrderingItemDOM appends to wrapper.
        */
        const inputs = qDynamicContent.querySelectorAll('.order-item');
        inputs.forEach(inp => items.push(inp.value));
        q.items = items; // raw list
        q.correctOrder = [...items]; // Teacher inputs Correct Order

    } else if (type === 'matching') {
        const lefts = [];
        const rights = [];
        const matches = {};
        
        const rows = qDynamicContent.querySelectorAll('.grid.grid-cols-2');
        rows.forEach((row, idx) => {
            if (idx===0 && row.querySelector('p')) return; // Header
            const rVal = row.querySelector('.match-right').value;
            const lVal = row.querySelector('.match-left').value;
            rights.push(rVal);
            lefts.push(lVal);
            matches[rVal] = lVal;
        });
        q.leftColumn = lefts;
        q.rightColumn = rights;
        q.correctMatches = matches;

    } else if (type === 'click_drag') {
        q.range = [
            parseInt(qDynamicContent.querySelector('.range-min').value),
            parseInt(qDynamicContent.querySelector('.range-max').value)
        ];
        q.correct = parseInt(qDynamicContent.querySelector('.range-correct').value);
    }
}

// --- Navigation Buttons ---

prevQBtn.addEventListener('click', () => {
    saveCurrentQuestionState();
    if (currentQIndex > 0) {
        currentQIndex--;
        renderQuestion();
    }
});

nextQBtn.addEventListener('click', () => {
    saveCurrentQuestionState();
    
    // Check if we are at the end
    if (currentQIndex === questions.length - 1) {
        // Add new
        questions.push(createEmptyQuestion());
    }
    currentQIndex++;
    renderQuestion();
});

deleteQBtn.addEventListener('click', () => {
    if (confirm('هل أنت متأكد من حذف هذا السؤال؟')) {
        questions.splice(currentQIndex, 1);
        if (questions.length === 0) {
            questions.push(createEmptyQuestion());
        } else if (currentQIndex >= questions.length) {
            currentQIndex = questions.length - 1;
        }
        renderQuestion();
    }
});

savePublishBtn.addEventListener('click', async () => {
    saveCurrentQuestionState();
    
    // Process Passage Image
    let processedPassage = testMetadata.passage;
    if (testMetadata.image && testMetadata.image.trim()) {
        const imgTag = `<img src="${testMetadata.image}" alt="${testMetadata.title}" style="width: 50%; border-radius: 8px; margin-top: 15px; display: block; margin-left: auto; margin-right: auto;">`;
        processedPassage = `${testMetadata.title} ـــــ (نص) \n\n${imgTag}\n\n${testMetadata.passage}`;
    }

    const finalData = {
        title: testMetadata.title,
        passage: processedPassage,
        duration: parseInt(testMetadata.duration),
        isPublic: testMetadata.isPublic,
        subject: testMetadata.subject,
        questions: questions.filter(q => q.q.trim() !== '') // Filter empty questions?
    };

    if (finalData.questions.length === 0) {
        alert('لا يمكن حفظ اختبار بدون أسئلة!');
        return;
    }

    savePublishBtn.textContent = 'جاري الحفظ...';
    savePublishBtn.disabled = true;

    try {
        await addDoc(collection(db, "tests"), {
            ...finalData,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser.uid,
            creatorEmail: auth.currentUser.email
        });
        alert('تم حفظ الاختبار بنجاح!');
        window.location.href = 'index.html';
    } catch (e) {
        console.error(e);
        alert('حدث خطأ: ' + e.message);
        savePublishBtn.textContent = 'حفظ وإنهاء';
        savePublishBtn.disabled = false;
    }
});
