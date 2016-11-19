var color1 = 'rgb(40, 44, 52)'; // background color: gray
var color2 = '#009999'; // font color: pure blue
var color3 = 'rgb(255, 0, 0)'; // accent color: pure red
// var indicatorColor = "rgb(27, 182, 27)";
var indicatorColor = "rgb(235, 76, 76)";


var notes = [];
var frequencies = [];

var baseNotes = ["C", "C#/Db", "D", "D#/Eb", "E", "F",
				 "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"];
var count = 0;
// Loop does not add the number to the sharp;
// Number is only added to the flat, but number is implied.
for (i = 0; i < 9; i++){
	for (j = 0; j < 12; j++){
		var curNote = baseNotes[j]
		if (curNote.length > 1){
			var sides = curNote.split("/");
			curNote = sides[0] + i.toString() + "/" + sides[1] + i.toString();
		}
		else {
			curNote = curNote + i.toString();
		}
		notes[count] = curNote;
		count++;
	}
}

// formula for frequencies based on A4 (A4 = 440 Hz)
for (i = -57,j = 0; i < 51; i++, j++) {
	frequencies[j] = Math.round(440 * Math.pow(Math.pow(2, 1/12),i)*100)/100;
}

//Returns the closest note to the given frequency and the normalized distance
function getNote(frequency) {
	if(frequency < 16.35) {
		// console.log('Below lowest frequency!');
		return ['C0', (16.35 - frequency)/16.35];
	}
	if(frequency > 7902.13) {
		// console.log('Above highest frequency!');
		return ['B8',(frequency - 7902.13)/7902.13];

	}

	lowerIndex = 0
	upperIndex = 0

	for (var i = 1, len = frequencies.length; i < len; i++) {
		if (frequencies[i] > frequency) {
			lowerIndex = i - 1;
			upperIndex = i;
			break;
		}
	}

	noteDist = frequencies[upperIndex] - frequencies[lowerIndex];
	norm1 = (frequency - frequencies[lowerIndex])/noteDist;
	norm2 = (frequencies[upperIndex] - frequency)/noteDist;


	if (norm1 <= norm2) {
		return [notes[lowerIndex], norm1];
	}
	if (norm2 < norm1) {
		return [notes[upperIndex], -norm2];
	}

}

// Produces a slider that shows relative position based on the closest not.
function tunerView1(frequency) {
	var canvas = document.getElementById("tunerCanvas");
  	var canvasCtx = canvas.getContext("2d");

    var WIDTH = 500;
    var HEIGHT = 50;
  	canvas.width = WIDTH;
  	canvas.height = HEIGHT;

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var lineStartX = 20;
    var lineEndX = canvas.width - 20;
    var lineWidth = lineEndX - lineStartX;
    var lineY = canvas.height / 2;
    var mid = (lineEndX - lineStartX)/2;

    //marker size
    var markerWidth = 30;
    var markerHeight = 30;

	//draw tuner range lines
	canvasCtx.strokeStyle = color3;
    canvasCtx.moveTo(lineStartX, lineY);
	canvasCtx.lineTo(lineEndX, lineY);

	canvasCtx.moveTo(lineStartX, lineY - 10);
	canvasCtx.lineTo(lineStartX, lineY + 10);

	canvasCtx.moveTo(mid, lineY - 10);
	canvasCtx.lineTo(mid, lineY + 10);

	canvasCtx.moveTo(lineEndX, lineY - 10);
	canvasCtx.lineTo(lineEndX, lineY + 10);


	//draw range labels
	noteFreq = getNote(frequency);
	canvasCtx.font = '30px serif';
	canvasCtx.fillStyle = color3;
	canvasCtx.fillText("-1/2", lineStartX - 5, lineY + 35);
	canvasCtx.fillText(noteFreq[0], mid - 15, lineY + 35);
	canvasCtx.fillText("1/2", lineEndX - 15, lineY + 35);

	//draw note delimiter
	xPos = (lineWidth * (noteFreq[1] + 0.5)) - markerWidth/2;
	yPos = lineY - markerHeight/2;

	canvasCtx.fillStyle = color2;
	canvasCtx.fillRect(xPos, yPos, markerWidth, markerHeight);

	canvasCtx.moveTo(xPos + markerWidth/2, yPos - 5);
	canvasCtx.lineTo(xPos + markerWidth/2, yPos + markerHeight + 5);


	canvasCtx.stroke();

}

function tunerView2(frequency) {
	var canvas = document.getElementById("tunerCanvas");
  	var canvasCtx = canvas.getContext("2d");


    var WIDTH = 500;
    var HEIGHT = 50;
  	canvas.width = WIDTH;
  	canvas.height = HEIGHT;

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = color2;

    canvasCtx.beginPath();

    var midX = WIDTH/2;
    var midY = HEIGHT/2;

    var noteFreq = getNote(frequency);
    var note = noteFreq[0];
    var normFreq = noteFreq[1];

    var minusFreq = true;
    if (normFreq >= 0) {
    	minusFreq = false
    }
    var amountIndicator = Math.abs(normFreq)*10


    //draw range labels
    var threshold = 0.5;
    if (amountIndicator < threshold){
    	canvasCtx.fillStyle = indicatorColor;
    }
    else {
    	canvasCtx.fillStyle = color2;
    }
	canvasCtx.font = '30px serif';
	var notePullX = 17;
	var notePullY = 10;
	if (note.length > 3) {
		notePullX *= 3
	}
	canvasCtx.fillText(note, midX - notePullX, midY + notePullY);
	canvasCtx.stroke();

	// draw minuses
	var minStart = midX - (17*3) - 15;
	for (i = 0; i < 5; i++){
		canvasCtx.beginPath();
		canvasCtx.moveTo(minStart - i*31, midY);
		canvasCtx.lineTo(minStart - 16 - i*31, midY);
		if (minusFreq){
			if (amountIndicator < threshold){
				canvasCtx.strokeStyle = color2;
			}
			else if(amountIndicator > i) {
				canvasCtx.strokeStyle = indicatorColor;
			}
			else{
				canvasCtx.strokeStyle = color2;
			}

		}
		canvasCtx.stroke();
	}

	// draw pluses
	var plusStart = midX + (17*3) + 20;
	for (i = 0; i < 5; i++){
		canvasCtx.beginPath();
		canvasCtx.moveTo(plusStart + i*31 + 8, midY - 7);
		canvasCtx.lineTo(plusStart + i*31 + 8, midY + 7);
		canvasCtx.moveTo(plusStart + i*31, midY);
		canvasCtx.lineTo(plusStart + 16 + i*31, midY);
		if (!minusFreq){
			if (amountIndicator < threshold){
				canvasCtx.strokeStyle = color2;
			}
			else if(amountIndicator > i) {
				canvasCtx.strokeStyle = indicatorColor;
			}
			else{
				canvasCtx.strokeStyle = color2;
			}

		}
		canvasCtx.stroke();
	}

	canvasCtx.stroke();


}
