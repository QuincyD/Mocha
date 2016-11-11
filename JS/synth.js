// jshint esversion: 6

function Synth() {
  var _this = this;

  this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  this.minFreq = 150;
  this.maxFreq = 650;
  this.maxAmp = 0.75;
  this.numHarm = 3;
  this.harmOscillators = [];
  this.harmGains = [];
  this.harmSliders = [];
  this.volumeSlider = null;
  this.freqSlider = null;
  this.distortion = this.audioCtx.createWaveShaper();
  this.isDistortion = false;


  // Use function return to create callbacks to avoid creating closures inline
  function createOnInput(i) {
    return function() {
      synthesizer.changeHarmVol(this.value, i);
    };
  }

  function makeDistortionCurve( amount ) {
    var k = typeof amount === 'number' ? amount : 50,
      n_samples = 44100,
      curve = new Float32Array(n_samples),
      deg = Math.PI / 180,
      i = 0,
      x;
    for ( ; i < n_samples; ++i ) {
      x = i * 2 / n_samples - 1;
      curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
    }
    return curve;
}

  this.init = function() {
    _this.waveform = new Waveform(_this.audioCtx);
    this.recorder = new Recorder(this.audioCtx);

    // Initialize distortion curve
    this.distortion.curve = makeDistortionCurve(400);
    this.distortion.oversample = '4x';

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
      // setTargetAtTime allows us to smoothly transition between frequencies
      // NOTE: we may be able to leverage this function to greatly reduce leap motion polling time,
      //       but I couldn't find a way to not mess up phase of harmonics
      // this.oscillator.frequency.setTargetAtTime(fundFreq, this.audioCtx.currentTime, 0.01);
      this.oscillator.frequency.value = fundFreq;
      for(let i = 0; i < this.numHarm; ++i)
      {
        // this.harmOscillators[i].frequency.setTargetAtTime(fundFreq * (i + 2), this.audioCtx.currentTime, 0.01);
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
    this.distortion.disconnect();
    this.volume.disconnect();
    return false;
  };

  this.start = function() {
    // TODO: Grab values from actual sliders
    // Create gain node that controls master volume
    this.volume = this.audioCtx.createGain();
    let endNode = this.isDistortion ? this.distortion : this.volume;
    if (this.isDistortion)
      this.volume.connect(this.distortion);
    endNode.connect(this.audioCtx.destination);
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
    this.recorder.connectOscillators([endNode]);
    this.waveform.connectOscillators([endNode]);

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

  this.toggleDistortion = function() {
    this.isDistortion = !this.isDistortion;
  };

  this.playback = function() {
    this.recorder.isPlaybacking() ? this.recorder.stopTracks() : this.recorder.playTracks();
  };

  this.getTracks = function() {
    return this.recorder.getTracks();
  };
}
