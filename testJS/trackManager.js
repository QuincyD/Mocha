function TrackManager() {
  var _this = this;
  this.trackList = [];

  // The next unique id for a track
  // Don't use this directly, use getNextId()
  this.nextId = 0;

  // Adds a blob of audio data to the track listing
  this.addTrack = function(blobUrl) {
    var audioObj = new Audio(blobUrl);
    this.trackList.push({
                        "id" : this.getNextId(),
                        "audioObj" : audioObj,
                        "muted" : false,
                       });
  };

  this.playAllTracks = function() {
    // Normalize + play tracks
    for (let i = 0; i < this.trackList.length; i++) {
      // Normalize the audio on this track
      this.trackList[i]['audioObj'].volume = 1/this.trackList.length;

      // Play this track
      this.trackList[i]['audioObj'].play();
    }
  };

  this.getNextId = function() {
    var currentId = this.nextId;
    this.nextId++;
    return currentId;
  }

  this.getTracks = function() {
    return this.trackList;
  }
}
