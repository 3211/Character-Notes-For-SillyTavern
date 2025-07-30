(function () {
    console.log('CNotes: [V8-Polished] Script file loaded.');

    // --- GLOBALS ---
    let characterNotesData = {};
    let currentCharacterId = null;
    let modal;
    let noteSelector, noteTitleInput, noteContentTextarea;

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

    // ----- UI AND EVENT FUNCTIONS -----
    function refreshNoteUI(noteIndexToSelect = -1) {
        const context = SillyTavern.getContext();
        if (!context || !context.characterId) {
            if (modal && modal.style.display !== 'none') modal.style.display = 'none';
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
    
    // NEW: Function to force the modal back into the viewport.
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
    // ADDED: 'drawer-content' class to adopt the main panel theme.
    modal.id = 'character-notes-modal';
    modal.classList.add('drawer-content'); 

    modal.innerHTML = `
        // ADDED: 'panelControlBar' to style the header like other panels.
        <div id="character-notes-header" class="panelControlBar"> 
            <span>Character Notes</span>
            // ADDED: 'floating_panel_close' for native close button styling.
            <button id="character-notes-close" class="fa-solid fa-xmark floating_panel_close"></button>
        </div>
        <div id="character-notes-content">
            <select id="character-notes-selector"></select>
            // ADDED: 'text_pole' for native input styling.
            <input type="text" id="character-notes-title" class="text_pole" placeholder="Note Title">
            <textarea id="character-notes-textarea" placeholder="Note content..."></textarea>
            <div id="character-notes-actions">
                <button id="character-notes-new">New</button>
                <button id="character-notes-save">Save</button>
                <button id="character-notes-delete">Delete</button>
            </div>
        </div>`;
    document.body.appendChild(modal);

    // The rest of the function remains the same...
    noteSelector = document.getElementById('character-notes-selector');
    noteTitleInput = document.getElementById('character-notes-title');
    noteContentTextarea = document.getElementById('character-notes-textarea');

    document.getElementById('character-notes-close').addEventListener('click', () => modal.style.display = 'none');
    noteSelector.addEventListener('change', displaySelectedNote);
    document.getElementById('character-notes-new').addEventListener('click', prepareNewNote);
    document.getElementById('character-notes-save').addEventListener('click', handleSaveNote);
    document.getElementById('character-notes-delete').addEventListener('click', handleDeleteNote);
    
    // Make draggable utility
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
        
        // MODIFIED: The menu item now acts as a toggle.
        menuItem.addEventListener('click', () => {
            if (modal.style.display === 'flex') {
                // If it's open, close it.
                modal.style.display = 'none';
            } else {
                // If it's closed, open it, ensure it's on-screen, and refresh.
                modal.style.display = 'flex';
                ensureOnScreen(); 
                refreshNoteUI(noteSelector.value);
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
