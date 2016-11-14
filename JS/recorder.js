function Recorder(audioContext) {
  var _this = this;
  this.audioCtx = audioContext;

  // Initialize the track recorder object
  this.streamDest = this.audioCtx.createMediaStreamDestination();
  this.audioChunks = [];
  this.mediaRec = new MediaRecorder(this.streamDest.stream);

  // Create and initialize the TrackManager
  this.trackManager = new TrackManager();

  // Function declarations

  this.mediaRec.ondataavailable = function(evt) {
    _this.audioChunks.push(evt.data);
  };

  this.mediaRec.onstop = function(evt) {
    var audioBlob = new Blob(_this.audioChunks, {'type': 'audio.ogg; codecs=opus'});
    var audioBlobUrl = URL.createObjectURL(audioBlob);
    _this.trackManager.addTrack(audioBlobUrl);
    _this.audioChunks = [];
  };

  this.connectOscillators = function(oscillators) {
    for (let i = 0; i < oscillators.length; i++) {
      oscillators[i].connect(this.streamDest);
    }
  };

  this.startRecording = function() {
    this.mediaRec.start();
  };

  this.stopRecording = function() {
    this.mediaRec.stop();
  };

  this.playTracks = function() {
    this.trackManager.playAllTracks();
  };

  this.stopTracks = function() {
    console.log("stopping1");
    this.trackManager.stopAllTracks();
  }

  this.getTracks = function() {
    return this.trackManager.getTracks();
  }

  this.isPlaybacking = function() {
    return this.trackManager.playingAudio;
  }

  this.exportProject = function() {
    this.trackManager.exportProject();
  }

}
