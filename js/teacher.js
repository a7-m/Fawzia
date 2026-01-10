import { supabase, checkAuth, getCurrentUser } from "./auth.js";

// --- State ---
let testMetadata = {
  title: "",
  passage: "",
  image: "",
  duration: "0",
  subject: "لغة عربية",
  isPublic: true,
};
let questions = [];
let currentQIndex = 0;
let currentStep = 1;
let dragIndex = null;
let currentUser = null;
let editingExamId = null;

(async () => {
  currentUser = await checkAuth({ protected: true });
  if (currentUser && !currentUser.isTeacher && !currentUser.isAdmin) {
    alert("هذه الصفحة مخصصة للمعلمين والمشرفين فقط.");
    window.location.replace("../../index.html");
    return;
  }

  // Check for editing mode
  const params = new URLSearchParams(window.location.search);
  const examId = params.get("exam_id");
  if (examId) {
    editingExamId = examId;
    await loadExamForEditing(examId);
  }
})();

async function loadExamForEditing(id) {
  try {
    const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("id", id)
        .single();
    
    if (error) throw error;
    if (!data) return;

    // Populate Metadata
    testMetadata.title = data.title;
    testMetadata.subject = data.subject;
    testMetadata.duration = data.duration;
    testMetadata.isPublic = data.visibility === "public";
    
    // Attempt to extract image from passage if stored in that way
    // (This works if we stored it as: TITLE ـــــ (نص) \n\n<img ...>\n\nPASSAGE)
    // We will do a simple split if possible, or just load passage as is.
    // For robust editing, we'll just put the full content in passage for now
    // unless we want to parse out the image. 
    // Let's rely on user putting it back if they want.
    // Ideally we would have stored image separately.
    testMetadata.passage = data.passage; 
    
    document.getElementById("testTitle").value = data.title || "";
    document.getElementById("subject").value = data.subject || "لغة عربية";
    document.getElementById("testDuration").value = data.duration || 0;
    
    // Radio buttons
    const radios = document.getElementsByName("publishStatus");
    if (radios.length) {
        radios.forEach(r => {
            if (r.value === (data.visibility === "public" ? "public" : "private")) r.checked = true;
        });
    }

    document.getElementById("readingPassage").value = data.passage || "";

    // Questions
    if (Array.isArray(data.questions)) {
        questions = data.questions;
    } else if (typeof data.questions === "string") {
        try { questions = JSON.parse(data.questions); } catch(e){ questions =[]; }
    }
    
    if (questions.length === 0) {
        questions.push(createEmptyQuestion());
    }
    
    refreshQuestionList();
    renderQuestion();

    // Update UI title
    document.querySelector("header h1").textContent = "تعديل الاختبار";
    savePublishBtn.textContent = "حفظ التعديلات";

  } catch(err) {
    console.error("Error loading exam:", err);
    alert("تعذر تحميل بيانات الاختبار للتعديل.");
  }
}

// --- DOM Elements ---
const stepCards = document.querySelectorAll("[data-step]");
const stepPanels = document.querySelectorAll("[data-step-panel]");

const setupForm = document.getElementById("setupForm");
const backToMetaBtn = document.getElementById("backToMetaBtn");
const toQuestionsBtn = document.getElementById("toQuestionsBtn");
const backToPassageBtn = document.getElementById("backToPassageBtn");
const toReviewBtn = document.getElementById("toReviewBtn");
const backToQuestionsBtn = document.getElementById("backToQuestionsBtn");

const metaError = document.getElementById("metaError");
const passageError = document.getElementById("passageError");
const questionError = document.getElementById("questionError");
const reviewError = document.getElementById("reviewError");
const reviewMeta = document.getElementById("reviewMeta");
const reviewQuestions = document.getElementById("reviewQuestions");

