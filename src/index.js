import { parseArrayBuffer } from 'midi-json-parser';
import { emitAppEvent, subscribeAppEvent } from './appEvent';
import outputElement from './outputElement';

for (const element of document.getElementsByClassName('fileInputContainer')) {
    element.addEventListener('click', event => {
        const inputElements = event.target.parentElement.getElementsByTagName('input');
        for (const inputElement of inputElements) {
            if (inputElement.type === 'file') {
                inputElement.click();
            }
        }
    });
}

document.getElementById('fileInput').addEventListener('change', event => {
    outputElement.hide();
    if (!event.target || !event.target.files || !event.target.files.length) {
        outputElement.write('error', 'No file selected');
        return;
    }
    const file = event.target.files[0];
    emitAppEvent('fileUploaded', file);
});

subscribeAppEvent('fileUploaded', async midiFile => {
    const parsedMidi = await parseArrayBuffer(await midiFile.arrayBuffer());
    const noteTracks = parsedMidi.tracks.filter(track => track.find(midiEvent => midiEvent.noteOn || midiEvent.noteOff));
    if (noteTracks.length === 0) {
        outputElement.write('error', 'MIDI file has no tracks.');
        return;
    }
    if (noteTracks.length > 1) {
        emitAppEvent('multipleTracksUploaded', noteTracks);
        return;
    }
    emitAppEvent('fileParsed', noteTracks[0]);
});

subscribeAppEvent('fileUploaded', () => {
    const trackSelectionContainerElement = document.getElementById('trackSelection');
    trackSelectionContainerElement.style.display = 'none';
});

subscribeAppEvent('fileUploaded', midiFile => {
    const labelElement = document.getElementById('fileInputLabel');
    labelElement.innerText = midiFile.name;
});

subscribeAppEvent('multipleTracksUploaded', noteTracks => {
    const trackSelectionContainerElement = document.getElementById('trackSelection');
    const trackSelectElement = document.getElementById('trackSelect');
    while (trackSelectElement.options.length > 0) {
        trackSelectElement.remove(0);
    }
    const defaultOptionElement = document.createElement('option');
    defaultOptionElement.value = NaN;
    defaultOptionElement.innerText = 'Select...';
    trackSelectElement.add(defaultOptionElement);
    noteTracks.forEach((track, trackIndex) => {
        const trackNameEvent = track.find(midiEvent => midiEvent.trackName);
        const trackName = trackNameEvent ? trackNameEvent.trackName : `Track ${trackIndex + 1}`;
        const optionElement = document.createElement('option');
        optionElement.value = trackIndex;
        optionElement.innerText = trackName;
        trackSelectElement.add(optionElement);
    });

    trackSelectElement.onchange = () => {
        if (!isNaN(trackSelectElement.value) && trackSelectElement.value < noteTracks.length) {
            emitAppEvent('fileParsed', noteTracks[trackSelectElement.value]);
        }
    };

    trackSelectionContainerElement.style.display = 'block';
});

subscribeAppEvent('fileParsed', (midiEvents) => {
    const melodyNoteEvents = midiEvents.filter(midiEvent => midiEvent.noteOn || midiEvent.noteOff);
    const relevantNoteEvents = melodyNoteEvents.map(noteEvent => ({
        type: noteEvent.noteOn ? 'on' : 'off',
        noteNumber: (noteEvent.noteOn || noteEvent.noteOff).noteNumber,
        deltaTime: noteEvent.delta,
    }));
    
    const notes = [];
    relevantNoteEvents.forEach((noteEvent, startI) => {
        if (noteEvent.type !== 'on') {
            return;
        }

        const startTime = relevantNoteEvents
            .slice(0, startI + 1)
            .reduce((sum, ne) => sum + ne.deltaTime, 0);

        const endI = relevantNoteEvents
            .findIndex((otherNoteEvent, i) =>
                otherNoteEvent.type === 'off' &&
                otherNoteEvent.noteNumber === noteEvent.noteNumber &&
                !otherNoteEvent.processed &&
                i > startI
            );
        if (endI === -1) {
            outputElement.write('error', 'MIDI file is malformed.');
            return;
        }
        relevantNoteEvents[endI].processed = true;

        const duration = relevantNoteEvents
            .slice(startI, endI + 1)
            .reduce((sum, ne) => sum + ne.deltaTime, 0) - noteEvent.deltaTime;
        notes.push({
            noteNumber: noteEvent.noteNumber,
            duration: duration,
            startTime: startTime,
        });
    });

    const notesWithPauses = [];
    notes.forEach((note, i) => {
        notesWithPauses.push(note);

        if (i + 1 < notes.length) {
            const nextNote = notes[i + 1];
            if (nextNote.startTime > note.startTime + note.duration) {
                notesWithPauses.push({
                    noteNumber: NaN,
                    duration: nextNote.startTime - note.startTime + note.duration,
                    startTime: note.startTime + note.duration,
                });
            }
        }
    });

    emitAppEvent('notesParsed', notesWithPauses);
});

