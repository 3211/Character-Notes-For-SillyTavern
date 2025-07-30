(function () {
    console.log('CNotes: [V5] Script file loaded. Attempting immediate initialization.');

    // --- GLOBALS ---
    let characterNotesData = {};
    let currentCharacterId = null;
    let modal;
    let noteSelector, noteTitleInput, noteContentTextarea;

    // --- FUNCTIONS ---
    async function saveNotes() {
        if (!currentCharacterId) return;
        await SillyTavern.extensions.saveExtensionSettings('Character-Notes', characterNotesData);
    }

    async function loadNotes() {
        const loadedData = await SillyTavern.extensions.loadExtensionSettings('Character-Notes');
        if (loadedData) characterNotesData = loadedData;
    }

    function refreshNoteUI() {
        console.log('CNotes: Refreshing UI...');
        const context = SillyTavern.getContext();
        if (!context || !context.characterId) {
            if (modal && modal.style.display !== 'none') modal.style.display = 'none';
            return;
        }
        currentCharacterId = context.characterId;
        
        noteSelector.innerHTML = '<option value="-1" selected>-- Select a Note --</option>';
        noteTitleInput.value = '';
        noteContentTextarea.value = '';

        const notes = characterNotesData[currentCharacterId] || [];
        notes.forEach((note, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = note.title;
            noteSelector.appendChild(option);
        });
        console.log(`CNotes: UI refreshed for character ${currentCharacterId} with ${notes.length} notes.`);
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

    function handleSaveNote() {
        if (!currentCharacterId) return;
        const title = noteTitleInput.value.trim();
        const text = noteContentTextarea.value.trim();
        if (!title) {
            SillyTavern.showToast("Note title cannot be empty.", "error");
            return;
        }
        
        if (!characterNotesData[currentCharacterId]) characterNotesData[currentCharacterId] = [];
        const notes = characterNotesData[currentCharacterId];
        const selectedIndex = parseInt(noteSelector.value, 10);

        if (selectedIndex >= 0) {
            notes[selectedIndex] = { title, text };
        } else {
            notes.push({ title, text });
        }
        saveNotes();
        refreshNoteUI();
        SillyTavern.showToast("Note saved successfully!", "success");
    }

    function handleDeleteNote() {
        if (!currentCharacterId) return;
        const selectedIndex = parseInt(noteSelector.value, 10);
        if (selectedIndex < 0) return;

        characterNotesData[currentCharacterId].splice(selectedIndex, 1);
        saveNotes();
        refreshNoteUI();
        SillyTavern.showToast("Note deleted.", "success");
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

        document.getElementById('character-notes-close').addEventListener('click', () => modal.style.display = 'none');
        noteSelector.addEventListener('change', displaySelectedNote);
        document.getElementById('character-notes-new').addEventListener('click', displaySelectedNote); // Resets fields
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
                    modal.style.top = (modal.offsetTop - pos2) + "px";
                    modal.style.left = (modal.offsetLeft - pos1) + "px";
                };
            };
        }
    }

    // --- IMMEDIATE EXECUTION ---
    try {
        console.log('CNotes: Looking for #extensionsMenu...');
        const extensionsMenu = document.getElementById('extensionsMenu');
        if (!extensionsMenu) {
            throw new Error("#extensionsMenu not found in the DOM.");
        }
        console.log('CNotes: Found #extensionsMenu.');

        const menuItem = document.createElement('div');
        menuItem.classList.add('list-group-item', 'flex-container', 'flexGap5', 'interactable');
        menuItem.innerHTML = `<i class="fa-solid fa-note-sticky"></i><span>Character Notes</span>`;
        menuItem.addEventListener('click', () => {
            modal.style.display = 'block';
            refreshNoteUI();
        });
        
        extensionsMenu.appendChild(menuItem);
        console.log('CNotes: Menu item successfully appended.');

        createModal();
        loadNotes().then(() => {
            console.log('CNotes: Initial data loaded.');
        });

        // This is the only event listener we need for functionality
        SillyTavern.getContext().eventSource.on('chatLoaded', refreshNoteUI);
        console.log('CNotes: Successfully attached to chatLoaded event.');

    } catch (error) {
        console.error('CNotes: A critical error occurred during initialization.', error);
        alert("Character Notes extension failed to initialize. Check the F12 console for details.");
    }

})();
