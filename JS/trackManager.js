function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function TrackManager() {
  var _this = this;
  this.trackList = {};

  // Info about the Canvas to draw Tracks on
  this.canvas = document.getElementById("trackCanvas");
  this.ctx = this.canvas.getContext("2d");
  var canvasWidth = this.canvas.width;
  var canvasHeight = this.canvas.height;

  // The next unique id for a track
  // Don't use this directly, use getNextId()
  // We start at 1 for convenience when checking if trackId exists
  // and since 0 === false...
  this.nextId = 1;

  // The number of seconds displayed on the canvas
  this.secondsToShow = 30;

  // The number of tracks to show to the user
  this.tracksToShow = 5;

  // The location of the seekbar
  this.seekbar = {
    'position': 0
  };

  // Are we currently playing audio?
  this.playingAudio = false;

  // The refresh rate of the canvas in ms
  // Used for timing of the audio playback
  this.refreshRate = 10;

  // Boolean indicating whether or not the current canvas is valid
  // Starts as false so we draw on first draw call
  this.canvasValid = false;

  // Boolean indicating whether or not we need to do a pass over the
  // tracks and mark them as correct.
  // (this is for recording and playing at the same time)
  this.tracksValid = true;

  // Marks the tracklist as invalid until validated
  this.invalidateTracks = function() {
    this.tracksValid = false;
  } //end invalidateTracks()

  // Mark all of the current tracks as valid
  this.validateTracks = function() {
    for (let i in this.trackList) {
      this.trackList[i].verified = true;
    }
    this.tracksValid = true;
  } // end validateTracks()

  // Returns the number of tracks in the trackList
  // O(n) for getting length, but O(1) on lookup is worth it
  this.getNumTracks = function() {
    var length = 0;
    for (let key in this.trackList) {
      length++;
    }
    return length;
  } // end getNumTracks()

  // Updates the seekbar's position relative to playback speed
  // and the size of the track canvas
  this.updateSeekbar = function() {
    // If we aren't playing audio, don't update
    if (!this.playingAudio) {
      return;
    }
    this.seekbar['position'] += this.refreshRate / this.secondsToShow;
  } // end updateSeekbar()

  // Resets the seekbar's position back to 0
  this.resetSeekbar = function() {
    this.seekbar['position'] = 0;
  } // end resetSeekbar()

  // Determines when all of the tracks are done playing
  // and therefore we aren't playing audio anymore
  this.updateAudioStatus = function() {
    var tracksRemaining = 0;
    for (let i in this.trackList) {
      var muted = this.trackList[i].muted;
      var played = this.trackList[i].audioObj.ended;
      var verified = this.trackList[i].verified;
      if (!muted && !played && verified) {
        tracksRemaining++;
      }
    }

    if (tracksRemaining == 0) {
      this.playingAudio = false;
    }
  } // end updateAudioStatus()

  // Converts a recorded blob of audio data into a track object
  // Adds the new track to the trackList and marks it as invalid
  // until verified upon playback.
  // parameters: blobUrl - a url pointing to a blob of audio dataArray
  this.addTrack = function(blobUrl, id_in=false, offsetTime_in=false, x_in=false) {
    // Get the next valid track id
    if (id_in) {
      var trackId = id_in;
    } else {
      var trackId = this.getNextId();
    }

    if (offsetTime_in) {
      var offsetTime = offsetTime_in;
    } else {
      var offsetTime = 0;
    }

    if (x_in) {
      var x = x_in;
    } else {
      var x = 0;
    }

    // Create an html5 audio object to hold the audio data
    var audioObj = new Audio(blobUrl);
    audioObj.preload = "auto"; // Preload metadata for duration info
    audioObj.id = "track-" + trackId; // Give it a unique name just in case

    // Once we've loaded the metadata for this audio object
    // go ahead and build the new track object and put it in trackList
    audioObj.onloadedmetadata = function() {
      var track = {};

      track.id = trackId; // Unique identifier (key in trackList)
      track.audioObj = audioObj; // Link the Audio object we just made
      track.duration = audioObj.duration; // Duration of audio (from metadata)
      track.muted = false; // Is this track muted?
      track.offsetTime = offsetTime; // How long to wait before playing track
      track.x = x; // x location on canvas
      track.y = (canvasHeight/_this.tracksToShow) * (_this.getNumTracks()); // y location on canvas
      track.w = (track.duration / _this.secondsToShow) * canvasWidth; // width on canvas
      track.h = canvasHeight/_this.tracksToShow; // height on canvas
      track.opacity = 1; // Opacity of track on canvas
      track.verified = false; // Track isn't verified until playback begins
      // Add a function for playing (a weird workaround for settimeout bug?)
      track.play = function() {
        track.audioObj.play();
      }

      // Put this new track into the trackList
      _this.trackList[trackId] = track;

      // Something new was added, redraw canvas
      _this.invalidateCanvas();

      // We added a new track, invalidate the tracklist for now
      _this.invalidateTracks();
    }

  } // end addTrack()

  // Begin playback on all the tracks in the tracklist that should be played
  // Tracks that are not muted should be played
  this.playAllTracks = function() {

    // Mark all tracks as valid since if we're about to begin playback
    // they better be valid by this point
    this.validateTracks();

    // Reset the seekbar back to position 0
    this.resetSeekbar();

    // We are now playing audio
    this.playingAudio = true;

    // Normalize volume and begin playback on all tracks
    for (let i in this.trackList) {

      // Normalize the audio on this track
      this.trackList[i].audioObj.volume = 1/this.getNumTracks();

      // Play the track if is isn't muted
      if (!this.trackList[i].muted) {
        // Play this track after its offset
        setTimeout(_this.trackList[i].play, this.trackList[i].offsetTime * 1000);
      }
    }
  } // end playAllTracks()

  // Pauses the playback on all tracks and resets their seek to 0
  this.stopAllTracks = function() {
    console.log("stopping2");
    for (let i in this.trackList) {
      this.trackList[i].audioObj.pause();
      this.trackList[i].audioObj.currentTime = 0;
      console.log(this.trackList[i].audioObj.currentTime);
    }
    // We're done playing audio if we're stopping playback
    this.playingAudio = false;
  } // end stopAllTracks()

  // Plays audio if we're not playing audio, stops it if we are
  this.togglePlayback = function() {
    if (this.playingAudio) {
      this.playingAudio = false;
      this.stopAllTracks();
    } else {
      this.playingAudio = true;
      this.playAllTracks();
    }
  } // end togglePlayback()

  // Get the next valid id (to prevent careless errors)
  this.getNextId = function() {
    var currentId = this.nextId;
    this.nextId++;
    return currentId;
  } // end getNextId()

  // [TODO] Remove this function, it isn't used
  this.getTracks = function() {
    return this.trackList;
  } // end getTracks()

  // Function to compile all of the track information to a downloadable json file
  this.exportProject = function() {

    function exportJson() {
      project['nextId'] = _this.nextId;
      project['secondsToShow'] = _this.secondsToShow;
      project['tracksToShow'] = _this.tracksToShow;
      var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project));
      $("#projectDownload").attr('href', 'data:' + data);
      $("#projectDownload").attr('download', 'mochaProject.json');
      document.getElementById('projectDownload').click();
    }

    // Function for converting blob to base64
    function blobToBase64(blob, callback, trackId) {
      var reader = new FileReader();
      reader.onload = function() {
        var dataUrl = reader.result;
        var base64 = dataUrl.split(',')[1];
        callback(base64, trackId);
      }
      reader.readAsDataURL(blob);
    }

    // Attach the base64 string to a track
    function saveBase64ToTrack(base64, trackId) {
      _this.trackList[trackId].blob = base64;
      project['tracks'].push(_this.trackList[trackId]);
    }

    // Save all of the track objects
    var project = {};
    project['tracks'] = [];
    var blobs = [];

    // For every track object, async fetch the raw blob data from the blobURL
    for (var i in this.trackList) {
      var url = this.trackList[i]['audioObj'].src;

      var xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.responseType = 'blob';

      xhr.onload = function(e) {
        var blob = new Blob([this.response], {type: 'audio/ogg'});
        blobToBase64(blob, saveBase64ToTrack, this.trackId);
      }
      xhr.send();
      xhr.trackId = i;
    }

    setTimeout(exportJson, 1000);

  }

  this.importProject = function(file) {

    function loadProject(project) {
      _this.nextId = project.nextId;
      _this.secondsToShow = project.secondsToShow;
      _this.tracksToShow = project.tracksToShow;
      _this.trackList = {};

      for (let i = 0; i < project.tracks.length; i++) {
        var base64str = project.tracks[i].blob;
        var binary = atob(base64str.replace(/\s/g, ''));
        var len = binary.length;
        var buffer = new ArrayBuffer(len);
        var view = new Uint8Array(buffer);
        for (var j = 0; j < len; j++) {
         view[j] = binary.charCodeAt(j);
        }
        var blob = new Blob( [view], { type: 'audio.ogg; codecs=opus' });
        var audioBlobUrl = URL.createObjectURL(blob);
        _this.addTrack(audioBlobUrl,
                       project.tracks[i].id,
                       project.tracks[i].offsetTime,
                       project.tracks[i].x);
      }
    }

    var reader = new FileReader();
    reader.onload = function(event) {
      var projectData = event.target.result;
      var project = JSON.parse(projectData);
      loadProject(project);
    }
    reader.readAsText(file);
  }

  $("#file-import").change(function() {
    _this.importProject(this.files[0]);
  });

  ///// UI Stuff for the track canvas /////

  // The amount of mouse movement allowed during a mouse click event
  // before a click is determined to be a drag and not a click
  this.canvas.clickThreshold = 5;

  // Given an event, returns the mouse x,y relative to the
  // clicked canvas object
  // parameters: event - a javascript event belonging to the canvas
  // return: an object {x,y} describing the x,y position of the mouse
  this.canvas.getMousePosition = function(event) {
    var rect = this.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    return { "x" : x,
             "y" : y }
  } // end getMousePosition()

  // Gets the track id of the clicked track on the canvas
  // parameters: pos - an object {x,y} describing the x,y position of the mouse
  //                   on the canvas
  // return: the track id if a track was clicked
  //         false if no track was clicked
  this.canvas.getClickedTrack = function(pos) {
    var x = pos['x'];
    var y = pos['y'];

    function inBounds(track, x, y) {
      return x >= track.x && x <= track.x + track.w && y >= track.y && y <= track.y + track.h;
    }; // end inBounds()

    for (let i in _this.trackList) {
      if (inBounds(_this.trackList[i], x, y)) {
        return _this.trackList[i].id;
      }
    }
    return false;
  } // end getClickedTrack()

  // Event called when the mouse is pressed down
  this.canvas.onmousedown = function(evt) {
    // Take note of this event happening
    this.mouseDown = true;

    // Record the current mouse position for future comparison
    var mousePos = this.getMousePosition(evt);
    this.mouseXDown = mousePos['x'];
    this.mouseYDown = mousePos['y'];

    // An offset of the mouse vs. the dragged track
    // Allows tracks to be grabbed anywhere and still act naturally
    // Mark it as 0 until we know what the offset should be
    this.dragOffset = 0;
  } // end canvas.onmousedown()

  // Event called when the mouse button is released
  this.canvas.onmouseup = function(evt) {
    // Take note of this event happening
    this.mouseDown = false;

    // Record the current mouse position for future comparison
    var mousePos = this.getMousePosition(evt);
    this.mouseXUp = mousePos['x'];
    this.mouseYUp = mousePos['y'];
  } // end canvas.onmouseup()

  // Event called when the mouse is moved over the canvas
  this.canvas.onmousemove = function(evt) {
    // If we aren't dragging something, return early
    if (!this.mouseDown) {
      return;
    }

    // Get the current mouse position
    var mousePos = this.getMousePosition(evt);

    // Find what track the mouse is currently moving over
    var clickedTrackId = this.getClickedTrack(mousePos);

    // If we aren't dragging on a track, return early
    // see: this.canvas.onmouseclick()
    if (!clickedTrackId) {
      return;
    }

    // Tiny function to calculate difference between mouseX and trackX
    function getDragOffset(track, x) {
      return (x - track.x);
    } // end getDragOffset()

    // If we don't have a dragOffset yet
    if (this.dragOffset === 0) {
      // Grab the track that our mouse is over
      let track = _this.trackList[clickedTrackId];
      let x = mousePos['x'];
      // And calculate the dragOffset
      this.dragOffset = getDragOffset(track, x);
    }

    // Calculate the new position of the track
    var newPosition = mousePos['x'] - this.dragOffset;

    // Move the track on the canvas
    _this.trackList[clickedTrackId].x = newPosition;

    // Update the offsetTime based on its new position
    _this.trackList[clickedTrackId].offsetTime = (newPosition / canvasWidth * _this.secondsToShow);

    // We updated something on the canvas, so invalidate it
    _this.invalidateCanvas();
  } // end canvas.onmousemove()

  // On click, check if we are on a track
  // Mute the track if we are
  this.canvas.onclick = function(evt) {

    // Check if this was actually a click and not a drag
    var xMove = Math.abs(this.mouseXDown - this.mouseXUp);
    var yMove = Math.abs(this.mouseYDown - this.mouseYUp);
    if (xMove + yMove > this.clickThreshold) {
      // This was a drag, so don't do anything regarding a click
      return;
    }

    var pos = this.getMousePosition(evt);
    var clickedTrackId = this.getClickedTrack(pos);

    // If a track wasn't clicked, we can just stop this function
    // since there is nothing to do
    if (!clickedTrackId) {
      return;
    }

    // Mute the track if it isn't muted
    if (_this.trackList[clickedTrackId].muted === false) {
      _this.trackList[clickedTrackId].opacity = 0.2;
      _this.trackList[clickedTrackId].muted = true;
    }
    // Otherwise, unmute it
    else {
      _this.trackList[clickedTrackId].opacity = 1.0;
      _this.trackList[clickedTrackId].muted = false;
    }

    _this.invalidateCanvas();
  } // end canvas.onclick()

  this.clearCanvas = function() {
    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  } //end clearCanvas()

  // Draw function to draw the lines separating tracks
  // [TODO] Get rid of magic number: 5
  this.drawTrackLines = function() {
    // Draw a few lines to represent tracks
    var divHeight = canvasHeight / _this.tracksToShow;
    for (var i = 0; i < _this.tracksToShow; i++) {
      this.ctx.moveTo(0, divHeight * i);
      this.ctx.lineTo(canvasWidth, divHeight * i);
      this.ctx.fillStyle = 'yellow';
      this.ctx.stroke();
    }
  } // end drawTrackLines()

  // Draw function to draw the seeking bar
  this.drawSeekingBar = function() {
    this.ctx.moveTo(this.seekbar['position'], 0);
    this.ctx.lineTo(this.seekbar['position'], canvasHeight);
    this.ctx.strokeStyle = 'black';
    this.ctx.stroke();
  } // end drawSeekingBar()

  // Draw function to draw a specific track on the canvas
  // parameters: trackId - the id of the track to draw
  this.drawTrack = function(trackId) {
    // Grab the track that we are to draw
    var thisTrack = this.trackList[trackId];

    // Check that we actually found a track
    if (typeof thisTrack === "undefined") {
      console.log("Attempting to display undefined track.");
      return false;
    }

    // Draw this track at the bottom of the track list
    var relativeWidth = (thisTrack.duration / _this.secondsToShow) * canvasWidth;
    this.ctx.beginPath();
    this.ctx.globalAlpha = thisTrack.opacity;
    this.ctx.rect(thisTrack.x, thisTrack.y, thisTrack.w, thisTrack.h);
    this.ctx.fillStyle = 'yellow';
    this.ctx.fill();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'black';
    this.ctx.stroke();

    //Set the global opacity back to 1 for everything else
    this.ctx.globalAlpha = 1;
  } // end drawTrack()

  // Function to mark the Canvas for redrawing
  this.invalidateCanvas = function() {
    this.canvasValid = false;
  } // end invalidateCanvas()

  // Main function to draw the track canvas to the screen
  this.draw = function() {
    // If the canvas needs to be redrawn, redraw it
    // Alternatively, if we are playing audio we know it needs updating
    if (!_this.canvasValid || _this.playingAudio) {
      _this.clearCanvas();
      _this.drawTrackLines();
      _this.updateAudioStatus();
      for (let i in _this.trackList) {
        _this.drawTrack(i);
      }
      _this.updateSeekbar();
      _this.drawSeekingBar();
      _this.canvasValid = true;
    }
  } // end draw()

// Every refreshRate draw the canvas
setInterval(this.draw, this.refreshRate)

} // end TrackManager()
