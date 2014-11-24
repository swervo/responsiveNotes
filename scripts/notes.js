/* global ko:false */
/* global uuid:false */
/* global iScroll:false */
/* global Note:false */

"use strict";

var notesApp;

ko.bindingHandlers.htmlValue = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        ko.utils.registerEventHandler(element, "keyup", function() {
            var modelValue = valueAccessor();
            var elementValue = element.innerHTML;
            if (ko.isWriteableObservable(modelValue)) {
                modelValue(elementValue);
            } else { //handle non-observable one-way binding
                var allBindings = allBindingsAccessor();
                if (allBindings["_ko_property_writers"] && allBindings["_ko_property_writers"].htmlValue) {
                    allBindings["_ko_property_writers"].htmlValue(elementValue);
                }
            }
            notesApp.saveCurrentNote();
        });
        ko.utils.registerEventHandler(element, "blur", function() {
            notesApp.saveCurrentNote();
        });
    },
    update: function(element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor()) || "";
        if (element.innerHTML !== value) {
            element.innerHTML = value;
        }
    }
};

ko.dataModelBindingProvider = function(bindingObject) {
    this.bindingObject = bindingObject;

    // determine if an element has any bindings
    this.nodeHasBindings = function(node) {
        return node.getAttribute ? node.getAttribute("data-bind-model") : false;
    };

    // return the bindings given a node and the bindingContext
    this.getBindings = function(node, bindingContext) {
        return {};
    };
};

function NotesDataModel() {
    // Ordered array of notes.
    this.notesArray = ko.observableArray([]);
    this.currentNoteId = ko.observable();

    // Index id -> note
    this.idsToNotes = {};

    this.checkOrder = function(changedNote) {
        // FIXME: This doesn't really work, needs fixing.
        return -1;
    };

    this.addNote = function(note) {
        var i = 0;
        var newIndex = 0;
        for (i = 0; i < this.notesArray().length; ++i) {
            if (this.notesArray()[i].modified() <= new Date(note.modified)) {
                newIndex = i;
                break;
            }
        }
        // console.log("Adding new note to index " + newIndex + ": ", note);
        // this.notesArray.splice(newIndex, 0, note);
        this.notesArray.unshift(note);
        this.idsToNotes[note.id()] = note;
        return 0;
    };
    
    this.getNumberOfNotes = function() {
        return this.notesArray().length;
    };

    this.getById = function(id) {
        var i = 0;
        var index = -1;
        console.log("NotesDataModel.getById: " + id);
        for (i = 0; i < this.notesArray().length; ++i) {
            if (this.notesArray()[i].id() === id) {
                index = i;
                break;
            }
        }
        if (index > -1) {
            return this.notesArray()[index];
        } else {
            // FIXME: Quick hack to make data-bind in html work.
            return {text: "", name: ""};
        }
    };
    
    this.getByIndex = function(id) {
        return this.notesArray()[id];
    };
}

function Notes() {
    console.log("Creating notes app.");
    // this.init();
}

Notes.prototype.uuid = {
    getId: function() {
        var newId = uuid.v4();
        // check if id has already been used
        if (this.isCached(newId)) {
            // try again
            return(this.getId());
        } else {
            return newId;
        }
    },
    
    idMemory: {},
    
    isCached: function(anId) {
        if (this.idMemory[anId]) {
            return true;
        } else {
            this.idMemory[anId] = anId;
            return false;
        }
    }
};

Notes.prototype.getInitData = function() {
    return [
        {
            "type": "note",
            "name": "New bike route",
            "text": "There is an excellent bike route that goes through Battersea Park for old times sake.",
            "modified": "2012-04-14T11:20:00.000Z",
            "_id": "1"
        },{
            "type": "note",
            "name": "Milk bottles",
            "text": "Remember to rinse and return all milk bottles. " +
                "It is good for the environment to reuse things.",
            "modified": "2012-03-14T12:22:00.000Z",
            "_id": "2"
        },{
            "type": "note",
            "name": "Tonight's meeting",
            "text": "Tonight's meeting will take place at Brown's Restaurant in Victoria Plaza",
            "modified": "2012-02-28T08:22:00.000Z",
            "_id": "3"
        },{
            "type": "note",
            "name": "To do today",
            "text": "Wash the car \n Walk the dog \n Mow the lawn \n Brush your teeth",
            "modified": "2012-02-12T08:22:00.000Z",
            "_id": "4"
        },{
            "type": "note",
            "name": "London Olympics 2012",
            "text": "We could be heroes just for one day",
            "modified": "2012-02-12T08:20:00.000Z",
            "_id": "5"
        }
    ];
};

Notes.prototype.init = function() {
    
    this.dataModel = new NotesDataModel();

    this.loadNotes();

    if (!this.dataModel.currentNoteId() && this.dataModel.notesArray().length > 0) {
        this.dataModel.currentNoteId(this.dataModel.notesArray()[0].id());
    }

    ko.applyBindings(this.dataModel);

    if (!this.noteListScroller) {
        setTimeout(function(aScope) {
            aScope.noteListScroller = new iScroll(
                "noteListWrapper",
                {hScroll: false, vScrollbar: false}
            );
        }, 500, this);
    }
    
    
    // $(window).on("beforeunload", function() {
        // var notesData = ko.mapping.toJS(this.dataModel).notesArray;
        // var notesDataJSON = ko.mapping.toJSON(notesData);
        // console.log(notesDataJSON);
        // window.localStorage["notesData"] = notesDataJSON;
    // });
    
    
};

