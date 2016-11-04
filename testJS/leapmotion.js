// jshint esversion: 6

function LeapMotion() {
  var output = document.getElementById('output');
  let interactionBox = null;
  let normalized = null;
  let freq = null;

  var my_controller = new Leap.Controller({
    frameEventName: 'deviceFrame',
    enableGestures: true
  });
  // see Controller documentation for option details
  my_controller.on('connect', function() {
    setInterval(function() {
      var frame = my_controller.frame();
      if (frame.valid) {
        interactionBox = frame.interactionBox;

        //Determining which hand to use (prefers left)
        switch(frame.hands.length) {
          case 0:
            hand = null;
            break;

          case 1:
            hand = frame.hands[0];
            break;

          case 2:
            if (frame.hands[0].type === "Left") {
              hand = frame.hands[0];
            } else {
              hand = frame.hands[1];
            }
            break;

          default:
            hand = null;
            break;
        }

        if (hand && hand.palmPosition) {
          normalized = interactionBox.normalizePoint(hand.palmPosition);

          //Determining click
          for (var i = 0; i < hand.pointables.length; i++) { //This check might be better to have in the UI update... need more info on how we are handling that though.
            var pointable = hand.pointables[i]

            if (pointable.type === 1) {
              var dist = pointable.touchDistance

              if (dist < 0) {
                console.log("click")
              }

              break;
            }
          }

          //Updating sound
          if (normalized[0]) {    // Not sure if this is necessary. hand.palmPosition should not be true if it does not contain anything.
            freq = 200 + normalized[0] * 440;
            synthesizer.updateFundFreq(freq);
            synthesizer.changeVolume(1 - normalized[1]);
          }
        }
      }
    }, 1);
    setInterval(function() {
      var frame = my_controller.frame();
      output.innerHTML = '<p>Frame: ' + frame.id + ' is ' + (frame.valid ? 'valid.</p>' : 'invalid.</p>');
    }, 33);
  });
  my_controller.connect();

    // Leap.loop(function (frame) {
    //     // let pos = '';
    //
    //     output.innerHTML = 'Frame: ' + frame.id;
    // });


}
