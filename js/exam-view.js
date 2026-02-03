import { supabase, checkAuth } from "./auth.js";

const qs = (id) => document.getElementById(id);
const statusEl = qs("statusMessage");
const actionContainer = qs("actionButtons");

// Exam template elements (teacher engine only)
const examContainer = qs("examContainer");
const modeBadge = qs("modeBadge");
const timerDisplay = qs("timerDisplay");
const progressText = qs("progressText");
const progressFill = qs("progressFill");
const previewHint = qs("previewHint");
const questionNumber = qs("questionNumber");
const questionText = qs("questionText");
const optionsContainer = qs("optionsContainer");
const answerNote = qs("answerNote");
const prevQuestionBtn = qs("prevQuestionBtn");
const nextQuestionBtn = qs("nextQuestionBtn");
const submitExamBtn = qs("submitExamBtn");

let examData = null;
let questions = [];
let answers = [];
let currentIndex = 0;
let mode = "run"; // "run" | "preview"
let timerId = null;
let remainingSeconds = null;

function showStatus(msg, type = "info") {
  if (!statusEl) return;
  statusEl.textContent = msg;
  statusEl.classList.remove("hidden");
  statusEl.className =
    "mb-4 px-4 py-3 rounded-xl text-sm font-semibold " +
    (type === "error"
      ? "bg-red-50 text-red-700 border border-red-200"
      : type === "success"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
      : "bg-slate-50 text-slate-700 border border-slate-200");
}

function hideStatus() {
  if (statusEl) statusEl.classList.add("hidden");
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("ar-EG", { dateStyle: "medium" });
}

function parseQuestions(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn("تعذر قراءة الأسئلة.", e);
      return [];
    }
  }
  return [];
}

function normalizeEngine(engine) {
  return engine === "teacher" || engine === "system" ? engine : "teacher";
}

