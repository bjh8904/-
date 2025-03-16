const todoInput = document.getElementById("todo-input");
const todoCategory = document.getElementById("todo-category");
const todoPriority = document.getElementById("todo-priority");
const todoDeadline = document.getElementById("todo-deadline");
const todoList = document.getElementById("todo-list");
const searchInput = document.getElementById("search-input");
const darkModeToggle = document.getElementById("dark-mode-toggle");
const manualOrderToggle = document.getElementById("manual-order-toggle");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importFileInput = document.getElementById("import-file");

// 모달 관련 변수
const editModal = document.getElementById("edit-modal");
const editTaskInput = document.getElementById("edit-task");
const editCategorySelect = document.getElementById("edit-category");
const editPrioritySelect = document.getElementById("edit-priority");
const editDeadlineInput = document.getElementById("edit-deadline");
const saveEditModalBtn = document.getElementById("save-edit-modal");
const cancelEditModalBtn = document.getElementById("cancel-edit-modal");

let currentEditTodo = null;
let manualOrderMode = false; // 수동 순서 모드 여부

// 우선순위 정렬 매핑 (숫자가 낮을수록 높은 우선순위)
const priorityOrder = {
  높음: 1,
  중간: 2,
  낮음: 3,
  "": 4,
};

document.addEventListener("DOMContentLoaded", () => {
  renderTodos();
  searchInput.addEventListener("keyup", renderTodos);
});

// 다크 모드 토글 이벤트
darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  darkModeToggle.textContent = document.body.classList.contains("dark-mode")
    ? "라이트 모드"
    : "다크 모드";
});

// 수동 순서 모드 토글 이벤트
manualOrderToggle.addEventListener("click", () => {
  manualOrderMode = !manualOrderMode;
  manualOrderToggle.textContent = manualOrderMode ? "자동 정렬" : "수동 순서";
  renderTodos();
});

// 데이터 내보내기: localStorage의 todos를 JSON 파일로 다운로드
exportBtn.addEventListener("click", () => {
  const todos = localStorage.getItem("todos") || "[]";
  const blob = new Blob([todos], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "todos_backup.json";
  a.click();
  URL.revokeObjectURL(url);
});

// 데이터 복원: 파일 선택 시 JSON 파일 읽어와 localStorage 업데이트
importBtn.addEventListener("click", () => {
  importFileInput.click();
});

importFileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      localStorage.setItem("todos", JSON.stringify(data));
      renderTodos();
      alert("데이터가 성공적으로 복원되었습니다.");
    } catch (err) {
      alert("파일 형식이 올바르지 않습니다.");
    }
  };
  reader.readAsText(file);
});

