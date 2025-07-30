(function () {
    // Data store for all notes, keyed by character ID
    let characterNotesData = {};
    let currentCharacterId = null;

    // UI Elements
    let modal;
    let noteSelector;
    let noteTitleInput;
    let noteContentTextarea;

    // Function to save all notes to a file
    async function saveNotes() {
        if (!currentCharacterId) return;
        // Using SillyTavern's extension settings to save data
        await SillyTavern.extensions.saveExtensionSettings('Character-Notes', characterNotesData);
        console.log('Character Notes saved.');
    }

    // Function to load notes from the file
    async function loadNotes() {
        const loadedData = await SillyTavern.extensions.loadExtensionSettings('Character-Notes');
        if (loadedData) {
            characterNotesData = loadedData;
            console.log('Character Notes loaded.');
        }
        refreshNoteUI();
    }
    
    // Refresh the entire UI (dropdown, fields) based on the current character
    function refreshNoteUI() {
        const context = SillyTavern.getContext();
        currentCharacterId = context.characterId;
        
        // Clear previous options
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

    // Display a selected note in the input fields
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

    // Clear the input fields for a new note
    function clearInputFields() {
        noteTitleInput.value = '';
        noteContentTextarea.value = '';
        noteSelector.value = "-1";
    }

    // Handle the "Save" button click
    function handleSaveNote() {
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

        if (selectedIndex >= 0) { // Updating an existing note
            notes[selectedIndex] = { title, text };
        } else { // Creating a new note
            notes.push({ title, text });
        }

        saveNotes();
        refreshNoteUI();
        SillyTavern.showToast("Note saved successfully!", "success");
    }

    // Handle the "Delete" button click
    function handleDeleteNote() {
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

    // Function to create the floating modal
    function createModal() {
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

        // Assign UI elements to variables
        noteSelector = document.getElementById('character-notes-selector');
        noteTitleInput = document.getElementById('character-notes-title');
        noteContentTextarea = document.getElementById('character-notes-textarea');

        // Add event listeners
        document.getElementById('character-notes-close').addEventListener('click', () => modal.style.display = 'none');
        noteSelector.addEventListener('change', displaySelectedNote);
        document.getElementById('character-notes-new').addEventListener('click', clearInputFields);
        document.getElementById('character-notes-save').addEventListener('click', handleSaveNote);
        document.getElementById('character-notes-delete').addEventListener('click', handleDeleteNote);
        
        // Make the modal draggable
        makeDraggable(modal);
    }
    
    // Utility to make the modal draggable
    function makeDraggable(element) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        const header = document.getElementById('character-notes-header');

        header.onmousedown = function(e) {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        };

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

    // This function runs when SillyTavern is ready
    SillyTavern.eventSource.on('appReady', () => {
        // Create the button to open the notes
        const notesButton = document.createElement('div');
        notesButton.className = 'character-button';
        notesButton.innerHTML = `<i class="fa-solid fa-note-sticky"></i><span>Notes</span>`;
        notesButton.addEventListener('click', () => {
            modal.style.display = 'block';
            refreshNoteUI();
        });

        // Add the button to the character panel
        const buttonsContainer = document.querySelector('#char_book_anchor');
        if (buttonsContainer) {
            buttonsContainer.insertAdjacentElement('beforebegin', notesButton);
        }

        createModal();
        loadNotes();
    });

    // This function runs every time a new character chat is loaded
    SillyTavern.eventSource.on('chatLoaded', refreshNoteUI);

})();