function formatSeconds(sec) {
  if (!Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function renderActions(exam, user) {
  if (!actionContainer) return;
  actionContainer.innerHTML = "";

  const engine = normalizeEngine(exam.engine);

  if (engine !== "teacher") {
    // Respect engine separation: no redirects from teacher engine view
    const note = document.createElement("div");
    note.className = "info-card";
    note.textContent =
      "هذا الاختبار تابع لمحرك النظام ويُعرض فقط عبر الصفحة الرئيسية.";
    actionContainer.appendChild(note);
    return;
  }

  const primaryLink = document.createElement("a");
  primaryLink.className = "btn";
  primaryLink.textContent = user.isTeacher ? "معاينة" : "بدء الاختبار";
  primaryLink.href = `exam-view.html?exam_id=${exam.id}&mode=${
    user.isTeacher ? "preview" : "run"
  }`;
  actionContainer.appendChild(primaryLink);

  if (user.isTeacher) {
    const attemptsLink = document.createElement("a");
    attemptsLink.href = "./admin.html#resultsTableBody";
    attemptsLink.className = "btn btn-ghost";
    attemptsLink.textContent = "عرض النتائج";
    actionContainer.appendChild(attemptsLink);
  }
}

function fillExam(exam) {
  qs("examTitle").textContent = exam.title || "اختبار بلا عنوان";
  qs("examSubject").textContent = exam.subject
    ? `المادة: ${exam.subject}`
    : "المادة: —";
  qs("examDuration").textContent = exam.duration
    ? `المدة: ${exam.duration} دقيقة`
    : "المدة: غير محددة";
  qs("examVisibility").textContent =
    exam.visibility === "public" ? "الخصوصية: عام" : "الخصوصية: خاص";
  qs("examCreatedAt").textContent = `أُنشئ: ${formatDate(exam.created_at)}`;
  qs("questionsCount").textContent = `${(exam.questions || []).length} سؤال`;
  const passageEl = qs("examPassage");
  if (passageEl) {
    passageEl.innerHTML = exam.passage
      ? exam.passage
      : '<span class="text-slate-400">لا يوجد نص مرفق</span>';
  }
}

function updateModeUI() {
  if (!modeBadge || !submitExamBtn || !previewHint || !timerDisplay) return;
  const isPreview = mode === "preview";
  modeBadge.textContent = isPreview ? "وضع المعاينة" : "وضع الاختبار";
  modeBadge.className =
    "status-badge " +
    (isPreview
      ? "bg-amber-50 text-amber-700 border border-amber-100"
      : "bg-emerald-50 text-emerald-700 border border-emerald-100");
  previewHint.classList.toggle("hidden", !isPreview);
  submitExamBtn.disabled = isPreview;
  timerDisplay.textContent = isPreview ? "غير مفعّل" : formatSeconds(remainingSeconds);
}

function renderQuestionNav() {
  if (progressText) {
    const total = questions.length;
    progressText.textContent = total
      ? `السؤال ${currentIndex + 1} من ${total}`
      : "لا توجد أسئلة";
    if (progressFill) {
      progressFill.style.width = total
        ? `${((currentIndex + 1) / total) * 100}%`
        : "0%";
    }
  }
  if (prevQuestionBtn) prevQuestionBtn.disabled = currentIndex === 0;
  if (nextQuestionBtn) nextQuestionBtn.disabled = currentIndex >= questions.length - 1;
}

function showAnswerNote() {
  if (!answerNote) return;
  answerNote.style.display = "block";
  clearTimeout(showAnswerNote.timeoutId);
  showAnswerNote.timeoutId = setTimeout(() => {
    answerNote.style.display = "none";
  }, 5000);
}

function renderOptions(q) {
  if (!optionsContainer) return;
  optionsContainer.innerHTML = "";
  if (!q) return;

  const disableInput = mode === "preview";

  if (q.type === "multiple_choice") {
    (q.options || []).forEach((option, index) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = "option";
      optionDiv.textContent = option || `اختيار ${index + 1}`;

      if (answers[currentIndex] === index) {
        optionDiv.classList.add("selected");
      }

      if (!disableInput) {
        optionDiv.addEventListener("click", () => {
          document.querySelectorAll(".option").forEach((el) => el.classList.remove("selected"));
          optionDiv.classList.add("selected");
          answers[currentIndex] = index;
          showAnswerNote();
        });
      }

      optionsContainer.appendChild(optionDiv);
    });
  } else if (q.type === "drag_drop") {
    const dragDropDiv = document.createElement("div");
    dragDropDiv.className = "drag-drop-container";

    const instruction = document.createElement("p");
    instruction.textContent = "اسحب العناصر وأفلتها في المنطقة أدناه بالترتيب الصحيح";
    instruction.style.marginBottom = "15px";
    instruction.style.fontWeight = "600";
    dragDropDiv.appendChild(instruction);

    const dragItems = document.createElement("div");
    dragItems.className = "drag-items";

    const savedAnswer = answers[currentIndex];
    const itemsToShow = savedAnswer && Array.isArray(savedAnswer)
      ? q.items
      : (q.items || []).slice().sort(() => Math.random() - 0.5);

    itemsToShow.forEach((item) => {
      const dragItem = document.createElement("div");
      dragItem.className = "drag-item";
      dragItem.textContent = item;
      dragItem.draggable = !disableInput;
      dragItem.dataset.item = item;

      if (!disableInput) {
        dragItem.addEventListener("dragstart", (e) => {
          dragItem.classList.add("dragging");
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", item);
        });

        dragItem.addEventListener("dragend", () => {
          dragItem.classList.remove("dragging");
        });
      }

      dragItems.appendChild(dragItem);
    });

    const dropZone = document.createElement("div");
    dropZone.className = "drop-zone";
    dropZone.id = "dropZone";

    if (savedAnswer && Array.isArray(savedAnswer)) {
      savedAnswer.forEach((item) => {
        const dragItem = document.createElement("div");
        dragItem.className = "drag-item";
        dragItem.textContent = item;
        dragItem.draggable = !disableInput;
        dragItem.dataset.item = item;

        if (!disableInput) {
          dragItem.addEventListener("dragstart", (e) => {
            dragItem.classList.add("dragging");
            e.dataTransfer.setData("text/plain", item);
          });

          dragItem.addEventListener("dragend", () => {
            dragItem.classList.remove("dragging");
          });
        }

        dropZone.appendChild(dragItem);
      });
      dragItems.innerHTML = "";
    }

    if (!disableInput) {
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
      });

      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drag-over");
      });

      dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");

        const draggingElement = document.querySelector(".dragging");
        if (draggingElement) {
          dropZone.appendChild(draggingElement);
          updateDragDropAnswer();
        }
      });

      dragItems.addEventListener("dragover", (e) => {
        e.preventDefault();
      });

      dragItems.addEventListener("drop", (e) => {
        e.preventDefault();
        const draggingElement = document.querySelector(".dragging");
        if (draggingElement && draggingElement.parentElement.id === "dropZone") {
          dragItems.appendChild(draggingElement);
          updateDragDropAnswer();
        }
      });
    }

    function updateDragDropAnswer() {
      const droppedItems = Array.from(dropZone.children).map((el) => el.dataset.item);
      answers[currentIndex] = droppedItems;
      if (droppedItems.length > 0) {
        showAnswerNote();
      }
    }

    dragDropDiv.appendChild(dragItems);
    dragDropDiv.appendChild(dropZone);
    optionsContainer.appendChild(dragDropDiv);
  } else if (q.type === "dropdown") {
    const dropdownDiv = document.createElement("div");
    dropdownDiv.className = "dropdown-container";

    const select = document.createElement("select");
    select.className = "dropdown-select";
    select.id = "dropdownSelect";
    select.disabled = disableInput;

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "اختر الإجابة الصحيحة";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    (q.options || []).forEach((option, index) => {
      const optionElement = document.createElement("option");
      optionElement.value = index;
      optionElement.textContent = option;
      select.appendChild(optionElement);
    });

    const savedAnswer = answers[currentIndex];
    if (savedAnswer !== null && savedAnswer !== undefined) {
      select.value = savedAnswer;
      select.classList.add("answered");
    }

    if (!disableInput) {
      select.addEventListener("change", () => {
        answers[currentIndex] = parseInt(select.value, 10);
        select.classList.add("answered");
        showAnswerNote();
      });
    }

    dropdownDiv.appendChild(select);
    optionsContainer.appendChild(dropdownDiv);
  } else if (q.type === "click_drag") {
    const clickDragDiv = document.createElement("div");
    clickDragDiv.className = "click-drag-container";

    const sliderContainer = document.createElement("div");
    sliderContainer.className = "slider-container";

    const instruction = document.createElement("p");
    instruction.textContent = "اسحب المؤشر لاختيار الإجابة الصحيحة";
    instruction.style.marginBottom = "20px";
    instruction.style.fontWeight = "600";

    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "slider";
    slider.min = q.range?.[0] ?? 0;
    slider.max = q.range?.[1] ?? 10;
    slider.value = q.range?.[0] ?? 0;
    slider.id = "clickDragSlider";
    slider.disabled = disableInput;

    const valueDisplay = document.createElement("div");
    valueDisplay.className = "slider-value";
    valueDisplay.textContent = `القيمة المختارة: ${slider.value}`;

    const labels = document.createElement("div");
    labels.className = "slider-labels";
    labels.innerHTML = `<span>${slider.min}</span><span>${slider.max}</span>`;

    const savedAnswer = answers[currentIndex];
    if (savedAnswer !== null && savedAnswer !== undefined) {
      slider.value = savedAnswer;
      valueDisplay.textContent = `القيمة المختارة: ${savedAnswer}`;
    }

    if (!disableInput) {
      slider.addEventListener("input", () => {
        valueDisplay.textContent = `القيمة المختارة: ${slider.value}`;
        answers[currentIndex] = parseInt(slider.value, 10);
        showAnswerNote();
      });
    }

    sliderContainer.appendChild(instruction);
    sliderContainer.appendChild(valueDisplay);
    sliderContainer.appendChild(slider);
    sliderContainer.appendChild(labels);
    clickDragDiv.appendChild(sliderContainer);
    optionsContainer.appendChild(clickDragDiv);
  } else if (q.type === "essay") {
    const essayDiv = document.createElement("div");
    essayDiv.className = "essay-container";

    const instructions = document.createElement("div");
    instructions.className = "essay-instructions";
    instructions.innerHTML = `
      <strong>تعليمات:</strong><br>
      • اكتب إجابتك بوضوح ودقة<br>
      • لا يوجد حد أدنى أو أقصى لعدد الكلمات<br>
      • ركز على المحتوى والمعنى
    `;

    const textarea = document.createElement("textarea");
    textarea.className = "essay-textarea";
    textarea.placeholder = "اكتب إجابتك هنا...";
    textarea.id = "essayTextarea";
    textarea.disabled = disableInput;

    const wordCount = document.createElement("div");
    wordCount.className = "word-count";
    wordCount.textContent = "عدد الكلمات: 0";

    const savedAnswer = answers[currentIndex];
    if (savedAnswer && typeof savedAnswer === "string") {
      textarea.value = savedAnswer;
      textarea.classList.add("answered");
      updateWordCount();
    }

    function updateWordCount() {
      const text = textarea.value.trim();
      const words = text ? text.split(/\s+/).length : 0;
      wordCount.textContent = `عدد الكلمات: ${words}`;
      wordCount.className = "word-count valid";
    }

    if (!disableInput) {
      textarea.addEventListener("input", () => {
        answers[currentIndex] = textarea.value;
        updateWordCount();
        if (textarea.value.trim()) {
          textarea.classList.add("answered");
          showAnswerNote();
        } else {
          textarea.classList.remove("answered");
        }
      });
    }

    essayDiv.appendChild(instructions);
    essayDiv.appendChild(textarea);
    essayDiv.appendChild(wordCount);
    optionsContainer.appendChild(essayDiv);
  } else if (q.type === "matching") {
    const matchingDiv = document.createElement("div");
    matchingDiv.className = "matching-container";

    const instruction = document.createElement("p");
    instruction.textContent =
      "انقر على عنصر من العمود الأيسر ثم على العنصر المطابق له من العمود الأيمن";
    instruction.style.marginBottom = "20px";
    instruction.style.fontWeight = "600";
    instruction.style.textAlign = "center";

    const columnsDiv = document.createElement("div");
    columnsDiv.className = "matching-columns";
    columnsDiv.style.position = "relative";

    const leftColumn = document.createElement("div");
    leftColumn.className = "matching-column";
    leftColumn.innerHTML = "<h4>العمود الأول</h4>";

    const rightColumn = document.createElement("div");
    rightColumn.className = "matching-column";
    rightColumn.innerHTML = "<h4>العمود الثاني</h4>";

    let selectedLeft = null;
    let matches = {};
    const savedAnswer = answers[currentIndex];
    if (savedAnswer && typeof savedAnswer === "object") {
      matches = { ...savedAnswer };
    }

    const colorListLight = [
      "#b2e0ff",
      "#ffe6b3",
      "#d1ffd6",
      "#ffd6e0",
      "#e6d6ff",
      "#fff7b2",
      "#b2fff7",
      "#ffb2e0",
      "#c6ffb2",
      "#b2d6ff",
      "#ffd6b2",
      "#b2ffd6",
      "#ffb2b2",
      "#e0b2ff",
      "#b2ffe0",
      "#b2b2ff",
    ];
    const colorListDark = [
      "#2e4252",
      "#665c2e",
      "#2e523e",
      "#522e3a",
      "#3a2e52",
      "#52492e",
      "#2e5249",
      "#522e4a",
      "#3a522e",
      "#2e3a52",
      "#52422e",
      "#2e5242",
      "#522e2e",
      "#4a2e52",
      "#2e524a",
      "#2e2e52",
    ];
    const getThemeColorList = () => {
      const body = document.body;
      if (body.classList.contains("dark-mode") || body.classList.contains("dark-theme")) {
        return colorListDark;
      }
      return colorListLight;
    };
    let colorList = getThemeColorList();
    const observer = new MutationObserver(() => {
      colorList = getThemeColorList();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

    const pairColors = {};
    let colorIdx = 0;

    (q.leftColumn || []).forEach((item) => {
      const leftItem = document.createElement("div");
      leftItem.className = "matching-item";
      leftItem.textContent = item;
      leftItem.dataset.item = item;
      leftItem.dataset.side = "left";

      if (matches[item]) {
        if (!pairColors[item]) {
          pairColors[item] = colorList[colorIdx % colorList.length];
          colorIdx += 1;
        }
        leftItem.style.background = pairColors[item];
        leftItem.classList.add("matched");
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "✖";
        cancelBtn.title = "إلغاء التوصيلة";
        cancelBtn.className = "matching-cancel-btn";
        cancelBtn.onclick = (e) => {
          e.stopPropagation();
          const matchedRight = matches[item];
          delete matches[item];
          answers[currentIndex] = { ...matches };
          leftItem.classList.remove("matched");
          leftItem.style.background = "";
          const rightEl = rightColumn.querySelector(`[data-item="${matchedRight}"]`);
          if (rightEl) {
            rightEl.classList.remove("matched");
            rightEl.style.background = "";
            const btn = rightEl.querySelector(".matching-cancel-btn");
            if (btn) rightEl.removeChild(btn);
          }
          if (leftItem.querySelector(".matching-cancel-btn")) leftItem.removeChild(cancelBtn);
        };
        leftItem.appendChild(cancelBtn);
      }

      if (!disableInput) {
        leftItem.addEventListener("click", () => {
          if (matches[item]) {
            document
              .querySelectorAll(".matching-item")
              .forEach((el) => el.classList.remove("matching-highlight"));
            leftItem.classList.add("matching-highlight");
            const matchedRight = matches[item];
            const rightEl = rightColumn.querySelector(`[data-item="${matchedRight}"]`);
            if (rightEl) rightEl.classList.add("matching-highlight");
            setTimeout(() => {
              leftItem.classList.remove("matching-highlight");
              if (rightEl) rightEl.classList.remove("matching-highlight");
            }, 900);
            return;
          }
          document
            .querySelectorAll('.matching-item[data-side="left"]')
            .forEach((el) => el.classList.remove("selected"));
          leftItem.classList.add("selected");
          selectedLeft = item;
        });
      }

      leftColumn.appendChild(leftItem);
    });

    (q.rightColumn || []).forEach((item) => {
      const rightItem = document.createElement("div");
      rightItem.className = "matching-item";
      rightItem.textContent = item;
      rightItem.dataset.item = item;
      rightItem.dataset.side = "right";

      const leftKey = Object.keys(matches).find((key) => matches[key] === item);
      if (leftKey) {
        if (!pairColors[leftKey]) {
          pairColors[leftKey] = colorList[colorIdx % colorList.length];
          colorIdx += 1;
        }
        rightItem.style.background = pairColors[leftKey];
        rightItem.classList.add("matched");
        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "✖";
        cancelBtn.title = "إلغاء التوصيلة";
        cancelBtn.className = "matching-cancel-btn";
        cancelBtn.onclick = (e) => {
          e.stopPropagation();
          delete matches[leftKey];
          answers[currentIndex] = { ...matches };
          rightItem.classList.remove("matched");
          rightItem.style.background = "";
          const leftEl = leftColumn.querySelector(`[data-item="${leftKey}"]`);
          if (leftEl) {
            leftEl.classList.remove("matched");
            leftEl.style.background = "";
            const btn = leftEl.querySelector(".matching-cancel-btn");
            if (btn) leftEl.removeChild(btn);
          }
          if (rightItem.querySelector(".matching-cancel-btn")) rightItem.removeChild(cancelBtn);
        };
        rightItem.appendChild(cancelBtn);
      }

      if (!disableInput) {
        rightItem.addEventListener("click", () => {
          const currentLeftKey = Object.keys(matches).find((key) => matches[key] === item);
          if (currentLeftKey) {
            document
              .querySelectorAll(".matching-item")
              .forEach((el) => el.classList.remove("matching-highlight"));
            rightItem.classList.add("matching-highlight");
            const leftEl = leftColumn.querySelector(`[data-item="${currentLeftKey}"]`);
            if (leftEl) leftEl.classList.add("matching-highlight");
            setTimeout(() => {
              rightItem.classList.remove("matching-highlight");
              if (leftEl) leftEl.classList.remove("matching-highlight");
            }, 900);
            return;
          }
          if (!selectedLeft) return;
          const alreadyMatchedLeft = Object.keys(matches).find(
            (key) => matches[key] === item
          );
          if (alreadyMatchedLeft) {
            delete matches[alreadyMatchedLeft];
            const leftEl = leftColumn.querySelector(`[data-item="${alreadyMatchedLeft}"]`);
            if (leftEl) {
              leftEl.classList.remove("matched");
              leftEl.style.background = "";
              const btn = leftEl.querySelector(".matching-cancel-btn");
              if (btn) leftEl.removeChild(btn);
            }
          }
          matches[selectedLeft] = item;
          answers[currentIndex] = { ...matches };
          const leftEl = leftColumn.querySelector(`[data-item="${selectedLeft}"]`);
          if (leftEl) {
            leftEl.classList.add("matched");
            leftEl.classList.remove("selected");
            if (!pairColors[selectedLeft]) {
              pairColors[selectedLeft] = colorList[colorIdx % colorList.length];
              colorIdx += 1;
            }
            leftEl.style.background = pairColors[selectedLeft];
            if (!leftEl.querySelector(".matching-cancel-btn")) {
              const cancelBtn = document.createElement("button");
              cancelBtn.textContent = "✖";
              cancelBtn.title = "إلغاء التوصيلة";
              cancelBtn.className = "matching-cancel-btn";
              cancelBtn.onclick = (e) => {
                e.stopPropagation();
                const lKey = leftEl.dataset.item;
                const rKey = matches[lKey];
                if (rKey) {
                  delete matches[lKey];
                  answers[currentIndex] = { ...matches };
                }
                leftEl.classList.remove("matched");
                leftEl.style.background = "";
                if (rKey) {
                  const rightEl = rightColumn.querySelector(`[data-item="${rKey}"]`);
                  if (rightEl) {
                    rightEl.classList.remove("matched");
                    rightEl.style.background = "";
                    const btn = rightEl.querySelector(".matching-cancel-btn");
                    if (btn) rightEl.removeChild(btn);
                  }
                }
                if (leftEl.querySelector(".matching-cancel-btn")) leftEl.removeChild(cancelBtn);
              };
              leftEl.appendChild(cancelBtn);
            }
          }
          rightItem.classList.add("matched");
          rightItem.style.background = pairColors[selectedLeft];
          if (!rightItem.querySelector(".matching-cancel-btn")) {
            const cancelBtn = document.createElement("button");
            cancelBtn.textContent = "✖";
            cancelBtn.title = "إلغاء التوصيلة";
            cancelBtn.className = "matching-cancel-btn";
            cancelBtn.onclick = (e) => {
              e.stopPropagation();
              const rKey = rightItem.dataset.item;
              const lKey = Object.keys(matches).find((k) => matches[k] === rKey);
              if (lKey) {
                delete matches[lKey];
                answers[currentIndex] = { ...matches };
              }
              rightItem.classList.remove("matched");
              rightItem.style.background = "";
              if (lKey) {
                const leftEl = leftColumn.querySelector(`[data-item="${lKey}"]`);
                if (leftEl) {
                  leftEl.classList.remove("matched");
                  leftEl.style.background = "";
                  const btn = leftEl.querySelector(".matching-cancel-btn");
                  if (btn) leftEl.removeChild(btn);
                }
              }
              if (rightItem.querySelector(".matching-cancel-btn")) rightItem.removeChild(cancelBtn);
            };
            rightItem.appendChild(cancelBtn);
          }
          selectedLeft = null;
          showAnswerNote();
        });
      }

      rightColumn.appendChild(rightItem);
    });

    columnsDiv.appendChild(leftColumn);
    columnsDiv.appendChild(rightColumn);

    matchingDiv.appendChild(instruction);
    matchingDiv.appendChild(columnsDiv);
    optionsContainer.appendChild(matchingDiv);
  } else if (q.type === "ordering") {
    const orderingDiv = document.createElement("div");
    orderingDiv.className = "ordering-container";

    const instruction = document.createElement("p");
    instruction.textContent = "اسحب العناصر لترتيبها بالتسلسل الصحيح";
    instruction.style.marginBottom = "20px";
    instruction.style.fontWeight = "600";
    instruction.style.textAlign = "center";

    const itemsContainer = document.createElement("div");
    itemsContainer.className = "ordering-items";

    const pinnedItem = Array.isArray(q.correctOrder) && q.correctOrder.length > 0
      ? q.correctOrder[0]
      : null;

    const savedAnswer = answers[currentIndex];
    let itemsToShow;

    if (savedAnswer && Array.isArray(savedAnswer)) {
      const sanitizedAnswer = pinnedItem
        ? savedAnswer.filter((item) => item !== pinnedItem)
        : [...savedAnswer];
      itemsToShow = pinnedItem ? [pinnedItem, ...sanitizedAnswer] : sanitizedAnswer;
    } else {
      const shuffledItems = (q.items || []).slice().sort(() => Math.random() - 0.5);
      if (pinnedItem) {
        const withoutPinned = shuffledItems.filter((item) => item !== pinnedItem);
        itemsToShow = [pinnedItem, ...withoutPinned];
      } else {
        itemsToShow = shuffledItems;
      }
    }

    const updateOrderingNumbers = () => {
      const items = itemsContainer.querySelectorAll(".ordering-item");
      items.forEach((item, index) => {
        const numberSpan = item.querySelector(".ordering-number");
        numberSpan.textContent = index + 1;
      });
    };

    itemsToShow.forEach((item, index) => {
      const orderingItem = document.createElement("div");
      orderingItem.className = "ordering-item";
      orderingItem.dataset.item = item;

      const isPinned = pinnedItem && item === pinnedItem;
      if (!isPinned) {
        orderingItem.draggable = !disableInput;
      } else {
        orderingItem.classList.add("fixed-ordering-item");
        orderingItem.draggable = false;
      }

      const itemText = document.createElement("span");
      itemText.textContent = item;

      const numberSpan = document.createElement("span");
      numberSpan.className = "ordering-number";
      numberSpan.textContent = index + 1;

      orderingItem.appendChild(itemText);
      orderingItem.appendChild(numberSpan);

      if (!disableInput && !isPinned) {
        orderingItem.addEventListener("dragstart", (e) => {
          orderingItem.classList.add("dragging");
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", item);
        });

        orderingItem.addEventListener("dragend", () => {
          orderingItem.classList.remove("dragging");
        });
      }

      itemsContainer.appendChild(orderingItem);
    });

    if (!disableInput) {
      itemsContainer.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragging = document.querySelector(".ordering-item.dragging");
        if (!dragging) return;
        const afterElement = getDragAfterElement(itemsContainer, e.clientY);
        const fixedElement = itemsContainer.querySelector(".fixed-ordering-item");
        let targetElement = afterElement;

        if (fixedElement && targetElement === fixedElement) {
          targetElement = fixedElement.nextElementSibling;
        }

        if (targetElement == null) {
          itemsContainer.appendChild(dragging);
        } else {
          itemsContainer.insertBefore(dragging, targetElement);
        }

        updateOrderingNumbers();
        updateOrderingAnswer();
      });
    }

    function getDragAfterElement(container, y) {
      const draggableElements = [
        ...container.querySelectorAll(".ordering-item:not(.dragging)"),
      ];

      return draggableElements.reduce(
        (closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height / 2;

          if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
          }
          return closest;
        },
        { offset: Number.NEGATIVE_INFINITY }
      ).element;
    }

    function updateOrderingAnswer() {
      const orderedItems = Array.from(itemsContainer.children).map(
        (el) => el.dataset.item
      );
      if (pinnedItem) {
        const filtered = orderedItems.filter((item) => item !== pinnedItem);
        answers[currentIndex] = [pinnedItem, ...filtered];
      } else {
        answers[currentIndex] = orderedItems;
      }
      showAnswerNote();
    }

    updateOrderingNumbers();

    orderingDiv.appendChild(instruction);
    orderingDiv.appendChild(itemsContainer);
    optionsContainer.appendChild(orderingDiv);
  } else if (q.type === "multiple_select") {
    const multiSelectDiv = document.createElement("div");
    multiSelectDiv.className = "multiple-select-container";

    const instructions = document.createElement("div");
    instructions.className = "multiple-select-instructions";
    instructions.textContent = "اختر كل ما ينطبق";

    const savedAnswer = answers[currentIndex];
    let selectedOptions = [];
    if (savedAnswer && Array.isArray(savedAnswer)) {
      selectedOptions = [...savedAnswer];
    }

    (q.options || []).forEach((option, index) => {
      const optionDiv = document.createElement("div");
      optionDiv.className = "multiple-select-option";

      if (selectedOptions.includes(index)) {
        optionDiv.classList.add("selected");
      }

      const checkbox = document.createElement("div");
      checkbox.className = "multiple-select-checkbox";
      if (selectedOptions.includes(index)) {
        checkbox.textContent = "✓";
      }

      const text = document.createElement("span");
      text.textContent = option;

      optionDiv.appendChild(checkbox);
      optionDiv.appendChild(text);

      if (!disableInput) {
        optionDiv.addEventListener("click", () => {
          const isSelected = optionDiv.classList.contains("selected");

          if (isSelected) {
            optionDiv.classList.remove("selected");
            checkbox.textContent = "";
            selectedOptions = selectedOptions.filter((i) => i !== index);
          } else {
            optionDiv.classList.add("selected");
            checkbox.textContent = "✓";
            selectedOptions = [...selectedOptions, index];
          }

          answers[currentIndex] = selectedOptions;
          if (selectedOptions.length > 0) {
            showAnswerNote();
          }
        });
      }

      multiSelectDiv.appendChild(optionDiv);
    });

    optionsContainer.appendChild(instructions);
    optionsContainer.appendChild(multiSelectDiv);
  } else {
    const note = document.createElement("div");
    note.className = "info-card";
    note.textContent = "نوع السؤال غير مدعوم.";
    optionsContainer.appendChild(note);
  }
}

