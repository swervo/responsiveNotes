/* global ko:false */
/* global Note:false */

"use strict";

function Note(noteText) {
    var that = this;
    var MAXNOTENAMELENGTH = 50;

    this._id = ko.observable("");
    this._rev = ko.observable("");

    this._text = ko.observable("");

    this.type = "note";

    this.id = ko.computed({
        read: function() {
            return this._id();
        },
        write: function(value) {
            if (!this._id()) {
                this._id(value);
            } else {
                throw "Id of and existing note is not allowed to be modified.";
            }
        },
        owner: this
    });

    this.rev = ko.computed({
        read: function() {
            return this._rev();
        },
        write: function(value) {
            this._rev(value);
        },
        owner: this
    });

    this.text = ko.computed({
        read: function () {
            return that._text();
        },
        write: function (text) {
            console.log("Note.text: text changed.");

            var newName = text.substring(0, MAXNOTENAMELENGTH * 2);

            newName = newName.replace(/<br>/gi, "\n");
            newName = newName.replace(/<div>/gi, "\n");
            newName = newName.replace(/<p.*>/gi, "\n");
            newName = newName.replace(/<(?:.|\s)*?>/g, "");
            newName = newName.replace(/&nbsp;/gi, " ");
            newName = newName.replace(/\n.*/gi, "");
            newName = newName.substring(0, MAXNOTENAMELENGTH);
            newName = newName.trim();

            that._text(text);

            if (that.name() !== newName) {
                console.log("Note.text: new name is \"" + newName + "\"");
                that.name(newName);
            }

            that.modified(new Date(Date.now()));
            
            // var newPreview = text.split('\n')[0].substring(0, that.MAXNOTESPREVIEW);
            // newPreview = newPreview.replace(/(\r\n|\n|\r)/gm, ' ');
            //
            // that._text(text);
            // that.name(newPreview);
            //
            // that.modified(new Date(Date.now()));
        }
    });

    this.name = ko.observable("");

    this.modified = ko.observable(new Date(Date.now()));

    if (noteText && noteText !== undefined) {
        this.text(noteText);
    }
}

Note.prototype = {
    adopt: function(note) {
        // console.log("Note.adopt, from data: ", note);
        // Write directly these internal variables.
        this._id(note._id);
        this._rev(note._rev);

        this._text(note.text);
        this.name(note.name);
        this.modified(note.modified);
        // console.log("Note.adopt, done: ", this);
    }
};