// 할 일 추가
function addTodo() {
  const task = todoInput.value.trim();
  const category = todoCategory.value;
  let priority = todoPriority.value;
  const rawDeadline = todoDeadline.value.trim();

  if (!task) {
    alert("할 일을 입력해 주세요.");
    todoInput.focus();
    return;
  }
  if (!rawDeadline) {
    alert("마감일을 입력해 주세요.");
    todoDeadline.focus();
    return;
  }
  if (!priority) {
    priority = "중간";
  }
  if (/^\d{8}$/.test(rawDeadline)) {
    const year = rawDeadline.substring(0, 4);
    const month = rawDeadline.substring(4, 6);
    const day = rawDeadline.substring(6, 8);
    var formattedDeadline = `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
  } else {
    alert("마감일 형식이 올바르지 않습니다. YYYYMMDD 형식으로 입력해 주세요.");
    todoDeadline.focus();
    return;
  }

  const todoObj = {
    id: Date.now(),
    task: task,
    category: category,
    priority: priority,
    deadline: formattedDeadline,
    deadlineRaw: rawDeadline,
    completed: false,
  };

  saveTodo(todoObj);
  renderTodos();

  // 입력 필드 초기화
  todoInput.value = "";
  todoCategory.value = "";
  todoPriority.value = "";
  todoDeadline.value = "";
  todoInput.focus();
}

// 카테고리별 색상 클래스 반환 함수
function getCategoryClass(category) {
  if (category === "집안일") return "category-house";
  if (category === "회사일") return "category-work";
  if (category === "개인일") return "category-personal";
  return "";
}

// 우선순위별 클래스 반환 함수
function getPriorityClass(priority) {
  if (priority === "높음") return "priority-high";
  if (priority === "중간") return "priority-medium";
  if (priority === "낮음") return "priority-low";
  return "";
}

// 할 일 요소 생성
function createTodoElement(todoObj) {
  const li = document.createElement("li");
  li.setAttribute("data-id", todoObj.id);
  li.setAttribute("data-deadlineRaw", todoObj.deadlineRaw);

  // 수동 순서 모드일 때 드래그 가능하도록 설정
  if (manualOrderMode) {
    li.setAttribute("draggable", "true");
    li.addEventListener("dragstart", handleDragStart);
    li.addEventListener("dragover", handleDragOver);
    li.addEventListener("drop", handleDrop);
    li.addEventListener("dragend", handleDragEnd);
  }

  const categoryClass = getCategoryClass(todoObj.category);
  const categoryHTML = todoObj.category
    ? `<span class="category ${categoryClass}">카테고리: ${todoObj.category}</span>`
    : "";
  const priorityClass = getPriorityClass(todoObj.priority);
  const priorityHTML = `<span class="priority ${priorityClass}">우선순위: ${todoObj.priority}</span>`;

  li.innerHTML = `
    <input type="checkbox" class="complete">
    <span>${todoObj.task}</span>
    ${categoryHTML}
    ${priorityHTML}
    <span class="deadline">마감일: ${todoObj.deadline}</span>
    <div class="buttons">
      <button class="edit">수정</button>
      <button class="delete">삭제</button>
    </div>
  `;

  const checkbox = li.querySelector(".complete");
  checkbox.checked = todoObj.completed;
  updateCompletedStyle(li, todoObj.completed);

  checkbox.addEventListener("change", () => {
    todoObj.completed = checkbox.checked;
    updateTodoInStorage(todoObj);
  });

  li.querySelector(".edit").addEventListener("click", () =>
    showEditModal(todoObj)
  );
  li.querySelector(".delete").addEventListener("click", () =>
    deleteTodo(todoObj)
  );

  return li;
}

function updateCompletedStyle(li, completed) {
  li.querySelector("span").classList.toggle("completed", completed);
}

// 드래그 앤 드롭 이벤트 핸들러
let dragSrcEl = null;
function handleDragStart(e) {
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/html", this.outerHTML);
  this.classList.add("dragging");
}
function handleDragOver(e) {
  if (e.preventDefault) e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  return false;
}
function handleDrop(e) {
  if (e.stopPropagation) e.stopPropagation();
  if (dragSrcEl !== this) {
    const srcId = dragSrcEl.getAttribute("data-id");
    const targetId = this.getAttribute("data-id");
    let todos = JSON.parse(localStorage.getItem("todos")) || [];
    const srcIndex = todos.findIndex((todo) => todo.id == srcId);
    const targetIndex = todos.findIndex((todo) => todo.id == targetId);
    if (srcIndex > -1 && targetIndex > -1) {
      const draggedItem = todos.splice(srcIndex, 1)[0];
      todos.splice(targetIndex, 0, draggedItem);
      localStorage.setItem("todos", JSON.stringify(todos));
      renderTodos();
    }
  }
  return false;
}
function handleDragEnd(e) {
  this.classList.remove("dragging");
}

// 모달 창 표시 (수정)
function showEditModal(todoObj) {
  currentEditTodo = todoObj;
  editTaskInput.value = todoObj.task;
  editCategorySelect.value = todoObj.category;
  editPrioritySelect.value = todoObj.priority;
  editDeadlineInput.value = todoObj.deadlineRaw;
  editModal.style.display = "flex";
}

// 모달 저장 (마우스 클릭 또는 Enter)
function saveEdit() {
  const newTask = editTaskInput.value.trim();
  const newCategory = editCategorySelect.value;
  const newPriority = editPrioritySelect.value;
  const newDeadlineRaw = editDeadlineInput.value.trim();

  if (!newTask) {
    alert("할 일을 입력해 주세요.");
    return;
  }
  if (!newDeadlineRaw) {
    alert("마감일을 입력해 주세요.");
    return;
  }
  if (!/^\d{8}$/.test(newDeadlineRaw)) {
    alert("마감일 형식이 올바르지 않습니다. YYYYMMDD 형식으로 입력해 주세요.");
    return;
  }
  const year = newDeadlineRaw.substring(0, 4);
  const month = newDeadlineRaw.substring(4, 6);
  const day = newDeadlineRaw.substring(6, 8);
  const newDeadlineFormatted = `${year}년 ${parseInt(month)}월 ${parseInt(
    day
  )}일`;

  currentEditTodo.task = newTask;
  currentEditTodo.category = newCategory;
  currentEditTodo.priority = newPriority;
  currentEditTodo.deadlineRaw = newDeadlineRaw;
  currentEditTodo.deadline = newDeadlineFormatted;

  updateTodoInStorage(currentEditTodo);
  hideEditModal();
}

saveEditModalBtn.addEventListener("click", saveEdit);
cancelEditModalBtn.addEventListener("click", hideEditModal);

// 모달 창 내 Enter 키 저장
document.querySelector(".modal-content").addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    saveEditModalBtn.click();
  }
});

function hideEditModal() {
  editModal.style.display = "none";
  currentEditTodo = null;
}

function deleteTodo(todoObj) {
  const todos = JSON.parse(localStorage.getItem("todos")) || [];
  const updatedTodos = todos.filter((todo) => todo.id !== todoObj.id);
  localStorage.setItem("todos", JSON.stringify(updatedTodos));
  renderTodos();
}

function saveTodo(todoObj) {
  const todos = JSON.parse(localStorage.getItem("todos")) || [];
  todos.push(todoObj);
  localStorage.setItem("todos", JSON.stringify(todos));
}

function updateTodoInStorage(updatedTodo) {
  const todos = JSON.parse(localStorage.getItem("todos")) || [];
  const idx = todos.findIndex((todo) => todo.id === updatedTodo.id);
  if (idx !== -1) {
    todos[idx] = updatedTodo;
    localStorage.setItem("todos", JSON.stringify(todos));
  }
  renderTodos();
}

// 마감일 임박(24시간 이내) 강조
function checkImminentTasks() {
  const now = new Date();
  const tasks = document.querySelectorAll("#todo-list li");
  tasks.forEach((li) => {
    const rawDeadline = li.getAttribute("data-deadlineRaw");
    if (!rawDeadline) return;
    const year = parseInt(rawDeadline.substring(0, 4));
    const month = parseInt(rawDeadline.substring(4, 6));
    const day = parseInt(rawDeadline.substring(6, 8));
    const deadlineDate = new Date(year, month - 1, day);
    const diff = deadlineDate - now;
    if (diff >= 0 && diff <= 24 * 60 * 60 * 1000) {
      li.classList.add("imminent");
    } else {
      li.classList.remove("imminent");
    }
  });
}

// renderTodos() : 할 일 목록 렌더링 (검색 필터, 정렬, 임박 알림 적용)
// manualOrderMode가 false이면 자동 정렬, true이면 저장된 순서대로 렌더링
function renderTodos() {
  let todos = JSON.parse(localStorage.getItem("todos")) || [];

  const searchTerm = searchInput.value.trim().toLowerCase();
  if (searchTerm) {
    todos = todos.filter((todo) => {
      return (
        todo.task.toLowerCase().includes(searchTerm) ||
        (todo.category && todo.category.toLowerCase().includes(searchTerm)) ||
        (todo.priority && todo.priority.toLowerCase().includes(searchTerm))
      );
    });
  }

  if (!manualOrderMode) {
    todos.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const pa = priorityOrder[a.priority] || 4;
      const pb = priorityOrder[b.priority] || 4;
      if (pa !== pb) {
        return pa - pb;
      }
      return Number(a.deadlineRaw) - Number(b.deadlineRaw);
    });
  }

  todoList.innerHTML = "";
  todos.forEach((todoObj) => {
    const li = createTodoElement(todoObj);
    todoList.appendChild(li);
  });

  checkImminentTasks();
}

// 엔터 키 이벤트: 모든 입력 필드에서 Enter 시 addTodo() 실행
todoInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") addTodo();
});
todoCategory.addEventListener("keyup", (event) => {
  if (event.key === "Enter") addTodo();
});
todoPriority.addEventListener("keyup", (event) => {
  if (event.key === "Enter") addTodo();
});
todoDeadline.addEventListener("keyup", (event) => {
  if (event.key === "Enter") addTodo();
});
