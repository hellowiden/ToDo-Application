document.addEventListener("DOMContentLoaded", function () {
    // DOM elements
    const taskNameInput = document.getElementById("taskName");
    const prioritySelect = document.getElementById("priority");
    const timerInput = document.getElementById("timerInput");
    const addTaskButton = document.getElementById("addTask");
    const taskList = document.getElementById("taskList");

    // Template elements for creating task list items
    const listItemTemplate = document.createElement("li");
    const timerTemplate = document.createElement("span");
    const removeButton = document.createElement("button");

    // HTML structure for each task list item
    listItemTemplate.innerHTML = `
        <span></span>
        <span class="timer">${timerTemplate}</span>
    `;

    // Function to play an alarm sound
    function playAlarmSound() {
        const audio = new Audio("assets/notification-sound.mp3");
        audio.volume = 1.0;
        return audio; // Return the audio element for later use
    }

    // Event listeners for user interactions
    addTaskButton.addEventListener("click", addTask);
    taskList.addEventListener("click", handleTaskListClick);
    taskList.addEventListener("dragstart", handleDragStart);
    taskList.addEventListener("dragover", handleDragOver);
    taskList.addEventListener("drop", handleDrop);

    // Event listener for input validation on timerInput
    timerInput.addEventListener("input", function (event) {
        let inputValue = event.target.value;
        inputValue = inputValue.replace(/[^0-9]/g, '');

        const timerValue = parseInt(inputValue, 10);
        if (timerValue < 1) {
            event.target.value = '1';
        } else if (timerValue > 60) {
            event.target.value = '60';
        } else {
            event.target.value = timerValue.toString();
        }
    });

    // Function to add a new task to the list
    function addTask() {
        const taskName = taskNameInput.value;
        const priority = prioritySelect.value;
        let timerValue = parseInt(timerInput.value, 10) || 0;

        if (!taskName) {
            alert("Please enter a task name.");
            return;
        }

        if (timerValue > 60) {
            alert("Timer value cannot exceed 60 minutes.");
            return;
        }

        const listItem = createListItem({ name: taskName, priority, timerValue });

        taskList.appendChild(listItem);
        const audio = playAlarmSound(); // Get the audio element
        startTimer(listItem, timerValue * 60, audio); // Pass the audio element to startTimer
        saveTasksToLocalStorage();
        sortTaskList();

        taskNameInput.value = "";
        timerInput.value = "";
    }

    // Function to create a new task list item
    function createListItem(task) {
        const listItem = listItemTemplate.cloneNode(true);
        listItem.classList.add(task.priority);
        listItem.querySelector("span").textContent = task.name;
        listItem.querySelector(".timer").textContent = formatTime(task.timerValue * 60);

        removeButton.textContent = "Remove";
        removeButton.classList.add("remove");
        listItem.appendChild(removeButton.cloneNode(true));

        return listItem;
    }

    // Function to start a timer for a specific task
    function startTimer(taskElement, seconds, audio) {
        const timerElement = taskElement.querySelector(".timer");

        if (seconds > 0) {
            const intervalId = setInterval(() => {
                seconds--;

                if (seconds <= 0) {
                    clearInterval(intervalId);
                    timerElement.textContent = "Time's up!";

                    // Play the alarm sound when the timer reaches zero
                    if (audio) {
                        audio.play().catch(error => {
                            console.error("Error playing audio:", error.message);
                        });
                    }
                } else {
                    timerElement.textContent = formatTime(seconds);
                }
            }, 1000);
        }
    }

    // Function to format time in minutes and seconds
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toLocaleString("en-US", {
            minimumIntegerDigits: 2
        })}`;
    }

    // Function to sort the task list based on priority
    function sortTaskList() {
        const listItems = Array.from(taskList.children);

        listItems.sort((a, b) => {
            const priorityA = a.classList[0];
            const priorityB = b.classList[0];

            const priorityValues = { low: 1, medium: 2, high: 3 };
            return priorityValues[priorityB] - priorityValues[priorityA];
        });

        taskList.innerHTML = "";
        listItems.forEach((item) => taskList.appendChild(item));
        saveTasksToLocalStorage();
    }

    // Function to save tasks to local storage
    function saveTasksToLocalStorage() {
        const tasks = Array.from(taskList.children).map(item => {
            return {
                name: item.querySelector("span").textContent,
                priority: item.classList[0],
                timerValue: parseFloat(item.querySelector(".timer").textContent) || 0
            };
        });

        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    // Function to load tasks from local storage
    function loadTasksFromLocalStorage() {
        const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

        tasks.forEach(task => {
            const listItem = createListItem(task);
            taskList.appendChild(listItem);

            if (task.timerValue && task.timerValue > 0) {
                startTimer(listItem, task.timerValue * 60);
            }
        });
    }

    // Function to handle user click events on the task list
    function handleTaskListClick(e) {
        const target = e.target;

        if (target.classList.contains("remove")) {
            // Use a confirmation dialog
            const confirmed = confirm("Are you sure you want to remove this task?");
            if (confirmed) {
                target.parentElement.remove();
                saveTasksToLocalStorage();
            }
        }
    }

    // Function to handle the start of a drag operation
    function handleDragStart(e) {
        e.dataTransfer.setData("text/plain", e.target.id);
    }

    // Function to handle the dragover event during drag and drop
    function handleDragOver(e) {
        e.preventDefault();
    }

    // Function to handle the drop event during drag and drop
    function handleDrop(e) {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        const target = e.target;

        if (target.nodeName === "LI") {
            target.parentNode.insertBefore(document.getElementById(taskId), target);
        } else {
            target.appendChild(document.getElementById(taskId));
        }

        saveTasksToLocalStorage();
    }

    // Function to create and show the disclaimer popup
    function showDisclaimerPopup() {
        const disclaimerPopup = document.createElement("div");
        disclaimerPopup.classList.add("disclaimer-popup");

        const disclaimerContent = document.createElement("div");
        disclaimerContent.classList.add("disclaimer-content");

        disclaimerContent.innerHTML = `
            <h1>What is a To-Do application?</h1>
            <p>A To-Do application is like a digital checklist. It helps you list and organize tasks you need to do, set deadlines, and keep track of what you've completed. It's a handy tool for staying organized and managing your time effectively.</p>
            <button id="closeDisclaimer">Cool, Let's get started!</button>
        `;

        disclaimerPopup.appendChild(disclaimerContent);
        document.body.appendChild(disclaimerPopup);

        // Event listener to close the disclaimer popup
        document.getElementById("closeDisclaimer").addEventListener("click", function () {
            disclaimerPopup.style.display = "none";
        });
    }

    // Initial setup
    const audio = playAlarmSound(); // Get the audio element
    loadTasksFromLocalStorage();
    sortTaskList();

    // Call the function to show the disclaimer popup
    showDisclaimerPopup();
});