// Question Editor Elements
const prevQBtn = document.getElementById("prevQBtn");
const nextQBtn = document.getElementById("nextQBtn");
const deleteQBtn = document.getElementById("deleteQBtn");
const savePublishBtn = document.getElementById("savePublishBtn");
const editorSubtitle = document.getElementById("editorSubtitle");
const duplicateQBtn = document.getElementById("duplicateQBtn");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const questionList = document.getElementById("questionList");
const previewArea = document.getElementById("previewArea");

const qTextInput = document.getElementById("qTextInput");
const qTypeSelect = document.getElementById("qTypeSelect");
const qLevelInput = document.getElementById("qLevelInput");
const qDynamicContent = document.getElementById("qDynamicContent");

// Templates
const tplOptionsList = document.getElementById("tpl-options-list");
const tplOptionItem = document.getElementById("tpl-option-item");
const tplEssay = document.getElementById("tpl-essay");
const tplOrdering = document.getElementById("tpl-ordering");
const tplMatching = document.getElementById("tpl-matching");
const tplClickDrag = document.getElementById("tpl-click-drag");

// --- Wizard Flow ---
setupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!validateMetadata(true)) return;
  captureMetadata();
  goToStep(2);
});

backToMetaBtn.addEventListener("click", () => goToStep(1));

toQuestionsBtn.addEventListener("click", () => {
  if (!validatePassage(true)) return;
  capturePassage();
  if (questions.length === 0) {
    questions.push(createEmptyQuestion());
    currentQIndex = 0;
  }
  renderQuestion();
  goToStep(3);
});

backToPassageBtn.addEventListener("click", () => {
  saveCurrentQuestionState();
  goToStep(2);
});

toReviewBtn.addEventListener("click", () => {
  saveCurrentQuestionState();
  const validation = validateQuestions(true);
  if (!validation.valid) {
    questionError.textContent = validation.message;
    return;
  }
  questionError.textContent = "";
  populateReview();
  updatePublishState(false);
  goToStep(4);
});

backToQuestionsBtn.addEventListener("click", () => goToStep(3));

// --- Question Logic ---
function createEmptyQuestion() {
  return {
    q: "",
    type: "multiple_choice",
    level: "",
    options: ["", ""],
    correct: null,
    leftColumn: [],
    rightColumn: [],
  };
}

function renderQuestion() {
  const q = questions[currentQIndex];
  if (!q) return;

  editorSubtitle.textContent = `السؤال ${currentQIndex + 1} من ${
    questions.length
  }`;

  qTextInput.value = q.q || "";
  qTypeSelect.value = q.type || "multiple_choice";
  qLevelInput.value = q.level || "";

  renderTypeContent(q);
  refreshQuestionList();
  renderPreview(q);
  prevQBtn.disabled = currentQIndex === 0;
}