function renderQuestion() {
  const q = questions[currentIndex];
  if (!questionText || !questionNumber) return;

  if (!q) {
    questionText.textContent = "لا توجد أسئلة متاحة لهذا الاختبار.";
    questionNumber.textContent = "";
    optionsContainer.innerHTML = "";
    renderQuestionNav();
    return;
  }

  questionText.textContent = q.q || "سؤال بلا نص";
  questionNumber.textContent = `السؤال ${currentIndex + 1}`;

  const existingBadge = questionNumber.querySelector(".question-level-badge");
  if (existingBadge) {
    existingBadge.remove();
  }

  if (q.level) {
    const levelBadge = document.createElement("span");
    levelBadge.className = "question-level-badge";
    levelBadge.style.cssText = `
      display: inline-block;
      background: #e3f2fd;
      color: #1565c0;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
      margin-right: 10px;
      border: 1px solid #bbdefb;
    `;
    levelBadge.textContent = `مستوى: ${q.level}`;
    questionNumber.appendChild(levelBadge);
  }

  if (answerNote) {
    answerNote.style.display = "none";
  }

  renderOptions(q);
  renderQuestionNav();
}

function startTimerIfNeeded() {
  if (mode === "preview" || !Number.isFinite(remainingSeconds)) {
    if (timerDisplay) timerDisplay.textContent = mode === "preview" ? "غير مفعّل" : "—";
    return;
  }

  const tick = () => {
    remainingSeconds = Math.max(remainingSeconds - 1, 0);
    if (timerDisplay) timerDisplay.textContent = formatSeconds(remainingSeconds);
    if (remainingSeconds <= 0 && timerId) {
      clearInterval(timerId);
      timerId = null;
      if (submitExamBtn && !submitExamBtn.disabled) {
        submitExamBtn.click();
      }
    }
  };

  if (timerDisplay) timerDisplay.textContent = formatSeconds(remainingSeconds);
  timerId = setInterval(tick, 1000);
}

