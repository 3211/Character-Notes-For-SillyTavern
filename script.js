(function () {
    console.log('CNotes: Script file loaded and executed.');

    // Data store for all notes, keyed by character ID
    let characterNotesData = {};
    let currentCharacterId = null;

    // UI Elements
    let modal;
    let noteSelector;
    let noteTitleInput;
    let noteContentTextarea;

    // ----- DATA FUNCTIONS -----
    async function saveNotes() {
        console.log('CNotes: saveNotes() called.');
        if (!currentCharacterId) return;
        await SillyTavern.extensions.saveExtensionSettings('Character-Notes', characterNotesData);
        console.log('CNotes: saveNotes() finished.');
    }

    async function loadNotes() {
        console.log('CNotes: loadNotes() called.');
        const loadedData = await SillyTavern.extensions.loadExtensionSettings('Character-Notes');
        if (loadedData) {
            characterNotesData = loadedData;
            console.log('CNotes: Found and loaded existing notes data.');
        }
        console.log('CNotes: loadNotes() finished.');
    }

    // ----- UI AND EVENT FUNCTIONS -----
    function refreshNoteUI() {
        console.log('CNotes: refreshNoteUI() called.');
        const context = SillyTavern.getContext();
        
        if (!context || !context.characterId) {
            console.log('CNotes: No character loaded. Aborting UI refresh.');
            if(modal && modal.style.display !== 'none') {
                SillyTavern.showToast("No character loaded.", "warning");
                modal.style.display = 'none';
            }
            return;
        }
        currentCharacterId = context.characterId;
        console.log(`CNotes: Refreshing notes for character ID: ${currentCharacterId}`);
        
        noteSelector.innerHTML = '<option value="-1" selected>-- Select a Note --</option>';
        clearInputFields();

        const notes = characterNotesData[currentCharacterId] || [];
        notes.forEach((note, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = note.title;
            noteSelector.appendChild(option);
        });
        console.log(`CNotes: Populated dropdown with ${notes.length} notes.`);
    }

    function displaySelectedNote() {
        console.log('CNotes: displaySelectedNote() called.');
        // ... (logging inside minor UI functions is less critical for now)
    }

    function clearInputFields() {
        console.log('CNotes: clearInputFields() called.');
        // ...
    }

    function handleSaveNote() {
        console.log('CNotes: handleSaveNote() called.');
        // ...
    }

    function handleDeleteNote() {
        console.log('CNotes: handleDeleteNote() called.');
        // ...
    }

    function createModal() {
        console.log('CNotes: createModal() called.');
        if (document.getElementById('character-notes-modal')) {
            console.log('CNotes: Modal already exists. Skipping creation.');
            return;
        }
        modal = document.createElement('div');
        modal.id = 'character-notes-modal';
        modal.innerHTML = `
            <div id="character-notes-header">
                <span>Character Notes</span>
                <button id="character-notes-close" class="fa-solid fa-xmark"></button>
            </div>
            <div id="character-notes-content">
                <select id="character-notes-selector"></select>
                <input type="text" id="character-notes-title" placeholder="Note Title">
                <textarea id="character-notes-textarea" placeholder="Note content..."></textarea>
                <div id="character-notes-actions">
                    <button id="character-notes-new">New</button>
                    <button id="character-notes-save">Save</button>
                    <button id="character-notes-delete">Delete</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        console.log('CNotes: Modal element appended to body.');

        noteSelector = document.getElementById('character-notes-selector');
        noteTitleInput = document.getElementById('character-notes-title');
        noteContentTextarea = document.getElementById('character-notes-textarea');

        document.getElementById('character-notes-close').addEventListener('click', () => modal.style.display = 'none');
        noteSelector.addEventListener('change', displaySelectedNote);
        document.getElementById('character-notes-new').addEventListener('click', clearInputFields);
        document.getElementById('character-notes-save').addEventListener('click', handleSaveNote);
        document.getElementById('character-notes-delete').addEventListener('click', handleDeleteNote);
        
        makeDraggable(modal);
        console.log('CNotes: createModal() finished.');
    }
    
    function makeDraggable(element) {
        // ... (no logging needed in this utility)
    }

    async function initializeExtension() {
        console.log('CNotes: initializeExtension() called.');
        
        const extensionsMenu = document.getElementById('extensionsMenu');
        console.log(`CNotes: Found extensionsMenu element: ${!!extensionsMenu}`);
        
        const menuItem = document.createElement('div');
        menuItem.classList.add('list-group-item', 'flex-container', 'flexGap5', 'interactable');
        menuItem.innerHTML = `<i class="fa-solid fa-note-sticky"></i><span>Character Notes</span>`;
        console.log('CNotes: Menu item element created.');

        menuItem.addEventListener('click', () => {
            console.log('CNotes: Menu item clicked!');
            modal.style.display = 'block';
            refreshNoteUI();
        });
        console.log('CNotes: Click listener added to menu item.');

        extensionsMenu.appendChild(menuItem);
        console.log('CNotes: Menu item appended to extensions menu. It should be visible now!');

        createModal();
        await loadNotes();
        console.log('CNotes: initializeExtension() finished successfully.');
    }
    
    function waitForUI() {
        console.log('CNotes: waitForUI() called from appReady event.');
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            const extensionsMenu = document.getElementById('extensionsMenu');
            if (extensionsMenu) {
                console.log(`CNotes: Found #extensionsMenu after ${attempts} attempts. UI is ready.`);
                clearInterval(interval);
                initializeExtension();
            } else if (attempts > 50) { // Timeout after 5 seconds
                console.error('CNotes: Timed out waiting for #extensionsMenu. Aborting.');
                clearInterval(interval);
            }
        }, 100);
    }

    function main() {
        console.log('CNotes: main() called. Attaching event listeners.');
        SillyTavern.eventSource.on('appReady', waitForUI);
        SillyTavern.eventSource.on('chatLoaded', refreshNoteUI);
        console.log('CNotes: Event listeners attached.');
    }

    // This is the new startup logic.
    console.log('CNotes: Starting up. Polling for SillyTavern.eventSource...');
    let startupAttempts = 0;
    const startupInterval = setInterval(() => {
        startupAttempts++;
        if (window.SillyTavern && window.SillyTavern.eventSource) {
            console.log(`CNotes: Found SillyTavern.eventSource after ${startupAttempts} attempts. API is ready.`);
            clearInterval(startupInterval);
            main();
        } else if (startupAttempts > 50) { // Timeout after 5 seconds
            console.error('CNotes: Timed out waiting for SillyTavern.eventSource. The extension cannot start.');
            clearInterval(startupInterval);
        }
    }, 100);

})();
