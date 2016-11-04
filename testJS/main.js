//jshint esversion: 6

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var synthesizer = new Synth();

// var tracks = synthesizer.getTracks();
