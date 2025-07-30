(function () {
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
        if (!currentCharacterId) return;
        await SillyTavern.extensions.saveExtensionSettings('Character-Notes', characterNotesData);
        console.log('Character Notes: Notes saved.');
    }

    async function loadNotes() {
        const loadedData = await SillyTavern.extensions.loadExtensionSettings('Character-Notes');
        if (loadedData) {
            characterNotesData = loadedData;
            console.log('Character Notes: Notes loaded.');
        }
    }

    // ----- UI AND EVENT FUNCTIONS -----
    function refreshNoteUI() {
        const context = SillyTavern.getContext();
        if (!context || !context.characterId) {
            if(modal && modal.style.display !== 'none') {
                SillyTavern.showToast("No character loaded.", "warning");
                modal.style.display = 'none';
            }
            return;
        }
        currentCharacterId = context.characterId;
        
        noteSelector.innerHTML = '<option value="-1" selected>-- Select a Note --</option>';
        clearInputFields();

        const notes = characterNotesData[currentCharacterId] || [];
        notes.forEach((note, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = note.title;
            noteSelector.appendChild(option);
        });
    }

    function displaySelectedNote() {
        const selectedIndex = parseInt(noteSelector.value, 10);
        const notes = characterNotesData[currentCharacterId] || [];

        if (selectedIndex >= 0 && notes[selectedIndex]) {
            const note = notes[selectedIndex];
            noteTitleInput.value = note.title;
            noteContentTextarea.value = note.text;
        } else {
            clearInputFields();
        }
    }

    function clearInputFields() {
        noteTitleInput.value = '';
        noteContentTextarea.value = '';
        noteSelector.value = "-1";
    }

    function handleSaveNote() {
        if (!currentCharacterId) {
             SillyTavern.showToast("No character loaded. Cannot save note.", "error");
             return;
        }
        const title = noteTitleInput.value.trim();
        const text = noteContentTextarea.value.trim();

        if (!title) {
            SillyTavern.showToast("Note title cannot be empty.", "error");
            return;
        }
        
        if (!characterNotesData[currentCharacterId]) {
            characterNotesData[currentCharacterId] = [];
        }

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
        if (!currentCharacterId) {
             SillyTavern.showToast("No character loaded. Cannot delete note.", "error");
             return;
        }
        const selectedIndex = parseInt(noteSelector.value, 10);
        if (selectedIndex < 0) {
            SillyTavern.showToast("No note selected to delete.", "warning");
            return;
        }

        const notes = characterNotesData[currentCharacterId];
        notes.splice(selectedIndex, 1);
        
        saveNotes();
        refreshNoteUI();
        SillyTavern.showToast("Note deleted.", "success");
    }

    function createModal() {
        if (document.getElementById('character-notes-modal')) return;
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

        noteSelector = document.getElementById('character-notes-selector');
        noteTitleInput = document.getElementById('character-notes-title');
        noteContentTextarea = document.getElementById('character-notes-textarea');

        document.getElementById('character-notes-close').addEventListener('click', () => modal.style.display = 'none');
        noteSelector.addEventListener('change', displaySelectedNote);
        document.getElementById('character-notes-new').addEventListener('click', clearInputFields);
        document.getElementById('character-notes-save').addEventListener('click', handleSaveNote);
        document.getElementById('character-notes-delete').addEventListener('click', handleDeleteNote);
        
        makeDraggable(modal);
    }
    
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = document.getElementById('character-notes-header');

        if (header) {
            header.onmousedown = function(e) {
                e = e || window.event;
                e.preventDefault();
                pos3 = e.clientX;
                pos4 = e.clientY;
                document.onmouseup = closeDragElement;
                document.onmousemove = elementDrag;
            };
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    // This function will contain all our setup logic
    async function initializeExtension() {
        console.log("Character Notes: Initializing extension...");
        
        const extensionsMenu = document.getElementById('extensionsMenu');
        
        const menuItem = document.createElement('div');
        menuItem.classList.add('list-group-item', 'flex-container', 'flexGap5', 'interactable');
        menuItem.innerHTML = `
            <i class="fa-solid fa-note-sticky"></i>
            <span>Character Notes</span>
        `;

        menuItem.addEventListener('click', () => {
            modal.style.display = 'block';
            refreshNoteUI();
        });

        extensionsMenu.appendChild(menuItem);

        createModal();
        await loadNotes();
        console.log("Character Notes: Initialization complete.");
    }
    
    // This new function waits for the UI to be ready before running our setup
    function waitForUI() {
        console.log("Character Notes: Waiting for UI to be ready...");
        const interval = setInterval(() => {
            const extensionsMenu = document.getElementById('extensionsMenu');
            if (extensionsMenu) {
                console.log("Character Notes: UI is ready, clearing interval.");
                clearInterval(interval);
                initializeExtension();
            }
        }, 100); // Check every 100ms
    }

    // Start the whole process
    SillyTavern.eventSource.on('appReady', waitForUI);
    SillyTavern.eventSource.on('chatLoaded', refreshNoteUI);

})();
