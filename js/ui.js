// UI Service - Handles UI rendering and interactions

class UIService {
    constructor(trackerManager) {
        this.trackerManager = trackerManager;
        this.activeMenu = null;
        
        // Cache DOM elements
        this.elements = {
            trackersList: document.getElementById('trackers-list'),
            menuButton: document.getElementById('menu-button'),
            menuDropdown: document.getElementById('menu-dropdown'),
            createTrackerButton: document.getElementById('create-tracker-button'),
            createTrackerModal: document.getElementById('create-tracker-modal'),
            closeModalButton: document.getElementById('close-modal-button'),
            newTrackerForm: document.getElementById('new-tracker-form'),
            trackerNameInput: document.getElementById('tracker-name'),
            currentValueInput: document.getElementById('current-value'),
            targetValueInput: document.getElementById('target-value'),
            startDateInput: document.getElementById('start-date'),
            targetDateInput: document.getElementById('target-date')
        };
    }

    /**
     * Initialize the UI and set up event listeners
     */
    initialize() {
        this.setupEventListeners();
        this.setDefaultFormValues();
        this.renderTrackers();
    }

    /**
     * Set up all event listeners for UI interaction
     */
    setupEventListeners() {
        // Menu button click
        this.elements.menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.elements.menuDropdown.classList.toggle('hidden');
        });

        // Create tracker button in menu
        this.elements.createTrackerButton.addEventListener('click', () => {
            this.elements.menuDropdown.classList.add('hidden');
            this.elements.createTrackerModal.classList.remove('hidden');
        });

        // Close modal button
        this.elements.closeModalButton.addEventListener('click', () => {
            this.elements.createTrackerModal.classList.add('hidden');
        });

        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === this.elements.createTrackerModal) {
                this.elements.createTrackerModal.classList.add('hidden');
            }
            
            // Close dropdown when clicking outside
            if (!this.elements.menuButton.contains(e.target) && !this.elements.menuDropdown.contains(e.target)) {
                this.elements.menuDropdown.classList.add('hidden');
            }

            // Close active tracker menu if clicking outside
            if (this.activeMenu && !e.target.closest('.tracker-menu-button')) {
                this.activeMenu.classList.add('hidden');
                this.activeMenu = null;
            }
        });

        // Add new tracker form submission
        this.elements.newTrackerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewTrackerSubmit();
            this.elements.createTrackerModal.classList.add('hidden');
        });

        // Event delegation for tracker actions (update, menu toggle, etc.)
        this.elements.trackersList.addEventListener('click', (e) => this.handleTrackerActions(e));

        // Event delegation for various form submissions
        this.elements.trackersList.addEventListener('submit', (e) => this.handleFormSubmissions(e));
    }

    /**
     * Set default values for the new tracker form
     */
    setDefaultFormValues() {
        // Set default current value to 0
        this.elements.currentValueInput.value = '0';
        
        // Set default start date to today
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        this.elements.startDateInput.value = formattedDate;
    }

    /**
     * Handle clicks on tracker cards and their elements
     */
    handleTrackerActions(e) {
        const target = e.target;
        const trackerId = target.closest('.tracker-card')?.dataset.id;
        
        if (!trackerId) return;
        
        // Handle update button click
        if (target.classList.contains('btn-update')) {
            this.toggleUpdateForm(trackerId);
        }
        
        // Handle add button click
        if (target.classList.contains('btn-add')) {
            this.toggleAddForm(trackerId);
        }
        
        // Handle tracker menu button click
        if (target.closest('.tracker-menu-button')) {
            e.stopPropagation();
            const menuDropdown = document.querySelector(`.tracker-menu-dropdown[data-id="${trackerId}"]`);
            
            // Close any other open menus
            if (this.activeMenu && this.activeMenu !== menuDropdown) {
                this.activeMenu.classList.add('hidden');
            }
            
            // Toggle the clicked menu
            menuDropdown.classList.toggle('hidden');
            this.activeMenu = menuDropdown.classList.contains('hidden') ? null : menuDropdown;
        }
        
        // Handle menu options
        if (target.closest('.tracker-menu-item')) {
            const action = target.dataset.action || target.closest('.tracker-menu-item').dataset.action;
            
            if (action === 'show-history') {
                this.toggleHistory(trackerId);
            } else if (action === 'update-target') {
                this.showUpdateTargetForm(trackerId);
            } else if (action === 'rename') {
                this.showRenameForm(trackerId);
            } else if (action === 'delete') {
                this.trackerManager.deleteTracker(trackerId);
            } else if (action === 'update-dates') {
                this.showDateForm(trackerId);
            }
            
            // Close the menu
            const menuDropdown = document.querySelector(`.tracker-menu-dropdown[data-id="${trackerId}"]`);
            menuDropdown.classList.add('hidden');
            this.activeMenu = null;
        }
    }

    /**
     * Handle form submission events
     */
    handleFormSubmissions(e) {
        e.preventDefault();
        const trackerId = e.target.closest('.tracker-card').dataset.id;
        
        if (e.target.classList.contains('update-value-form')) {
            const newValue = e.target.querySelector('.new-value-input').value;
            this.trackerManager.updateTrackerValue(trackerId, newValue);
        }
        
        if (e.target.classList.contains('add-value-form')) {
            const valueToAdd = e.target.querySelector('.add-value-input').value;
            const tracker = this.trackerManager.getTracker(trackerId);
            const newTotal = parseFloat(tracker.currentValue) + parseFloat(valueToAdd);
            this.trackerManager.updateTrackerValue(trackerId, newTotal);
        }
        
        if (e.target.classList.contains('update-target-form')) {
            const newTarget = e.target.querySelector('.new-target-input').value;
            this.trackerManager.updateTrackerTarget(trackerId, newTarget);
        }
        
        if (e.target.classList.contains('rename-form')) {
            const newName = e.target.querySelector('.new-name-input').value;
            this.trackerManager.renameTracker(trackerId, newName);
        }

        if (e.target.classList.contains('date-form')) {
            const newStartDate = e.target.querySelector('.start-date-input').value;
            const newTargetDate = e.target.querySelector('.target-date-input').value;
            this.trackerManager.updateDates(trackerId, newStartDate || null, newTargetDate || null);
        }
    }

    /**
     * Handle new tracker form submission
     */
    handleNewTrackerSubmit() {
        const name = this.elements.trackerNameInput.value.trim();
        const currentValue = this.elements.currentValueInput.value;
        const targetValue = this.elements.targetValueInput.value;
        const startDate = this.elements.startDateInput.value || null;
        const targetDate = this.elements.targetDateInput.value || null;
        
        this.trackerManager.addTracker(name, currentValue, targetValue, startDate, targetDate);
        
        // Reset form
        this.elements.newTrackerForm.reset();
    }

    /**
     * Toggle the update form for a tracker
     */
    toggleUpdateForm(trackerId) {
        const card = this.elements.trackersList.querySelector(`.tracker-card[data-id="${trackerId}"]`);
        const updateForm = card.querySelector('.update-value-form');
        
        // Hide all other forms first
        card.querySelectorAll('.update-form, .history-list').forEach(el => {
            if (el !== updateForm) el.classList.add('hidden');
        });
        
        updateForm.classList.toggle('hidden');
        
        if (!updateForm.classList.contains('hidden')) {
            updateForm.querySelector('.new-value-input').focus();
        }
    }

    /**
     * Toggle the add form for a tracker
     */
    toggleAddForm(trackerId) {
        const card = this.elements.trackersList.querySelector(`.tracker-card[data-id="${trackerId}"]`);
        const addForm = card.querySelector('.add-value-form');
        
        // Hide all other forms first
        card.querySelectorAll('.update-form, .history-list').forEach(el => {
            if (el !== addForm) el.classList.add('hidden');
        });
        
        addForm.classList.toggle('hidden');
        
        if (!addForm.classList.contains('hidden')) {
            addForm.querySelector('.add-value-input').focus();
        }
    }

    /**
     * Toggle the history view for a tracker
     */
    toggleHistory(trackerId) {
        const card = this.elements.trackersList.querySelector(`.tracker-card[data-id="${trackerId}"]`);
        const historyList = card.querySelector('.history-list');
        
        // Hide all forms first
        card.querySelectorAll('.update-form').forEach(el => el.classList.add('hidden'));
        
        historyList.classList.toggle('hidden');
    }

    /**
     * Show the form to update a tracker's target
     */
    showUpdateTargetForm(trackerId) {
        const card = this.elements.trackersList.querySelector(`.tracker-card[data-id="${trackerId}"]`);
        const tracker = this.trackerManager.getTracker(trackerId);
        
        // Hide other forms that might be open
        card.querySelectorAll('.update-form, .history-list').forEach(el => el.classList.add('hidden'));
        
        const updateTargetForm = card.querySelector('.update-target-form');
        updateTargetForm.classList.remove('hidden');
        const targetInput = updateTargetForm.querySelector('.new-target-input');
        targetInput.value = tracker.targetValue;
        targetInput.focus();
    }
    
    /**
     * Show the form to rename a tracker
     */
    showRenameForm(trackerId) {
        const card = this.elements.trackersList.querySelector(`.tracker-card[data-id="${trackerId}"]`);
        const tracker = this.trackerManager.getTracker(trackerId);
        
        // Hide other forms that might be open
        card.querySelectorAll('.update-form, .history-list').forEach(el => el.classList.add('hidden'));
        
        const renameForm = card.querySelector('.rename-form');
        renameForm.classList.remove('hidden');
        const nameInput = renameForm.querySelector('.new-name-input');
        nameInput.value = tracker.name;
        nameInput.focus();
    }

    /**
     * Show the form to update a tracker's dates
     */
    showDateForm(trackerId) {
        const card = this.elements.trackersList.querySelector(`.tracker-card[data-id="${trackerId}"]`);
        const tracker = this.trackerManager.getTracker(trackerId);
        
        // Hide other forms that might be open
        card.querySelectorAll('.update-form, .history-list').forEach(el => el.classList.add('hidden'));
        
        const dateForm = card.querySelector('.date-form');
        dateForm.classList.remove('hidden');
        
        // Set current values
        const startDateField = dateForm.querySelector('.start-date-input');
        const targetDateField = dateForm.querySelector('.target-date-input');
        
        if (tracker.startDate) {
            startDateField.value = tracker.startDate;
        }
        if (tracker.targetDate) {
            targetDateField.value = tracker.targetDate;
        }
        
        startDateField.focus();
    }

    /**
     * Format a date string for display in history
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    /**
     * Format a date string for display in the UI
     */
    formatDateForDisplay(dateString) {
        if (!dateString) return 'Not set';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    /**
     * Render all trackers to the UI
     */
    renderTrackers() {
        const trackers = this.trackerManager.getTrackers();
        
        // Clear existing content
        this.elements.trackersList.innerHTML = '';
        
        if (trackers.length === 0) {
            this.elements.trackersList.innerHTML = '<p class="no-trackers-message">No trackers yet. Use the menu in the top right to create a new tracker.</p>';
            return;
        }
        
        // Sort trackers by name
        const sortedTrackers = [...trackers].sort((a, b) => a.name.localeCompare(b.name));
        
        // Create tracker card for each tracker
        sortedTrackers.forEach(tracker => {
            this.elements.trackersList.innerHTML += this.createTrackerHTML(tracker);
        });
    }    /**
     * Create HTML for a single tracker
     */
    createTrackerHTML(tracker) {
        const progress = tracker.getProgress();
        const progressStatus = tracker.getProgressStatus();
        
        // Create history HTML
        let historyHTML = '';
        tracker.history.slice().reverse().forEach(entry => {
            historyHTML += `<div class="history-entry">
                ${this.formatDate(entry.date)}: ${entry.value}
            </div>`;
        });
        
        // Progress status message (keep for completion status only)
        let statusMessage = '';
        if (progress >= 100) {
            statusMessage = `<div class="status-message ahead">Completed</div>`;
        }
        
        // Create tracker card with minimalist design
        return `
            <div class="tracker-card" data-id="${tracker.id}">
                <div class="tracker-header">
                    <div class="tracker-menu-container">
                        <button class="tracker-menu-button" aria-label="Tracker Menu">
                            <span class="dot"></span>
                            <span class="dot"></span>
                            <span class="dot"></span>
                        </button>
                        <div class="tracker-menu-dropdown hidden" data-id="${tracker.id}">
                            <button class="tracker-menu-item" data-action="update-dates">Set Dates</button>
                            <button class="tracker-menu-item" data-action="show-history">Show History</button>
                            <button class="tracker-menu-item" data-action="update-target">Update Target</button>
                            <button class="tracker-menu-item" data-action="rename">Rename</button>
                            <button class="tracker-menu-item tracker-menu-item-danger" data-action="delete">Delete Tracker</button>
                        </div>
                    </div>
                </div>
                
                <h3 class="tracker-title">${tracker.name}</h3>
                
                <div class="progress-container">
                    <div class="progress-bar ${progressStatus}" style="width: ${Math.min(100,progress)}%">
                        <span class="progress-text">
                            <span class="progress-percentage">${Math.round(progress)}%</span>
                            <span class="progress-values">${tracker.currentValue} / ${tracker.targetValue}</span>
                        </span>
                    </div>
                </div>
                ${statusMessage}
                
                <div class="tracker-actions">
                    <button class="btn btn-update">Update</button>
                    <button class="btn btn-add">Add</button>
                </div>
                
                <form class="update-form update-value-form hidden">
                    <div class="form-group">
                        <label>New Value:</label>
                        <input type="number" class="new-value-input" min="0" required>
                    </div>
                    <button type="submit" class="btn">Save</button>
                </form>
                
                <form class="update-form add-value-form hidden">
                    <div class="form-group">
                        <label>Add to Current Value:</label>
                        <input type="number" class="add-value-input" required>
                    </div>
                    <button type="submit" class="btn">Save</button>
                </form>
                
                <form class="update-form update-target-form hidden">
                    <div class="form-group">
                        <label>New Target:</label>
                        <input type="number" class="new-target-input" min="1" required>
                    </div>
                    <button type="submit" class="btn">Save</button>
                </form>
                
                <form class="update-form rename-form hidden">
                    <div class="form-group">
                        <label>New Name:</label>
                        <input type="text" class="new-name-input" required>
                    </div>
                    <button type="submit" class="btn">Save</button>
                </form>
                
                <form class="update-form date-form hidden">
                    <div class="form-group">
                        <label>Start Date:</label>
                        <input type="date" class="start-date-input">
                    </div>
                    <div class="form-group">
                        <label>Target Date:</label>
                        <input type="date" class="target-date-input">
                    </div>
                    <button type="submit" class="btn">Save</button>
                </form>
                
                <div class="history-list hidden">
                    <h4>Value History</h4>
                    ${historyHTML}
                </div>
            </div>
        `;
    }
}

export { UIService };