function checkAnswer(q, ans) {
  if (ans === null || ans === undefined) return false;
  
  if (["multiple_choice", "dropdown"].includes(q.type)) {
    return Number(ans) === Number(q.correct);
  }
  
  if (q.type === "multiple_select") {
    if (!Array.isArray(ans) || !Array.isArray(q.correct)) return false;
    const sortedAns = [...ans].map(Number).sort((a, b) => a - b);
    const sortedCorr = [...q.correct].map(Number).sort((a, b) => a - b);
    return JSON.stringify(sortedAns) === JSON.stringify(sortedCorr);
  }
  
  if (q.type === "click_drag") {
    return Number(ans) === Number(q.correct);
  }

  if (q.type === "drag_drop") {
    if (!Array.isArray(ans) || !Array.isArray(q.correctOrder)) return false;
    return JSON.stringify(ans) === JSON.stringify(q.correctOrder);
  }

  if (q.type === "ordering") {
    // Exact order match
    if (!Array.isArray(ans) || !Array.isArray(q.correctOrder)) return false;
    return JSON.stringify(ans) === JSON.stringify(q.correctOrder);
  }

  if (q.type === "matching") {
    // Exact matches object
    if (typeof ans !== "object" || typeof q.correctMatches !== "object") return false;
    // Compare key-values
    const keys = Object.keys(q.correctMatches);
    if (Object.keys(ans).length !== keys.length) return false;
    for (const k of keys) {
        if (ans[k] !== q.correctMatches[k]) return false;
    }
    return true;
  }

  // Essay is manual grading -> always false here (or 'needs review')
  return false; 
}