function renderTypeContent(q) {
  qDynamicContent.innerHTML = "";
  const type = qTypeSelect.value;
  q.type = type;

  if (["multiple_choice", "multiple_select", "dropdown"].includes(type)) {
    const content = tplOptionsList.content.cloneNode(true);
    const wrapper = content.querySelector(".options-wrapper");
    const addBtn = content.querySelector(".add-option-btn");

    const opts = q.options && q.options.length ? q.options : ["", ""];
    opts.forEach((optText, idx) => addOptionDOM(wrapper, type, idx, optText, q));

    addBtn.addEventListener("click", () => {
      addOptionDOM(wrapper, type, wrapper.children.length, "", q);
      handleQuestionChange();
    });

    qDynamicContent.appendChild(content);
  } else if (type === "essay") {
    const content = tplEssay.content.cloneNode(true);
    const textarea = content.querySelector(".q-model-answer");
    textarea.value = q.modelAnswer || "";
    qDynamicContent.appendChild(content);
  } else if (type === "ordering") {
    const content = tplOrdering.content.cloneNode(true);
    const wrapper = content.querySelector(".items-wrapper");
    const addBtn = content.querySelector(".add-order-item-btn");

    const items = q.items && q.items.length ? q.items : ["", "", ""];
    wrapper.innerHTML = "";
    items.forEach((txt, idx) => addOrderingItemDOM(wrapper, idx, txt));

    addBtn.addEventListener("click", () => {
      addOrderingItemDOM(wrapper, wrapper.children.length, "");
      handleQuestionChange();
    });
    qDynamicContent.appendChild(content);
  } else if (type === "matching") {
    const content = tplMatching.content.cloneNode(true);
    const wrapper = content.querySelector(".pairs-wrapper");
    const addBtn = content.querySelector(".add-pair-btn");

    wrapper.innerHTML = "";
    const header = document.createElement("div");
    header.className = "grid grid-cols-2 gap-2";
    header.innerHTML =
      '<p class="text-xs text-slate-500">العمود الأيمن</p><p class="text-xs text-slate-500">العمود الأيسر (المطابق له)</p>';
    wrapper.appendChild(header);

    const lefts = q.leftColumn && q.leftColumn.length ? q.leftColumn : ["", ""];
    const rights = q.rightColumn && q.rightColumn.length ? q.rightColumn : ["", ""];
    lefts.forEach((lVal, idx) =>
      addMatchingPairDOM(wrapper, rights[idx] || "", lVal)
    );

    addBtn.addEventListener("click", () => {
      addMatchingPairDOM(wrapper, "", "");
      handleQuestionChange();
    });
    qDynamicContent.appendChild(content);
  } else if (type === "click_drag") {
    const content = tplClickDrag.content.cloneNode(true);
    content.querySelector(".range-min").value = (q.range && q.range[0]) || 1;
    content.querySelector(".range-max").value = (q.range && q.range[1]) || 10;
    content.querySelector(".range-correct").value =
      q.correct !== undefined && q.correct !== null ? q.correct : "";
    qDynamicContent.appendChild(content);
  }
}

// --- DOM Helpers ---
function addOptionDOM(wrapper, type, idx, text, q) {
  const clone = tplOptionItem.content.cloneNode(true);
  const radio = clone.querySelector(".option-correct-radio");
  const input = clone.querySelector(".option-text");

  input.classList.remove("bg-slate-800", "border-slate-700");
  input.classList.add(
    "bg-white",
    "dark:bg-slate-900",
    "border-slate-300",
    "dark:border-slate-700",
    "text-slate-900",
    "dark:text-slate-100"
  );

  input.value = text || "";

  if (type === "multiple_choice" || type === "dropdown") {
    radio.type = "radio";
    radio.name = `q_${currentQIndex}_correct`;
    radio.checked = q.correct === idx;
  } else {
    radio.type = "checkbox";
    radio.name = `q_${currentQIndex}_correct`;
    radio.checked = Array.isArray(q.correct) && q.correct.includes(idx);
  }

  clone.querySelector(".remove-option-btn").addEventListener("click", (e) => {
    e.target.closest(".flex").remove();
    handleQuestionChange();
  });

  wrapper.appendChild(clone);
}

function addOrderingItemDOM(wrapper, idx, text) {
  const div = document.createElement("div");
  div.className = "flex items-center gap-2 mb-2";
  div.innerHTML = `
        <span class="text-slate-600 dark:text-slate-400 text-xs index-indicator">${
          idx + 1
        }</span>
        <input type="text" class="order-item w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm focus:border-emerald-500 outline-none text-slate-900 dark:text-slate-100" placeholder="الترتيب ${
          idx + 1
        }" value="${text}">
        <button type="button" class="remove-order-item text-slate-500 hover:text-red-400">✕</button>
    `;
  div.querySelector(".remove-order-item").addEventListener("click", () => {
    div.remove();
    wrapper
      .querySelectorAll(".index-indicator")
      .forEach((span, i) => (span.textContent = i + 1));
    handleQuestionChange();
  });
  wrapper.appendChild(div);
}

