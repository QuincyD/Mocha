// jshint esversion: 6

//Object for controlling the LeapMotion cursor
var LeapCursor = (function() {
    var s = document.createElement('div');
    s.style.position = 'absolute';
    s.className = "circleBase cursor";

    return {
        //Creates a cursor object on the screen
        init: function() {
            document.body.appendChild(s);
        },

        //Updates the position of the cursor object
        update: function(e) {
            s.style.left = (e[0] * 100) + '%';
            s.style.top = ((1 - e[1]) * 100) + '%';
        },

        down: function() {
          //called when a click starts
          s.className = "circleBase cursorClick";
        },

        up: function() {
          //called when the click is released
          s.className = "circleBase cursor"
        },

        pos: function() {
          //Returns the cursor's offset with respect to the center
          let left =  s.offsetLeft;
          let top = s.offsetTop;
          return [left, top];
        }
    };
}());

function LeapMotion() {
  //Variables for the function
  var freq = null;

  //Variables specific to the Leap Motion functionality
  var frame = null;
  var interactionBox = null;
  var normalized = null;
  var hand = null;
  var emptyFrame = false;
  var clicking = false;
  var clickEle = null;

  //Setting up a new controller object for the Leap Motion
  var my_controller = new Leap.Controller({
    frameEventName: 'deviceFrame',
    enableGestures: true
  });

  function defaultSound() {
    synthesizer.changeVolume(0, true);
  };

  function validateNorm(normalized) {
    // Ensuring the normalized position stays between 0 and 1
    if (normalized[0] < 0) {
      normalized[0] = 0;
    } else if (normalized[0] > 1) {
      normalized[0] = 1;
    }

    if (normalized[1] < 0) {
      normalized[1] = 0;
    } else if (normalized[1] > 1) {
      normalized[1] = 1;
    }

    if (normalized[2] < 0) {
      normalized[2] = 0;
    }

    if (normalized[2] > 1) {
      normalized[2] = 1;
    }

    return normalized;
  };

  my_controller.on('deviceStopped', function() {
    $("#toggle-synth").prop('disabled', true);
  });

  my_controller.on('deviceStreaming', function() {
    $("#toggle-synth").prop('disabled', false);
  });

  // see Controller documentation for option details
  my_controller.on('connect', function() {
    setInterval(function() {
      frame = my_controller.frame();
      hand = null;
      emptyFrame = false;

      //Making sure the frame is valid (not sure when it is not...)
      if (! frame.valid) {
        defaultSound();
        return;
      }

      interactionBox = frame.interactionBox;

      //Determining which hand to use (prefers left)
      switch(frame.hands.length) {
        case 0:
          emptyFrame = true;
          hand = normalized = null;
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
          emptyFrame = true;
          hand = normalized = null;
          break;
      }

      //Checking if the frame was empty
      //Kinda dumb to do it this way, but the variable is needed to update the UI
      if (emptyFrame) {
        defaultSound();
        return;
      }

      //Ensuring that a hand exists with a position
      if (hand) {
        normalized = interactionBox.normalizePoint(hand.palmPosition);
        normalized = validateNorm(normalized);

        //Updating sound
        freq = synthesizer.minFreq + normalized[0] * (synthesizer.maxFreq - synthesizer.minFreq);
        synthesizer.updateFundFreq(freq, true);
        synthesizer.changeVolume(1 - normalized[1], true);
      }
    }, 4);

    setInterval(function() {
      //Ensuring a hand existed in the last frame
      if (hand) {
        //Ensuring the hand had a normalized position assigned to it
        if (normalized) {
          //Update cursor
          LeapCursor.update(normalized);
        }

        //Determining when to click
        let pointIndex = hand.finger(hand.indexFinger.id);
        let zone = pointIndex.touchZone;

        if (zone === "touching" && ! clicking) {
          LeapCursor.down();
          clicking = true;

          //creating click down event
          let cursorPos = LeapCursor.pos();
          if (! cursorPos) {
            return;
          }

          if (synthesizer.recording) {
            clickEle = document.getElementById("toggle-recording");
          } else {
            clickEle = document.elementFromPoint(cursorPos[0], cursorPos[1]);
          }

          var evt = new MouseEvent("mousedown", {
            buttons: 0,
            view: window,
            cancelable: true,
            clientX: cursorPos[0],
            clientY: cursorPos[1]
          });

          clickEle.dispatchEvent(evt);

        } else if (zone === "touching" && clicking) {
          cursorPos = LeapCursor.pos();

          var evt = new MouseEvent("mousemove", {
            buttons: 0,
            view: window,
            cancelable: true,
            clientX: cursorPos[0],
            clientY: cursorPos[1]
          });

          clickEle.dispatchEvent(evt);

        } else if (zone === "hovering" && clicking) {
          LeapCursor.up();
          clicking = false;

          //creating click up event
          let cursorPos = LeapCursor.pos();

          var evtUp = new MouseEvent("mouseup", {
            buttons: 0,
            view: window,
            cancelable: true,
            clientX: cursorPos[0],
            clientY: cursorPos[1]
          });

          var evtClick = new MouseEvent("click", {
            buttons: 0,
            view: window,
            cancelable: true,
            clientX: cursorPos[0],
            clientY: cursorPos[1]
          });

          clickEle.dispatchEvent(evtUp);
          clickEle.dispatchEvent(evtClick);

        }
      }
      tunerView2(freq)
    }, 33);

  });

  my_controller.connect();
}