async function submitExam(user) {
  if (mode === "preview") return;
  
  // Stop timer
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }

  showStatus("جاري تصحيح وإرسال الإجابات...");
  submitExamBtn.disabled = true;
  submitExamBtn.textContent = "جاري الإرسال...";

  // Calculate Score
  let correctCount = 0;
  let incorrectCount = 0;
  
  questions.forEach((q, idx) => {
    // Skip essay for auto-grade count, specific logic needed
    if (q.type === "essay") {
       // Essay is not auto-graded here
       return;
    }
    
    const isCorrect = checkAnswer(q, answers[idx]);
    if (isCorrect) correctCount++;
    else incorrectCount++;
  });

  const totalAutoGradable = questions.filter(q => q.type !== "essay").length;
  const scorePercentage = totalAutoGradable > 0 
    ? Math.round((correctCount / totalAutoGradable) * 100) 
    : 0;
    
  // Time spent
  const timeSpent = (examData.duration ? examData.duration * 60 : 0) - (remainingSeconds || 0);

  try {
    const payload = {
      user_id: user.uid || user.id,
      exam_id: examData.id,
      subject: examData.subject,
      level: examData.title, // using title as level descriptor roughly
      score_percentage: scorePercentage,
      correct_count: correctCount,
      incorrect_count: incorrectCount,
      time_spent_seconds: Math.max(timeSpent, 0),
      answers: answers,
      student_name: user.full_name || user.email
    };

    const { error } = await supabase.from("attempts").insert(payload);

    if (error) throw error;

    showStatus(`تم إنهاء الاختبار! درجتك التقريبية: ${scorePercentage}%`, "success");
    setTimeout(() => {
        window.location.href = "student.html#resultsTableBody";
    }, 2000);

  } catch (err) {
    console.error(err);
    showStatus("حدث خطأ أثناء حفظ النتيجة. يرجى المحاولة مرة أخرى.", "error");
    submitExamBtn.disabled = false;
    submitExamBtn.textContent = "إعادة المحاولة";
  }
}

