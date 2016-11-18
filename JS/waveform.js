function Waveform(audioContext) {
  var _this = this;
  this.audioCtx = audioContext;
  this.analyser = this.audioCtx.createAnalyser();

  var canvas = document.getElementById("waveformCanvas");
  var canvasCtx = canvas.getContext("2d");


  this.connectOscillators = function(oscillators) {
    for (let i = 0; i < oscillators.length; i++) {
      oscillators[i].connect(this.analyser);
    }
    connected = true;
  };

  var drawVisual;

  this.visualize = function() {
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

    this.analyser.fftSize = 2048;
    var bufferLength = this.analyser.fftSize;

    var dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    function draw() {

      drawVisual = requestAnimationFrame(draw);

      _this.analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'rgb(252, 252, 252)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(85, 175, 175)';

      canvasCtx.beginPath();

      var sliceWidth = WIDTH * 1.0 / bufferLength;
      var x = 0;

      for(var i = 0; i < bufferLength; i++) {

        var v = dataArray[i] / 128.0;
        var y = v * HEIGHT/2;

        if(i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height/2);
      canvasCtx.stroke();
    };

    draw();
  }



}
