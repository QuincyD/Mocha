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
  this.distortion = this.audioCtx.createWaveShaper();
  this.isDistortion = false;


  // Use function return to create callbacks and avoid creating closures inline
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
    this.metronome = new Metronome(this.audioCtx);

    // Initialize distortion curve
    this.distortion.curve = makeDistortionCurve(80);
    this.distortion.oversample = '4x';

    // Create the harmonic sliders
    let x, div, perc = 100/this.numHarm;
    let harmonicDiv = document.getElementById("harmonicSliders");

    for(let i = 0; i < this.numHarm; ++i)
    {
      // Create container divs for the columns
      div = document.createElement("DIV");
      div.setAttribute("style", `float: left; width: ${perc}%;`);

      // Create sliders for the harmonics
      x = document.createElement("INPUT");
      x.setAttribute("type", "range");
      x.setAttribute('orient','vertical');
      x.setAttribute('class', 'harmonic-slider');
      x.min = "0";
      x.max = ".5";
      x.step = ".01";
      x.value = ".1";
      x.oninput = createOnInput(i);

      // Add to the html
      div.appendChild(x);
      harmonicDiv.appendChild(div);

      this.harmSliders.push(x);
    }
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
    }
  };

  this.changeVolume = function(normalized, fromLeap=false)
  {
    if (this.volume && normalized >= 0)
    {
      this.volume.gain.value = normalized * normalized * this.maxAmp;
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

  this.stop = function() {
    // Stop the oscillators
    this.oscillator.stop();
    for(let i = 0; i < this.numHarm; ++i)
    {
      this.harmOscillators[i].stop();
    }
    // Disconnect the end nodes to allow garbage collection
    this.distortion.disconnect();
    this.volume.disconnect();
    return false;
  };

  this.start = function() {
    // Create gain node that controls master volume as well as connect distortion if necessary
    this.volume = this.audioCtx.createGain();
    let endNode = this.isDistortion ? this.distortion : this.volume;
    if (this.isDistortion)
      this.volume.connect(this.distortion);
    endNode.connect(this.audioCtx.destination);
    this.changeVolume(0.0);

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

    // Set initial frequency to be 440 as a placeholder
    this.updateFundFreq(440);

    // Connect the master gain slider to the recorder
    this.recorder.connectOscillators([endNode]);
    this.waveform.connectOscillators([endNode]);

    // Start oscillators and visualization
    this.oscillator.start();
    for (let i = 0; i < this.numHarm; ++i)
    {
      this.harmOscillators[i].start();
    }
    this.waveform.visualize();
    return true;
  };

  this.toggle = function() {
    this.playing ? this.stop() : this.start();
    this.playing = !this.playing;

    if (this.recording)
    {
      $('#toggle-recording').trigger('click');
    }
  };

  this.toggleRecording = function() {
    if (this.playing)
    {
      this.recording ? this.recorder.stopRecording() : this.recorder.startRecording();
      this.recording = !this.recording;
    }
  };

  this.toggleMetronome = function() {
    this.playMetronome ? this.metronome.stop() : this.metronome.start();
    this.playMetronome = !this.playMetronome;
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
