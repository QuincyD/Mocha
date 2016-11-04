// jshint esversion: 6

window.onload = function()
{
    var output = document.getElementById('output');
    let interactionBox = null;
    let normalized = null;
    let freq = null;

    var my_controller = new Leap.Controller({frameEventName: 'deviceFrame', enableGestures: true});
    // see Controller documentation for option details
    // my_controller.on('frame', function(frame){
    //     interactionBox = frame.interactionBox;
    //     // frame.hands.forEach(function(hand, index) {
    //     hand = frame.hands[0]
    //     if (hand && hand.palmPosition)
    //     {
    //         normalized = interactionBox.normalizePoint(hand.palmPosition);
    //         // normalized = Array.prototype.slice.call(normalized);
    //         // pos += normalized + '\n';
    //         // console.log(normalized);
    //         if(normalized[0])
    //         {
    //             freq = 200+normalized[0]*440;
    //             // console.log(freq);
    //             synth.updateFundFreq(freq);
    //         }
    //     }
    //     // });
    // });
    my_controller.on('connect', function(){
        setInterval(function(){
          var frame = my_controller.frame();
          if (frame.valid)
          {
              interactionBox = frame.interactionBox;
              hand = frame.hands[0];
              if (hand && hand.palmPosition)
              {
                  normalized = interactionBox.normalizePoint(hand.palmPosition);
                  if(normalized[0])
                  {
                      freq = 200+normalized[0]*440;
                      // console.log(freq);
                      synth.updateFundFreq(freq);
                  }
              }
          }
      }, 1);
      setInterval(function() {
          var frame = my_controller.frame();
          output.innerHTML = 'Frame: ' + frame.id;
      }, 50);
    });
    my_controller.connect();

    // Leap.loop(function (frame) {
    //     // let pos = '';
    //
    //     output.innerHTML = 'Frame: ' + frame.id;
    // });


};
