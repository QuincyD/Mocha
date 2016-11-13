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
  var output = document.getElementById('output');   //TODO @Joe is this needed?
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

        //Updating sound
        freq = 200 + normalized[0] * 440;
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
          
          clickEle = document.elementFromPoint(cursorPos[0], cursorPos[1]);

          var evt = new MouseEvent("mousedown", {
            view: window,
            cancelable: true,
            clientX: cursorPos[0],
            clientY: cursorPos[1]
          });

          clickEle.dispatchEvent(evt);

        } else if (zone === "touching" && clicking) {
          cursorPos = LeapCursor.pos();

          var evt = new MouseEvent("mousemove", {
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
            view: window,
            cancelable: true,
            clientX: cursorPos[0],
            clientY: cursorPos[1]
          });

          var evtClick = new MouseEvent("click", {
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