Notes.prototype.isCurrentView = function(viewId) {
    return (this.viewModel.currentViewId() === viewId);
};

Notes.prototype.isNotesEmpty = function() {
    return (this.dataModel.notesArray.length === 0);
};

Notes.prototype.addNote = function(aMode, aSeedText) {
    // var seedText = aSeedText ? aSeedText.slice(1) : 'New note';
    var seedText = "New note";
    var note = new Note(seedText);

    note.id(this.uuid.getId());
    note.rev(0);
    this.dataModel.addNote(note);

    this.dataModel.currentNoteId(note.id());
    $("#noteBodyText").on("focus", this.onNewNoteFocus);
};

Notes.prototype.onNewNoteFocus = function() {
    var targetNode = $(this);
    if (this.hasChildNodes() && document.createRange && window.getSelection) {
        targetNode.empty();
        var range, sel;
        range = document.createRange();
        range.selectNodeContents(this);
        sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
    targetNode.off("focus");
};

Notes.prototype.openNote = function(id) {
    var note;
    
    this.hidePicker();
    console.log("Notes.openNote, id: " + id);

    this.dataModel.currentNoteId(id);

    note = this.dataModel.getById(this.dataModel.currentNoteId());
};

Notes.prototype.saveCurrentNote = function() {
    console.log("save current note");
    var notesData = ko.mapping.toJS(this.dataModel).notesArray;
    var notesDataJSON = ko.mapping.toJSON(notesData);
    window.localStorage["notesData"] = notesDataJSON;
};

Notes.prototype.loadNotes = function() {
    var i, extantNotesData, note;
    if (window.localStorage["notesData"]) {
        // read from localStorage
        extantNotesData = JSON.parse(window.localStorage["notesData"]);
        for (i = extantNotesData.length; i > 0; i--) {
            note = new Note();
            note.adopt(extantNotesData[i - 1]);
            this.dataModel.addNote(note);
        }
    } else {
        // ajaxy stuff
        // $.ajax({
        //     url: "../data/data.json",
        //     dataType: "json",
        //     async: false,
        //     context: this,
        //     success: function (data) {
        //         var i, note, index;
        //         for(i in data) {
        //             note = new Note();
        //             data[i]._id = this.uuid.getId();
        //             data[i]._rev = 0;
        //             note.adopt(data[i]);
        //             notesApp.dataModel.addNote(note);
        //         }
        //         window.localStorage["notesData"] = JSON.stringify(data);
        //
        //         if(notesApp.dataModel.notesArray.length > 0) {
        //             $(".noNotes").addClass("hidden");
        //         } else {
        //             $(".noNotes").removeClass("hidden");
        //         }
        //     },
        //     error: function (err) {
        //         console.log("loadNotes: Failed" );
        //     }
        // });
        
        // initialise notes
        extantNotesData = this.getInitData();
        for (i = extantNotesData.length; i > 0; i--) {
            note = new Note();
            note.adopt(extantNotesData[i - 1]);
            this.dataModel.addNote(note);
        }
        
    }
};

Notes.prototype.hidePicker = function() {
    //hide the picker
    $("#notePicker").toggleClass("hidden", true);
    // destroy the iScroller to be safe
    if (this.notePickerScroller) {
        this.notePickerScroller.destroy();
        this.notePickerScroller = undefined;
    }
};

Notes.prototype.showPicker = function() {
    var numOfNotes, maxNotes, pickerH;
    var noteH = 41;
    var pickerPadding = 130;
    var notePickerWrapper = $("#notePickerWrapper");
    var notePicker = $("#notePicker");
    
    if (notePicker.hasClass("hidden")) {
        // get the number of notes
        numOfNotes = this.dataModel.getNumberOfNotes();
        maxNotes = this.calcMaxLengthOfPicker();

        if (numOfNotes > maxNotes) {
            numOfNotes = maxNotes;
        }

        pickerH = (numOfNotes * noteH) + pickerPadding;

        notePicker.css("height", pickerH + "px");
        notePickerWrapper.css("height", ((numOfNotes * noteH) + 3) + "px");

        if (!this.notePickerScroller) {
            setTimeout(function(aScope) {
                aScope.notePickerScroller = new iScroll(
                    "notePickerWrapper",
                    {
                        hScroll: false,
                        vScrollbar: false
                    }
                );
            }, 0, this);
        } else {
            setTimeout(function(aScope) {
                aScope.notePickerScroller.refresh();
            }, 0, this);
        }
    }
    notePicker.toggleClass("hidden");
};

Notes.prototype.calcMaxLengthOfPicker = function() {
    var contBox = $("#noteContainer");
    var safetyMargin = 20;
    return (Math.floor((parseInt(contBox.css("height"), 10) - 130 - safetyMargin)/41));
};

Notes.prototype.isNoteEmpty = function() {
    var noteText;
    if (notesApp.dataModel.currentNote()) {
        noteText = notesApp.dataModel.currentNote().text();
        if (noteText) {
            noteText = noteText.replace(/(\r\n|\n|\r|)/gm, "");
            noteText = noteText.replace(/^\s+|\s+$/g, "");
            return noteText.length === 0;
        }
    }
    return true;
};


$(document).ready(function() {
    notesApp = new Notes();
    notesApp.init();
});