function addMatchingPairDOM(wrapper, rightText, leftText) {
  const div = document.createElement("div");
  div.className = "grid grid-cols-2 gap-2 mt-2";
  div.innerHTML = `
        <input type="text" class="match-right w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm focus:border-emerald-500 outline-none text-slate-900 dark:text-slate-100" placeholder="السؤال/اليمين" value="${rightText}">
        <div class="flex gap-1">
            <input type="text" class="match-left w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-3 py-1.5 text-sm focus:border-emerald-500 outline-none text-slate-900 dark:text-slate-100" placeholder="الجواب/اليسار" value="${leftText}">
            <button type="button" class="remove-pair text-slate-500 hover:text-red-400 px-1">✕</button>
        </div>
    `;
  div.querySelector(".remove-pair").addEventListener("click", () => {
    div.remove();
    handleQuestionChange();
  });
  wrapper.appendChild(div);
}

// --- Event Listeners for question fields ---
qTypeSelect.addEventListener("change", () => {
  questions[currentQIndex].type = qTypeSelect.value;
  renderTypeContent(questions[currentQIndex]);
  handleQuestionChange();
});

qTextInput.addEventListener("input", handleQuestionChange);
qLevelInput.addEventListener("change", handleQuestionChange);
qDynamicContent.addEventListener("input", handleQuestionChange);

function handleQuestionChange() {
  saveCurrentQuestionState();
  renderPreview(questions[currentQIndex]);
  refreshQuestionList();
  questionError.textContent = "";
  reviewError.textContent = "";
  updatePublishState(false);
}

function saveCurrentQuestionState() {
  const q = questions[currentQIndex];
  if (!q) return;
  q.q = qTextInput.value;
  q.level = qLevelInput.value;
  q.type = qTypeSelect.value;

  const type = q.type;

  if (["multiple_choice", "multiple_select", "dropdown"].includes(type)) {
    const opts = [];
    let correct = null;
    const correctArr = [];

    const rows = qDynamicContent.querySelectorAll(".flex.items-center.gap-2");
    rows.forEach((row, idx) => {
      const txt = row.querySelector(".option-text").value;
      opts.push(txt);
      const chk = row.querySelector(".option-correct-radio");
      if (chk.checked) {
        if (type === "multiple_select") correctArr.push(idx);
        else correct = idx;
      }
    });
    q.options = opts;
    q.correct = type === "multiple_select" ? correctArr : correct;
  } else if (type === "essay") {
    const textarea = qDynamicContent.querySelector(".q-model-answer");
    q.modelAnswer = textarea ? textarea.value : "";
  } else if (type === "ordering") {
    const items = [];
    const inputs = qDynamicContent.querySelectorAll(".order-item");
    inputs.forEach((inp) => items.push(inp.value));
    q.items = items;
    q.correctOrder = [...items];
  } else if (type === "matching") {
    const lefts = [];
    const rights = [];
    const matches = {};

    const rows = qDynamicContent.querySelectorAll(".grid.grid-cols-2");
    rows.forEach((row, idx) => {
      if (idx === 0 && row.querySelector("p")) return;
      const rVal = row.querySelector(".match-right").value;
      const lVal = row.querySelector(".match-left").value;
      rights.push(rVal);
      lefts.push(lVal);
      if (rVal) matches[rVal] = lVal;
    });
    q.leftColumn = lefts;
    q.rightColumn = rights;
    q.correctMatches = matches;
  } else if (type === "click_drag") {
    const min = parseInt(
      qDynamicContent.querySelector(".range-min")?.value || "0",
      10
    );
    const max = parseInt(
      qDynamicContent.querySelector(".range-max")?.value || "0",
      10
    );
    q.range = [min, max];
    q.correct = parseInt(
      qDynamicContent.querySelector(".range-correct")?.value || "0",
      10
    );
  }
}

// --- Navigation Buttons ---
prevQBtn.addEventListener("click", () => {
  saveCurrentQuestionState();
  if (currentQIndex > 0) {
    currentQIndex--;
    renderQuestion();
  }
});

nextQBtn.addEventListener("click", () => {
  saveCurrentQuestionState();
  if (currentQIndex === questions.length - 1) {
    questions.push(createEmptyQuestion());
  }
  currentQIndex++;
  renderQuestion();
});

