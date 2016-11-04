// jshint esversion: 6

function Synth() {
  var _this = this;

  this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  this.minFreq = 150;
  this.maxFreq = 650;
  this.maxAmp = .75;
  this.numHarm = 3;
  this.harmOscillators = [];
  this.harmGains = [];
  this.harmSliders = [];
  this.volumeSlider = null;
  this.freqSlider = null;

  this.recorder = new Recorder(this.audioCtx);

  // Use function return to create callbacks to avoid creating closures inline
  function createOnInput(i) {
    return function() {
      synthesizer.changeHarmVol(this.value, i);
    };
  }

  this.init = function() {
    _this.waveform = new Waveform(_this.audioCtx);

    // Create the harmonic sliders
    let x;
    let harmonicDiv = document.getElementById("harmonicSliders");
    this.volumeSlider = document.getElementById("masterVolume");
    this.freqSlider = document.getElementById("fundamentalFrequency");
    this.freqSlider.min = this.minFreq;
    this.freqSlider.max = this.maxFreq;
    let mid = Math.floor((this.maxFreq + this.minFreq) / 2);
    this.updateFreqSlider(this.minFreq, this.maxFreq, mid);
    for(let i = 0; i < this.numHarm; ++i)
    {
      x = document.createElement("INPUT");
      x.setAttribute("type", "range");
      x.min = "0";
      x.max = ".5";
      x.step = ".01";
      x.value = ".1";
      x.oninput = createOnInput(i);
      harmonicDiv.appendChild(x);

      this.harmSliders.push(x);
    }
  };

  this.updateFreqSlider = function(minVal, maxVal, value)
  {
    this.freqSlider.min = minVal;
    this.freqSlider.max = maxVal;
    this.freqSlider.value = value;
  };

  this.updateFundFreq = function(fundFreq, fromLeap=false) {
    if (this.oscillator)
    {
      this.oscillator.frequency.value = fundFreq;
      for(let i = 0; i < this.numHarm; ++i)
      {
        this.harmOscillators[i].frequency.value = fundFreq * (i + 2);
      }

      if(fromLeap)
      {
        this.freqSlider.value = fundFreq;
      }
    }
  };

  this.changeVolume = function(normalized, fromLeap=false)
  {
    if (this.volume)
    {
      this.volume.gain.value = normalized * normalized * this.maxAmp;

      if (fromLeap)
      {
        this.volumeSlider.value = normalized;
      }
    }
  };

  this.detune = function(value) {
    this.oscillator.detune.value = value;
  };

  this.changeHarmVol = function(volume, index) {
    if (this.harmGains.length) {
      this.harmGains[index].gain.value = volume;
    }
  };

  this.changeFreq = function(element) {
    var fraction = parseInt(element.value) / parseInt(element.max);
    this.updateFundFreq(this.minFreq + (this.maxFreq - this.minFreq) * fraction);
  };

  this.stop = function() {
    this.oscillator.stop();
    for(let i = 0; i < this.numHarm; ++i)
    {
      this.harmOscillators[i].stop();
    }
    return false;
  };

  this.start = function() {
    // TODO: Grab values from actual sliders
    // Create gain node that controls master volume
    this.volume = this.audioCtx.createGain();
    this.volume.connect(this.audioCtx.destination);
    this.changeVolume(parseFloat(this.volumeSlider.value));
    // this.volume.gain.value = 0.7 * this.maxAmp;
    // Create base oscillator
    this.oscillator = this.audioCtx.createOscillator();
    this.oscillator.connect(this.volume);
    // Create harmonic oscillators with independent gain control
    this.harmOscillators = [];
    this.harmGains = [];
    for(let i = 0; i < this.numHarm; ++i)
    {
      this.harmOscillators.push(this.audioCtx.createOscillator());
      this.harmGains.push(this.audioCtx.createGain());
      this.harmGains[i].connect(this.volume);
      // TODO: grab slider values
      this.harmGains[i].gain.value = parseFloat(this.harmSliders[i].value);
      this.harmOscillators[i].connect(this.harmGains[i]);
    }

    this.updateFundFreq(parseFloat(this.freqSlider.value));

    // Connect the master gain slider to the recorder
    this.recorder.connectOscillators([this.volume]);
    this.waveform.connectOscillators([this.volume]);

    this.oscillator.start();
    for (let i = 0; i < this.numHarm; ++i)
    {
      this.harmOscillators[i].start();
    }
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
  };

  this.getTracks = function() {
    return this.recorder.getTracks();
  };
}
