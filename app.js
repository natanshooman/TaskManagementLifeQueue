// LifeQueue Application
// Manages day and week task queues with drag-and-drop functionality

// Data structure to store tasks
let tasks = {
    day: [],
    week: []
};

// Load tasks from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    renderQueues();
    setupEventListeners();
});

// Load tasks from localStorage
function loadTasks() {
    const savedTasks = localStorage.getItem('lifequeue-tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
}

// Save tasks to localStorage
function saveTasks() {
    localStorage.setItem('lifequeue-tasks', JSON.stringify(tasks));
}

// Setup event listeners for Enter key in input fields
function setupEventListeners() {
    document.getElementById('day-task-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask('day');
        }
    });
    
    document.getElementById('week-task-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask('week');
        }
    });
}

// Add a new task to the specified queue
function addTask(queueType) {
    const inputId = `${queueType}-task-input`;
    const input = document.getElementById(inputId);
    const taskText = input.value.trim();
    
    if (taskText === '') {
        return;
    }
    
    const task = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    // Add to the END of the queue (as per requirements)
    tasks[queueType].push(task);
    
    saveTasks();
    renderQueues();
    
    // Clear input
    input.value = '';
    input.focus();
}

// Delete a task
function deleteTask(queueType, taskId) {
    tasks[queueType] = tasks[queueType].filter(task => task.id !== taskId);
    saveTasks();
    renderQueues();
}

// Toggle task completion
function toggleComplete(queueType, taskId) {
    const task = tasks[queueType].find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderQueues();
    }
}

// Render both queues
function renderQueues() {
    renderQueue('day');
    renderQueue('week');
}

// Render a specific queue
function renderQueue(queueType) {
    const listElement = document.getElementById(`${queueType}-queue-list`);
    const countElement = document.getElementById(`${queueType}-count`);
    const queueTasks = tasks[queueType];
    
    // Update count
    const taskCount = queueTasks.length;
    countElement.textContent = taskCount === 1 ? '1 task' : `${taskCount} tasks`;
    
    // Clear existing content
    listElement.innerHTML = '';
    
    // Show empty state if no tasks
    if (queueTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No tasks yet. Add one above!';
        listElement.appendChild(emptyState);
        return;
    }
    
    // Create task items
    queueTasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        li.draggable = true;
        li.dataset.taskId = task.id;
        li.dataset.queueType = queueType;
        li.dataset.index = index;
        
        li.innerHTML = `
            <span class="drag-handle">☰</span>
            <span class="task-content">${escapeHtml(task.text)}</span>
            <div class="task-actions">
                <button class="complete-btn" onclick="toggleComplete('${queueType}', ${task.id})">
                    ${task.completed ? '↩️' : '✓'}
                </button>
                <button class="delete-btn" onclick="deleteTask('${queueType}', ${task.id})">
                    ✕
                </button>
            </div>
        `;
        
        // Add drag event listeners
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dragend', handleDragEnd);
        li.addEventListener('dragover', handleDragOver);
        li.addEventListener('drop', handleDrop);
        li.addEventListener('dragenter', handleDragEnter);
        li.addEventListener('dragleave', handleDragLeave);
        
        listElement.appendChild(li);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Drag and Drop functionality
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Remove all drag-over classes
    document.querySelectorAll('.task-item').forEach(item => {
        item.classList.remove('drag-over');
    });
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this !== draggedElement) {
        this.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    e.preventDefault();
    
    if (draggedElement !== this) {
        const draggedQueueType = draggedElement.dataset.queueType;
        const draggedIndex = parseInt(draggedElement.dataset.index);
        const targetQueueType = this.dataset.queueType;
        const targetIndex = parseInt(this.dataset.index);
        
        // Only allow reordering within the same queue
        if (draggedQueueType === targetQueueType) {
            const queue = tasks[draggedQueueType];
            const draggedTask = queue[draggedIndex];
            
            // Remove from old position
            queue.splice(draggedIndex, 1);
            
            // Insert at new position
            const newIndex = draggedIndex < targetIndex ? targetIndex : targetIndex;
            queue.splice(newIndex, 0, draggedTask);
            
            saveTasks();
            renderQueues();
        }
    }
    
    return false;
}