function bindNavigation(user) {
  if (prevQuestionBtn) {
    prevQuestionBtn.addEventListener("click", () => {
      if (currentIndex > 0) {
        currentIndex--;
        renderQuestion();
      }
    });
  }
  if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener("click", () => {
      if (currentIndex < questions.length - 1) {
        currentIndex++;
        renderQuestion();
      }
    });
  }
  if (submitExamBtn) {
    submitExamBtn.addEventListener("click", () => {
        if (confirm("هل أنت متأكد من إنهاء الاختبار وتسليم الإجابة؟")) {
            submitExam(user);
        }
    });
  }
}

async function loadExam(examId, user) {
  showStatus("جاري تحميل تفاصيل الاختبار...");
  const { data, error } = await supabase
    .from("exams")
    .select("id, title, subject, duration, visibility, created_at, questions, passage, engine")
    .eq("id", examId)
    .single();

  if (error || !data) {
    console.error(error);
    showStatus("تعذر تحميل الاختبار.", "error");
    return;
  }

  examData = { ...data, engine: normalizeEngine(data.engine) };
  questions = parseQuestions(examData.questions);
  answers = new Array(questions.length).fill(null);
  remainingSeconds = Number.isFinite(examData.duration) ? examData.duration * 60 : null;

  hideStatus();
  fillExam(examData);
  renderActions(examData, user);

  if (examData.engine !== "teacher") {
    if (examContainer) examContainer.classList.add("hidden");
    showStatus("هذا الاختبار مخصص لمحرك النظام ولا يمكن تشغيله هنا.", "error");
    return;
  }

  if (examContainer) examContainer.classList.remove("hidden");
  updateModeUI();
  bindNavigation(user);
  renderQuestion();
  startTimerIfNeeded();
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const user = await checkAuth({ protected: true });
    if (!user) return;

    const params = new URLSearchParams(window.location.search);
    const examId = params.get("exam_id");
    mode = params.get("mode") === "preview" ? "preview" : "run";

    if (!examId) {
      showStatus("معرّف الاختبار مفقود في الرابط.", "error");
      return;
    }

    await loadExam(examId, user);
  } catch (err) {
    console.error(err);
    showStatus("حدث خطأ غير متوقع.", "error");
  }
});
