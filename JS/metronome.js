// Web audio based metronome --------------------------
function Metronome(audioContext)
{
  this.audioCtx = audioContext;

  var timer, noteCount, counting;
  var woodblock;
  var freq = 330;
  var _this = this;
  var delta = 0;
  var curTime = 0.0;

  // Fetch the wav file for the metronome
	var getSound = new XMLHttpRequest(); // Load the Sound with XMLHttpRequest
  // Woodblock file from: https://www.freesound.org/people/kwahmah_02/sounds/268822/
	getSound.open("GET", "sounds/woodblock.wav", true);
	getSound.responseType = "arraybuffer"; // Read as Binary Data
	getSound.onload = function() {
		_this.audioCtx.decodeAudioData(getSound.response, function(buffer){
			woodblock = buffer; // Decode the Audio Data and Store it in a Variable
		});
	}
	getSound.send();

  /*
  Based off: http://www.html5rocks.com/en/tutorials/audio/scheduling/
  */
  this.schedule = function() {
    while(curTime < _this.audioCtx.currentTime + 0.1) {
      _this.playNote(curTime);
      _this.updateTime();
    }
    timer = window.setTimeout(_this.schedule, 0.1);
  };

  this.updateTime = function() {
    curTime += 60.0 / parseInt($("#bpm-value").val(), 10);
    // noteCount++;
  };

  /* Play note on a delayed interval of t */
  this.playNote = function(t) {
    let playSound = this.audioCtx.createBufferSource();
		playSound.buffer = woodblock;
		playSound.connect(this.audioCtx.destination);
		playSound.start(t);
    playSound.stop(t + 0.5);

    // Old oscillator based synth
    // let note = this.audioCtx.createOscillator();
    //
    // // note.frequency.value = 250;
    // note.connect(this.audioCtx.destination);
    //
    // note.frequency.setValueAtTime(fre, t);
    // note.frequency.exponentialRampToValueAtTime(0.01, t + 0.5);
    //
    // note.start(t);
    // note.stop(t + 0.05);
  };

  // this.countDown = function() {
  //   var t = $(".timer");
  //
  //   if( parseInt(t.val(), 10) > 0 && counting === true)
  //   {
  //       t.val( parseInt(t.val(), 10) - 1 );
  //       window.setTimeout(countDown, 1000);
  //   }
  //   else
  //   {
  //     $(".play-btn").click();
  //     t.val(60);
  //   }
  // };

  this.start = function()
  {
    curTime = this.audioCtx.currentTime;
    // noteCount = parseInt($(".ts-top").val(), 10);
    this.schedule();
  };

  this.stop = function()
  {
    window.clearInterval(timer);
  };
}
