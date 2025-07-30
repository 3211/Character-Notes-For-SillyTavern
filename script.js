(function () {
    console.log('CNotes: [V12-UI-Refinement] Script file loaded.');

    // --- GLOBALS ---
    let characterNotesData = {};
    let currentCharacterId = null;
    let modal;
    let folderSelector, folderNameInput, noteSelector, noteTitleInput, noteContentTextarea;
    let isModalOpen = false;
    let currentFolderName = '##root##';

    // ----- DATA FUNCTIONS -----
    function loadNotes() {
        const context = SillyTavern.getContext();
        const loadedData = context.extensionSettings['Character-Notes'];
        if (loadedData) characterNotesData = loadedData;

        Object.keys(characterNotesData).forEach(charId => {
            if (Array.isArray(characterNotesData[charId])) {
                const oldNotes = characterNotesData[charId];
                characterNotesData[charId] = { '##root##': oldNotes };
            }
        });
    }

    function saveNotes() {
        if (!currentCharacterId) return;
        const context = SillyTavern.getContext();
        context.extensionSettings['Character-Notes'] = characterNotesData;
        context.saveSettingsDebounced();
    }
    
    // ----- MODAL VISIBILITY -----
    function openModal() {
        modal.style.display = 'block';
        isModalOpen = true;
        ensureOnScreen();
        refreshFoldersUI();
    }
    function closeModal() {
        modal.style.display = 'none';
        isModalOpen = false;
    }

    // ----- UI AND EVENT FUNCTIONS -----
    function refreshFoldersUI() {
        const context = SillyTavern.getContext();
        if (!context || !context.characterId) {
            if (isModalOpen) closeModal();
            return;
        }
        currentCharacterId = context.characterId;
        if (!characterNotesData[currentCharacterId]) characterNotesData[currentCharacterId] = { '##root##': [] };

        const folders = Object.keys(characterNotesData[currentCharacterId]);
        folderSelector.innerHTML = '';

        const rootOption = document.createElement('option');
        rootOption.value = '##root##';
        rootOption.textContent = '– (Root Folder) –';
        folderSelector.appendChild(rootOption);

        folders.forEach(folderName => {
            if (folderName === '##root##') return;
            const option = document.createElement('option');
            option.value = folderName;
            option.textContent = folderName;
            folderSelector.appendChild(option);
        });

        folderSelector.value = currentFolderName;
        // MODIFIED: Also update the input field text to match the dropdown
        folderNameInput.value = (currentFolderName === '##root##') ? '' : currentFolderName;
        refreshNotesList();
    }

    function refreshNotesList(noteIndexToSelect = -1) {
        const notes = characterNotesData[currentCharacterId]?.[currentFolderName] || [];
        
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
        const notes = characterNotesData[currentCharacterId]?.[currentFolderName] || [];
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

    function handleFolderSelect() {
        currentFolderName = folderSelector.value;
        // MODIFIED: Update the input field to reflect the dropdown choice
        folderNameInput.value = (currentFolderName === '##root##') ? '' : currentFolderName;
        refreshNotesList();
    }

    function handleSaveNote() {
        if (!currentCharacterId) return;
        const title = noteTitleInput.value.trim();
        const text = noteContentTextarea.value.trim();
        if (!title) {
            SillyTavern.utility.showToast("Note title cannot be empty.", "error");
            return;
        }

        // MODIFIED: Logic now prioritizes the text input for folder name
        let folderToSaveIn = folderNameInput.value.trim();
        if (!folderToSaveIn) {
            folderToSaveIn = '##root##'; // Default to root if input is empty
        }
        
        if (!characterNotesData[currentCharacterId][folderToSaveIn]) {
            characterNotesData[currentCharacterId][folderToSaveIn] = [];
        }

        const notes = characterNotesData[currentCharacterId][folderToSaveIn];
        let selectedIndex = parseInt(noteSelector.value, 10);
        
        let savedIndex;
        if (selectedIndex >= 0 && folderToSaveIn === currentFolderName) {
            notes[selectedIndex] = { title, text };
            savedIndex = selectedIndex;
        } else {
            notes.push({ title, text });
            savedIndex = notes.length - 1;
        }
        
        currentFolderName = folderToSaveIn;
        saveNotes();
        refreshFoldersUI();
        refreshNotesList(savedIndex);
        SillyTavern.utility.showToast(`Note saved to "${folderToSaveIn === '##root##' ? 'Root Folder' : folderToSaveIn}"`, "success");
    }

    function handleDeleteNote() { /* ... unchanged ... */ }

    function handleDeleteFolder() {
        const folderToDelete = folderSelector.value;
        if (folderToDelete === '##root##') {
            SillyTavern.utility.showToast("Cannot delete the Root Folder.", "error");
            return;
        }

        if (confirm(`Are you sure you want to delete the folder "${folderToDelete}" and all notes inside it?`)) {
            delete characterNotesData[currentCharacterId][folderToDelete];
            currentFolderName = '##root##';
            saveNotes();
            refreshFoldersUI();
            SillyTavern.utility.showToast(`Folder "${folderToDelete}" deleted.`, "success");
        }
    }
    
    function ensureOnScreen() { /* ... unchanged ... */ }

    function createModal() {
        if (document.getElementById('character-notes-modal')) return;
        modal = document.createElement('div');
        modal.id = 'character-notes-modal';
        modal.style.display = 'none';

        // MODIFIED: Complete HTML rewrite for the new layout and native ST classes
        modal.innerHTML = `
            <div id="character-notes-header"><span>Character Notes</span><button id="character-notes-close" class="fa-solid fa-xmark"></button></div>
            <div id="character-notes-content">
                <div class="cnotes-folder-row">
                    <input type="text" id="character-notes-folder-input" class="text_pole" placeholder="New/Current Folder Name">
                    <button id="character-notes-delete-folder" class="menu_button" title="Delete Selected Folder">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                <select id="character-notes-folder-selector"></select>
                <select id="character-notes-selector"></select>
                <input type="text" id="character-notes-title" class="text_pole" placeholder="Note Title">
                <textarea id="character-notes-textarea" placeholder="Note content..."></textarea>
                <div id="character-notes-actions">
                    <button id="character-notes-new">New</button>
                    <button id="character-notes-save">Save</button>
                    <button id="character-notes-delete">Delete</button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        // Get all UI elements
        folderSelector = document.getElementById('character-notes-folder-selector');
        folderNameInput = document.getElementById('character-notes-folder-input');
        noteSelector = document.getElementById('character-notes-selector');
        noteTitleInput = document.getElementById('character-notes-title');
        noteContentTextarea = document.getElementById('character-notes-textarea');

        // Add all event listeners
        document.getElementById('character-notes-close').addEventListener('click', closeModal);
        folderSelector.addEventListener('change', handleFolderSelect);
        document.getElementById('character-notes-delete-folder').addEventListener('click', handleDeleteFolder);
        noteSelector.addEventListener('change', displaySelectedNote);
        document.getElementById('character-notes-new').addEventListener('click', prepareNewNote);
        document.getElementById('character-notes-save').addEventListener('click', handleSaveNote);
        document.getElementById('character-notes-delete').addEventListener('click', handleDeleteNote);
        
        // Draggable logic... (remains the same)
    }

    // --- IMMEDIATE EXECUTION ---
    try {
        // ... (this section is unchanged)
    } catch (error) {
        // ...
    }
})();
