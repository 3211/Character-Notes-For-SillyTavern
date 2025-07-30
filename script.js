(function () {
    console.log('CNotes: [V9-Final] Script file loaded.');

    // --- GLOBALS ---
    let characterNotesData = {};
    let currentCharacterId = null;
    let modal;
    let noteSelector, noteTitleInput, noteContentTextarea;
    let isModalOpen = false; // NEW: A reliable flag to track the modal's state.

    // ----- DATA FUNCTIONS -----
    function loadNotes() {
        const context = SillyTavern.getContext();
        const loadedData = context.extensionSettings['Character-Notes'];
        if (loadedData) characterNotesData = loadedData;
    }

    function saveNotes() {
        if (!currentCharacterId) return;
        const context = SillyTavern.getContext();
        context.extensionSettings['Character-Notes'] = characterNotesData;
        context.saveSettingsDebounced();
    }
    
    // ----- MODAL VISIBILITY -----
    function openModal() {
        modal.style.display = 'flex'; // Or 'block' if you reverted the flex CSS
        isModalOpen = true;
        ensureOnScreen();
        refreshNoteUI(noteSelector.value);
    }
    function closeModal() {
        modal.style.display = 'none';
        isModalOpen = false;
    }

    // ----- UI AND EVENT FUNCTIONS -----
    function refreshNoteUI(noteIndexToSelect = -1) {
        const context = SillyTavern.getContext();
        if (!context || !context.characterId) {
            if (isModalOpen) closeModal();
            return;
        }
        currentCharacterId = context.characterId;
        
        const notes = characterNotesData[currentCharacterId] || [];
        
        noteSelector.innerHTML = '<option value="-1">-- New Note --</option>';
        notes.forEach((note, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = note.title;
            noteSelector.appendChild(option);
        });

        noteSelector.value = noteIndexToSelect;
        displaySelectedNote();
    }

    function displaySelectedNote() {
        const selectedIndex = parseInt(noteSelector.value, 10);
        const notes = characterNotesData[currentCharacterId] || [];
        if (selectedIndex >= 0 && notes[selectedIndex]) {
            const note = notes[selectedIndex];
            noteTitleInput.value = note.title;
            noteContentTextarea.value = note.text;
        } else {
            noteTitleInput.value = '';
            noteContentTextarea.value = '';
        }
    }
    
    function prepareNewNote() {
        noteSelector.value = -1;
        displaySelectedNote();
    }

    function handleSaveNote() {
        if (!currentCharacterId) return;
        const title = noteTitleInput.value.trim();
        const text = noteContentTextarea.value.trim();
        if (!title) {
            SillyTavern.utility.showToast("Note title cannot be empty.", "error");
            return;
        }
        
        if (!characterNotesData[currentCharacterId]) characterNotesData[currentCharacterId] = [];
        const notes = characterNotesData[currentCharacterId];
        let selectedIndex = parseInt(noteSelector.value, 10);
        
        let savedIndex;
        if (selectedIndex >= 0) {
            notes[selectedIndex] = { title, text };
            savedIndex = selectedIndex;
        } else {
            notes.push({ title, text });
            savedIndex = notes.length - 1;
        }
        
        saveNotes();
        refreshNoteUI(savedIndex);
        SillyTavern.utility.showToast("Note saved successfully!", "success");
    }

    function handleDeleteNote() {
        if (!currentCharacterId) return;
        const selectedIndex = parseInt(noteSelector.value, 10);
        if (selectedIndex < 0) return;

        characterNotesData[currentCharacterId].splice(selectedIndex, 1);
        saveNotes();
        refreshNoteUI();
        SillyTavern.utility.showToast("Note deleted.", "success");
    }
    
    function ensureOnScreen() {
        const rect = modal.getBoundingClientRect();
        if (rect.left < 0) modal.style.left = '0px';
        if (rect.top < 0) modal.style.top = '0px';
        if (rect.right > window.innerWidth) modal.style.left = `${window.innerWidth - rect.width}px`;
        if (rect.bottom > window.innerHeight) modal.style.top = `${window.innerHeight - rect.height}px`;
    }

    function createModal() {
        if (document.getElementById('character-notes-modal')) return;
        modal = document.createElement('div');
        modal.id = 'character-notes-modal';
        modal.innerHTML = `
            <div id="character-notes-header"><span>Character Notes</span><button id="character-notes-close" class="fa-solid fa-xmark"></button></div>
            <div id="character-notes-content">
                <select id="character-notes-selector"></select>
                <input type="text" id="character-notes-title" placeholder="Note Title">
                <textarea id="character-notes-textarea" placeholder="Note content..."></textarea>
                <div id="character-notes-actions">
                    <button id="character-notes-new">New</button>
                    <button id="character-notes-save">Save</button>
                    <button id="character-notes-delete">Delete</button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        noteSelector = document.getElementById('character-notes-selector');
        noteTitleInput = document.getElementById('character-notes-title');
        noteContentTextarea = document.getElementById('character-notes-textarea');

        document.getElementById('character-notes-close').addEventListener('click', closeModal); // MODIFIED
        noteSelector.addEventListener('change', displaySelectedNote);
        document.getElementById('character-notes-new').addEventListener('click', prepareNewNote);
        document.getElementById('character-notes-save').addEventListener('click', handleSaveNote);
        document.getElementById('character-notes-delete').addEventListener('click', handleDeleteNote);
        
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = document.getElementById('character-notes-header');
        if (header) {
            header.onmousedown = function(e) {
                e.preventDefault();
                pos3 = e.clientX; pos4 = e.clientY;
                document.onmouseup = () => { document.onmouseup = null; document.onmousemove = null; };
                document.onmousemove = (e) => {
                    e.preventDefault();
                    pos1 = pos3 - e.clientX; pos2 = pos4 - e.clientY;
                    pos3 = e.clientX; pos4 = e.clientY;
                    modal.style.top = `${modal.offsetTop - pos2}px`;
                    modal.style.left = `${modal.offsetLeft - pos1}px`;
                };
            };
        }
    }

    // --- IMMEDIATE EXECUTION ---
    try {
        const extensionsMenu = document.getElementById('extensionsMenu');
        if (!extensionsMenu) throw new Error("#extensionsMenu not found in the DOM.");

        const menuItem = document.createElement('div');
        menuItem.classList.add('list-group-item', 'flex-container', 'flexGap5', 'interactable');
        menuItem.innerHTML = `<i class="fa-solid fa-note-sticky"></i><span>Character Notes</span>`;
        
        // MODIFIED: Toggle logic is now based on the isModalOpen flag.
        menuItem.addEventListener('click', () => {
            if (isModalOpen) {
                closeModal();
            } else {
                openModal();
            }
        });
        
        extensionsMenu.appendChild(menuItem);
        createModal();
        loadNotes();
        SillyTavern.getContext().eventSource.on('chatLoaded', () => refreshNoteUI());
        console.log('CNotes: Initialization complete.');
    } catch (error) {
        console.error('CNotes: A critical error occurred during initialization.', error);
    }
})();