const shawzinScales = {
    pentatonicMinor: [48, 51, 53, 55, 58, 60, 63, 65, 67, 70, 72, 75],
    pentatonicMajor: [48, 50, 52, 55, 57, 60, 62, 64, 67, 69, 72, 74],
    chromatic:       [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    hexatonic:       [48, 51, 53, 54, 55, 58, 60, 63, 65, 66, 67, 70],
    major:           [48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67],
    minor:           [48, 50, 51, 53, 55, 56, 58, 60, 62, 63, 65, 67],
    hirajoshi:       [48, 49, 53, 54, 58, 60, 61, 65, 66, 69, 72, 73],
    phrygian:        [48, 49, 52, 53, 55, 56, 58, 60, 61, 64, 65, 67],
    yo:              [49, 51, 54, 56, 58, 61, 63, 66, 68, 70, 73, 75],
};

subscribeAppEvent('notesParsed', notes => {
    const shawzinMinNote = Object.values(shawzinScales).reduce((min, scale) => scale[0] < min ? scale[0] : min, Infinity);
    const shawzinMaxNote = Object.values(shawzinScales).reduce((max, scale) => scale[scale.length - 1] > max ? scale[scale.length - 1] : max, -Infinity);
    const shawzinScalesRange = shawzinMaxNote - shawzinMinNote;

    const minNote = notes.reduce((min, note) => !isNaN(note.noteNumber) && note.noteNumber < min ? note.noteNumber : min, Infinity);
    const maxNote = notes.reduce((max, note) => !isNaN(note.noteNumber) && note.noteNumber > max ? note.noteNumber : max, -Infinity);
    const noteRange = maxNote - minNote;
    if (noteRange > shawzinScalesRange) {
        outputElement.write('error', 'Melody range is too wide.');
        return;
    }

    const noteNumbers = notes
        .map(note => note.noteNumber)
        .filter((noteNumber, i, numbersSoFar) => !isNaN(noteNumber) && !numbersSoFar.slice(0, i).includes(noteNumber));

    const [scaleName, transposition] = (() => {
        const minTransposition = shawzinMinNote - minNote;
        const maxTransposition = shawzinMaxNote - maxNote;

        let scale = null;
        let matchedTransposition = NaN;
        for(let testedTransposition = minTransposition; testedTransposition <= maxTransposition && !scale; ++testedTransposition) {
            const transposedNoteNumbers = noteNumbers.map(noteNumber => noteNumber + testedTransposition);
            Object.entries(shawzinScales).forEach(([testedScaleName, testedScale]) => {
                let allInScale = true;
                transposedNoteNumbers.forEach(noteNumber => {
                    if (!testedScale.includes(noteNumber)) {
                        allInScale = false;
                    }
                });
                if (allInScale) {
                    scale = testedScaleName;
                    matchedTransposition = testedTransposition;
                }
            });
        }
        return [scale, matchedTransposition];
    })();

    if (!scaleName || isNaN(transposition)) {
        outputElement.write('error', 'Could not fit melody to Shawzin-compatible scale and range');
        return;
    }

    emitAppEvent('scaleDetected', notes, scaleName, transposition);
});

subscribeAppEvent('scaleDetected', (notes, scaleName, transposition) => {
    const measureDuration = 768;
    const shawzinScale = shawzinScales[scaleName];
    const shawzinBaseNote = shawzinScale[0];
    const normalizedShawzinScale = shawzinScale.map(note => note - shawzinBaseNote);
    const shawzinNotes = notes
        .filter(note => !isNaN(note.noteNumber))
        .map(note => ({
            note: note.noteNumber + transposition - shawzinBaseNote,
            measure : Math.floor(note.startTime / measureDuration),
            position: Math.floor((Math.floor(note.startTime) % measureDuration / measureDuration) * 64),
        }));
    const mergedNotes = [];
    let skipCounter = 0;
    shawzinNotes.forEach((shawzinNote, i) => {
        if (skipCounter > 0) {
            --skipCounter;
            return;
        }

        const mergedNote = {
            notes: [shawzinNote.note],
            measure: shawzinNote.measure,
            position: shawzinNote.position,
        };
        
        if (i + 1 < shawzinNotes.length) {
            const shawzinNotesPlaySimultaneously = (note1, note2) => {
                return note1.measure === note2.measure && note1.position === note2.position;
            };

            if (shawzinNotesPlaySimultaneously(shawzinNote, shawzinNotes[i + 1])) {
                mergedNote.notes.push(shawzinNotes[i + 1].note);
                ++skipCounter;

                if (i + 2 < shawzinNotes.length && shawzinNotesPlaySimultaneously(shawzinNote, shawzinNotes[i + 2])) {
                    mergedNote.notes.push(shawzinNotes[i + 2].note);
                    ++skipCounter;
                }

                mergedNote.notes = mergedNote.notes.sort();
            }
        }

        mergedNotes.push(mergedNote);
    });

    const shawzinTabs = mergedNotes
        .map(shawzinMergedNote => {
            const maxNote = shawzinMergedNote.notes[shawzinMergedNote.notes.length - 1];
            const noteIndex = normalizedShawzinScale.findIndex(scaleNote => scaleNote === maxNote);
            return {
                fret: Math.floor(noteIndex / 3),
                string: noteIndex - 3*Math.floor(noteIndex / 3),
                measure: shawzinMergedNote.measure,
                position: shawzinMergedNote.position,
            };
        })
        .filter(shawzinTab => shawzinTab.measure < 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+,/'.length);

    const scaleNotation = (Object.keys(shawzinScales).findIndex(testedScaleName => testedScaleName === scaleName) + 1).toString();
    const notesNotation = shawzinTabs.map(shawzinTab => {
        const tabToNotation = (fret, string) => {
            return [
                ['B', 'C', 'E'],
                ['J', 'K', 'M'],
                ['R', 'S', 'U'],
                ['h', 'i', 'k'],
            ][fret][string];
        };
        const numberToNotation = (number) => {
            return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+,/'[number];
        };
        return `${tabToNotation(shawzinTab.fret, shawzinTab.string)}${numberToNotation(shawzinTab.measure)}${numberToNotation(shawzinTab.position)}`;
    }).join('');

    emitAppEvent('notationCreated', `${scaleNotation}${notesNotation}`);
});

subscribeAppEvent('notationCreated', notation => {
    outputElement.write(null, notation);
});
