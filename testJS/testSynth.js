//jshint esversion: 6

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// create web audio api context
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var synth = {};
synth.minFreq = 220;
synth.maxFreq = 880;

synth.updateFundFreq = function(fundFreq) {
  // Update with future harmonics
  this.oscillator.frequency.value = fundFreq;
  this.harm1.frequency.value = fundFreq * 2;
  this.harm2.frequency.value = fundFreq * 3;
  this.harm3.frequency.value = fundFreq * 4;
};

synth.changeVolume = function(element) {
  var fraction = parseInt(element.value) / parseInt(element.max);
  // Let's use an x*x curve (x-squared) since simple linear (x) does not
  // sound as good.
  this.volume.gain.value = fraction * fraction;
};

synth.detune = function(value) {
  this.oscillator.detune.value = value;
};

synth.changeHarm1Vol = function(value) {
  this.harm1vol.gain.value = value;
};

synth.changeHarm2Vol = function(value) {
  this.harm2vol.gain.value = value;
};

synth.changeHarm3Vol = function(value) {
  this.harm3vol.gain.value = value;
};

synth.changeFreq = function(element) {
  var fraction = parseInt(element.value) / parseInt(element.max);
  this.updateFundFreq(this.minFreq + (this.maxFreq - this.minFreq) * fraction);
};

synth.stop = function() {
  this.oscillator.stop();
  this.harm1.stop();
  this.harm2.stop();
  this.harm3.stop();
  return false;
};

synth.start = function() {
  // TODO: Grab values from actual sliders
  // Create gain node that controls master volume
  this.volume = audioCtx.createGain();
  this.volume.connect(audioCtx.destination);
  this.volume.gain.value = 0.7;
  // Create base oscillator
  this.oscillator = audioCtx.createOscillator();
  this.oscillator.connect(this.volume);
  // Create harmonic oscillators with independent gain control
  this.harm1 = audioCtx.createOscillator();
  this.harm2 = audioCtx.createOscillator();
  this.harm3 = audioCtx.createOscillator();
  this.harm1vol = audioCtx.createGain();
  this.harm2vol = audioCtx.createGain();
  this.harm3vol = audioCtx.createGain();
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
  this.oscillator.start();
  this.harm1.start();
  this.harm2.start();
  this.harm3.start();
  return true;
};

synth.toggle = function() {
  this.playing ? this.stop() : this.start();
  this.playing = !this.playing;
};
