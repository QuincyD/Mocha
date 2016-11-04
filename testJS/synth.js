function Synth() {
  var _this = this;

  this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  this.minFreq = 220;
  this.maxFreq = 880;

  this.recorder = new Recorder(this.audioCtx);

  this.init = function() {
    _this.waveform = new Waveform(_this.audioCtx);
  };

  this.updateFundFreq = function(fundFreq) {
    // Update with future harmonics
    this.oscillator.frequency.value = fundFreq;
    this.harm1.frequency.value = fundFreq * 2;
    this.harm2.frequency.value = fundFreq * 3;
    this.harm3.frequency.value = fundFreq * 4;
  };

  this.changeVolume = function(element) {
    var fraction = parseInt(element.value) / parseInt(element.max);
    this.volume.gain.value = fraction * fraction;
  };

  this.detune = function(value) {
    this.oscillator.detune.value = value;
  };

  this.changeHarm1Vol = function(value) {
    this.harm1vol.gain.value = value;
  };

  this.changeHarm2Vol = function(value) {
    this.harm2vol.gain.value = value;
  };

  this.changeHarm3Vol = function(value) {
    this.harm3vol.gain.value = value;
  };

  this.changeFreq = function(element) {
    var fraction = parseInt(element.value) / parseInt(element.max);
    this.updateFundFreq(this.minFreq + (this.maxFreq - this.minFreq) * fraction);
  };

  this.stop = function() {
    this.oscillator.stop();
    this.harm1.stop();
    this.harm2.stop();
    this.harm3.stop();
    return false;
  };

  this.start = function() {
    // TODO: Grab values from actual sliders
    // Create gain node that controls master volume
    this.volume = this.audioCtx.createGain();
    this.volume.connect(this.audioCtx.destination);
    this.volume.gain.value = 0.7;
    // Create base oscillator
    this.oscillator = this.audioCtx.createOscillator();
    this.oscillator.connect(this.volume);
    // Create harmonic oscillators with independent gain control
    this.harm1 = this.audioCtx.createOscillator();
    this.harm2 = this.audioCtx.createOscillator();
    this.harm3 = this.audioCtx.createOscillator();
    this.harm1vol = this.audioCtx.createGain();
    this.harm2vol = this.audioCtx.createGain();
    this.harm3vol = this.audioCtx.createGain();
    this.harm1vol.connect(this.volume);
    this.harm2vol.connect(this.volume);
    this.harm3vol.connect(this.volume);
    this.harm1vol.gain.value = 0.3;
    this.harm2vol.gain.value = 0.3;
    this.harm3vol.gain.value = 0.3;
    this.harm1.connect(this.harm1vol);
    this.harm2.connect(this.harm2vol);
    this.harm3.connect(this.harm3vol);

    this.updateFundFreq(440);

    // Connect the master gain slider to the recorder
    this.recorder.connectOscillators([this.volume]);
    this.waveform.connectOscillators([this.volume]);

    this.oscillator.start();
    this.harm1.start();
    this.harm2.start();
    this.harm3.start();
    this.waveform.visualize();
    return true;
  };

  this.toggle = function() {
    this.playing ? this.recorder.stopRecording() : this.recorder.startRecording();
    this.playing ? this.stop() : this.start();
    this.playing = !this.playing;
  };

  this.playback = function() {
    this.recorder.playTracks();
  }

  this.getTracks = function() {
    return this.recorder.getTracks();
  }
}