deleteQBtn.addEventListener("click", () => {
  if (confirm("هل أنت متأكد من حذف هذا السؤال؟")) {
    questions.splice(currentQIndex, 1);
    if (questions.length === 0) {
      questions.push(createEmptyQuestion());
    } else if (currentQIndex >= questions.length) {
      currentQIndex = questions.length - 1;
    }
    renderQuestion();
  }
});

addQuestionBtn.addEventListener("click", () => {
  saveCurrentQuestionState();
  questions.push(createEmptyQuestion());
  currentQIndex = questions.length - 1;
  renderQuestion();
});

duplicateQBtn.addEventListener("click", () => {
  saveCurrentQuestionState();
  const copy = JSON.parse(JSON.stringify(questions[currentQIndex]));
  questions.splice(currentQIndex + 1, 0, copy);
  currentQIndex += 1;
  renderQuestion();
});

// Drag & drop reordering
function refreshQuestionList() {
  if (!questionList) return;
  questionList.innerHTML = "";
  questions.forEach((q, idx) => {
    const item = document.createElement("div");
    const hasCorrect = checkQuestionHasCorrect(q);
    item.className = `p-3 rounded-lg border cursor-pointer transition ${
      idx === currentQIndex
        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30"
        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
    }`;
    item.draggable = true;
    item.dataset.index = idx.toString();
    item.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <div class="text-sm font-semibold text-slate-800 dark:text-slate-100">
          س${idx + 1}: ${q.q?.trim() ? q.q.trim() : "بدون نص"}
        </div>
        <span class="text-xs ${
          hasCorrect ? "text-emerald-600" : "text-red-500"
        }">${hasCorrect ? "✔ إجابة محددة" : "✗ بلا إجابة"}</span>
      </div>
    `;

    item.addEventListener("click", () => {
      saveCurrentQuestionState();
      currentQIndex = idx;
      renderQuestion();
    });
    item.addEventListener("dragstart", (e) => {
      dragIndex = idx;
      e.dataTransfer.effectAllowed = "move";
    });
    item.addEventListener("dragover", (e) => e.preventDefault());
    item.addEventListener("drop", (e) => {
      e.preventDefault();
      const targetIndex = Number(e.currentTarget.dataset.index);
      if (dragIndex === null || dragIndex === targetIndex) return;
      const [moved] = questions.splice(dragIndex, 1);
      questions.splice(targetIndex, 0, moved);
      currentQIndex = targetIndex;
      dragIndex = null;
      renderQuestion();
    });
    item.addEventListener("dragend", () => {
      dragIndex = null;
    });

    questionList.appendChild(item);
  });
}

function checkQuestionHasCorrect(q) {
  if (!q || !q.type) return false;
  if (["multiple_choice", "dropdown"].includes(q.type)) {
    return typeof q.correct === "number" && q.correct >= 0;
  }
  if (q.type === "multiple_select") {
    return Array.isArray(q.correct) && q.correct.length > 0;
  }
  if (q.type === "essay") {
    return !!(q.modelAnswer && q.modelAnswer.trim());
  }
  if (q.type === "ordering") {
    return Array.isArray(q.correctOrder) && q.correctOrder.length > 0;
  }
  if (q.type === "matching") {
    return (
      Array.isArray(q.leftColumn) &&
      q.leftColumn.length > 0 &&
      Array.isArray(q.rightColumn) &&
      q.rightColumn.length > 0
    );
  }
  if (q.type === "click_drag") {
    return q.correct !== undefined && q.correct !== null && q.correct !== "";
  }
  return false;
}

// --- Validation ---
function captureMetadata() {
  testMetadata.title = document.getElementById("testTitle").value.trim();
  testMetadata.subject = document.getElementById("subject").value.trim();
  testMetadata.duration = document.getElementById("testDuration").value;
  testMetadata.isPublic =
    document.querySelector('input[name="publishStatus"]:checked')?.value ===
    "public";
}

function capturePassage() {
  testMetadata.passage = document.getElementById("readingPassage").value;
  testMetadata.image = document.getElementById("passageImage").value;
}

function validateMetadata(showError = false) {
  const title = document.getElementById("testTitle").value.trim();
  if (!title) {
    if (showError) metaError.textContent = "عنوان الاختبار مطلوب.";
    return false;
  }
  if (showError) metaError.textContent = "";
  return true;
}

function validatePassage(showError = false) {
  const passage = document.getElementById("readingPassage").value.trim();
  if (!passage) {
    if (showError) passageError.textContent = "نص القراءة مطلوب.";
    return false;
  }
  if (showError) passageError.textContent = "";
  return true;
}

function validateQuestions(showError = false) {
  if (!questions.length) {
    return { valid: false, message: "أضف سؤالًا واحدًا على الأقل." };
  }
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.q || !q.q.trim()) {
      return { valid: false, message: `نص السؤال رقم ${i + 1} مطلوب.` };
    }
    if (!q.type) {
      return { valid: false, message: `حدد نوع السؤال رقم ${i + 1}.` };
    }
    if (["multiple_choice", "dropdown"].includes(q.type)) {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return { valid: false, message: `أضف خيارين على الأقل للسؤال ${i + 1}.` };
      }
      if (q.options.some((o) => !o.trim())) {
        return { valid: false, message: `أكمل نصوص الخيارات في السؤال ${i + 1}.` };
      }
      if (typeof q.correct !== "number" || q.correct < 0) {
        return { valid: false, message: `حدد الإجابة الصحيحة للسؤال ${i + 1}.` };
      }
    } else if (q.type === "multiple_select") {
      if (!Array.isArray(q.options) || q.options.length < 2) {
        return { valid: false, message: `أضف خيارين على الأقل للسؤال ${i + 1}.` };
      }
      if (q.options.some((o) => !o.trim())) {
        return { valid: false, message: `أكمل نصوص الخيارات في السؤال ${i + 1}.` };
      }
      if (!Array.isArray(q.correct) || q.correct.length === 0) {
        return { valid: false, message: `حدد إجابة صحيحة واحدة على الأقل للسؤال ${i + 1}.` };
      }
    } else if (q.type === "essay") {
      if (!q.modelAnswer || !q.modelAnswer.trim()) {
        return { valid: false, message: `أدخل إجابة نموذجية للسؤال ${i + 1}.` };
      }
    } else if (q.type === "ordering") {
      if (!Array.isArray(q.items) || q.items.length < 2) {
        return { valid: false, message: `أدخل عنصرين على الأقل للترتيب في السؤال ${i + 1}.` };
      }
      if (q.items.some((it) => !it.trim())) {
        return { valid: false, message: `أكمل نصوص العناصر في السؤال ${i + 1}.` };
      }
    } else if (q.type === "matching") {
      if (!Array.isArray(q.leftColumn) || !Array.isArray(q.rightColumn)) {
        return { valid: false, message: `أكمل أزواج التوصيل في السؤال ${i + 1}.` };
      }
      if (q.leftColumn.length === 0 || q.rightColumn.length === 0) {
        return { valid: false, message: `أدخل زوجين على الأقل في السؤال ${i + 1}.` };
      }
      if (q.leftColumn.some((v) => !v.trim()) || q.rightColumn.some((v) => !v.trim())) {
        return { valid: false, message: `أكمل نصوص الأزواج في السؤال ${i + 1}.` };
      }
    } else if (q.type === "click_drag") {
      if (!Array.isArray(q.range) || q.range.length !== 2) {
        return { valid: false, message: `حدد مدى القيم للسؤال ${i + 1}.` };
      }
      if (q.correct === null || q.correct === undefined || isNaN(q.correct)) {
        return { valid: false, message: `أدخل الإجابة الصحيحة للسؤال ${i + 1}.` };
      }
    }
  }
  if (showError) questionError.textContent = "";
  return { valid: true, message: "" };
}

function updatePublishState(showErrors = false) {
  const metaOk = validateMetadata(showErrors);
  const passageOk = validatePassage(showErrors);
  const questionsOk = validateQuestions(showErrors).valid;
  savePublishBtn.disabled = !(metaOk && passageOk && questionsOk);
}

function populateReview() {
  if (reviewMeta) {
    reviewMeta.innerHTML = `
      <li>العنوان: ${testMetadata.title || "—"}</li>
      <li>المادة: ${testMetadata.subject || "—"}</li>
      <li>المدة: ${testMetadata.duration || 0} دقيقة</li>
      <li>الحالة: ${testMetadata.isPublic ? "عام" : "خاص"}</li>
    `;
  }
  if (reviewQuestions) {
    reviewQuestions.innerHTML = `
      <li>عدد الأسئلة: ${questions.length}</li>
      ${questions
        .map(
          (q, i) =>
            `<li>س${i + 1}: ${q.q?.trim() || "بدون نص"} (${labelType(q.type)})</li>`
        )
        .join("")}
    `;
  }
}

function labelType(type) {
  const map = {
    multiple_choice: "اختيار من متعدد",
    multiple_select: "اختيار متعدد",
    dropdown: "قائمة منسدلة",
    essay: "مقالي",
    ordering: "ترتيب",
    matching: "توصيل",
    click_drag: "نطاق رقمي",
  };
  return map[type] || type || "غير محدد";
}

// --- Wizard helper ---
function goToStep(step) {
  currentStep = step;
  stepPanels.forEach((panel) => {
    const isActive = Number(panel.dataset.stepPanel) === step;
    panel.classList.toggle("hidden", !isActive);
  });
  stepCards.forEach((card) => {
    const isActive = Number(card.dataset.step) === step;
    card.classList.toggle("active", isActive);
    card.classList.toggle("border-emerald-200", isActive);
    card.classList.toggle("dark:border-emerald-800", isActive);
  });
  updatePublishState(false);
}

// --- Preview ---
function renderPreview(q) {
  if (!previewArea || !q) return;
  const container = document.createElement("div");
  container.className = "space-y-2";

  const title = document.createElement("p");
  title.className = "font-semibold text-slate-800 dark:text-slate-100";
  title.textContent = q.q || "—";
  container.appendChild(title);

  const level = document.createElement("p");
  level.className = "text-xs text-slate-500";
  level.textContent = q.level ? `المستوى: ${q.level}` : "المستوى: —";
  container.appendChild(level);

  if (["multiple_choice", "dropdown", "multiple_select"].includes(q.type)) {
    const list = document.createElement("ul");
    list.className = "list-disc pr-5 space-y-1 text-sm";
    (q.options || []).forEach((opt, idx) => {
      const li = document.createElement("li");
      const isCorrect =
        q.type === "multiple_select"
          ? Array.isArray(q.correct) && q.correct.includes(idx)
          : q.correct === idx;
      li.textContent = opt || "—";
      li.className = isCorrect ? "text-emerald-600" : "";
      list.appendChild(li);
    });
    container.appendChild(list);
  } else if (q.type === "essay") {
    const p = document.createElement("p");
    p.className = "text-sm text-slate-700 dark:text-slate-200";
    p.textContent = q.modelAnswer || "الإجابة النموذجية ستظهر هنا.";
    container.appendChild(p);
  } else if (q.type === "ordering") {
    const ol = document.createElement("ol");
    ol.className = "list-decimal pr-5 space-y-1 text-sm";
    (q.items || []).forEach((it) => {
      const li = document.createElement("li");
      li.textContent = it || "—";
      ol.appendChild(li);
    });
    container.appendChild(ol);
  } else if (q.type === "matching") {
    const wrapper = document.createElement("div");
    wrapper.className = "grid grid-cols-2 gap-2 text-sm";
    const lefts = q.leftColumn || [];
    const rights = q.rightColumn || [];
    rights.forEach((r, idx) => {
      const right = document.createElement("div");
      right.textContent = r || "—";
      const left = document.createElement("div");
      left.textContent = lefts[idx] || "—";
      wrapper.appendChild(right);
      wrapper.appendChild(left);
    });
    container.appendChild(wrapper);
  } else if (q.type === "click_drag") {
    const p = document.createElement("p");
    p.className = "text-sm";
    p.textContent = `النطاق: ${
      q.range ? `${q.range[0]} - ${q.range[1]}` : "—"
    } | الإجابة الصحيحة: ${q.correct ?? "—"}`;
    container.appendChild(p);
  }

  previewArea.innerHTML = "";
  previewArea.appendChild(container);
}

// --- Publish ---
savePublishBtn.addEventListener("click", async () => {
  saveCurrentQuestionState();
  const isValid = validateMetadata(true) && validatePassage(true) && validateQuestions(true).valid;
  if (!isValid) {
    reviewError.textContent = "يرجى استكمال البيانات قبل النشر.";
    return;
  }
  reviewError.textContent = "";

  // Process Passage Image
  let processedPassage = testMetadata.passage;
  // Only add image tag if it doesn't already exist or if we want to prepend.
  // When editing, if user didn't change passage, it might already have the tag.
  // Simple check: if image field is filled, prepend it.
  if (testMetadata.image && testMetadata.image.trim()) {
      // If passage already contains this image src, maybe skip?
      // but user might want to change it.
      // Let's just prepend.
    const imgTag = `<img src="${testMetadata.image}" alt="${testMetadata.title}" style="width: 50%; border-radius: 8px; margin-top: 15px; display: block; margin-left: auto; margin-right: auto;">`;
    processedPassage = `${testMetadata.title} ـــــ (نص) \n\n${imgTag}\n\n${testMetadata.passage}`;
  }

  const cleanedQuestions = questions.filter((q) => q.q && q.q.trim());

  const finalData = {
    title: testMetadata.title,
    passage: processedPassage,
    duration: parseInt(testMetadata.duration, 10),
    isPublic: testMetadata.isPublic,
    subject: testMetadata.subject,
    questions: cleanedQuestions,
  };

  if (finalData.questions.length === 0) {
    alert("لا يمكن حفظ اختبار بدون أسئلة!");
    return;
  }

  savePublishBtn.textContent = "جاري الحفظ...";
  savePublishBtn.disabled = true;

  try {
    const fallbackUser =
      currentUser || (await supabase.auth.getUser())?.data?.user || (await getCurrentUser());
    if (!fallbackUser) {
      alert("الرجاء تسجيل الدخول كمعلمة.");
      return;
    }
    
    const visibility = finalData.isPublic ? "public" : "private";

    if (editingExamId) {
        // UPDATE
        const { error } = await supabase.from("exams").update({
            title: finalData.title,
            visibility: visibility,
            passage: finalData.passage,
            questions: finalData.questions,
            duration: finalData.duration,
            subject: finalData.subject,
            // author_id: keep original
        }).eq("id", editingExamId);
        
        if (error) throw error;
        alert("تم تعديل الاختبار بنجاح ✅");
    } else {
        // INSERT
        const { error } = await supabase.from("exams").insert({
          title: finalData.title,
          visibility: visibility,
          passage: finalData.passage,
          questions: finalData.questions,
          duration: finalData.duration,
          subject: finalData.subject,
          author_id: fallbackUser.uid || fallbackUser.id,
          engine: "teacher",
        });

        if (error) throw error;
        alert("تم حفظ الاختبار الجديد بنجاح ✅");
    }
    
    // Redirect back to list
    setTimeout(() => {
        window.location.href = "available-exams.html";
    }, 1000);

  } catch (e) {
    console.error(e);
    alert("حدث خطأ: " + e.message);
  } finally {
    savePublishBtn.textContent = editingExamId ? "حفظ التعديلات" : "نشر الاختبار";
    savePublishBtn.disabled = false;
  }
});

// --- Init ---
function init() {
  if (questions.length === 0) {
    questions.push(createEmptyQuestion());
  }
  renderQuestion();
  goToStep(1);
}

init();
