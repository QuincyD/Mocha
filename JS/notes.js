var notes = [];
var frequencies = [];

var baseNotes = ["C", "C#/Db", "D", "D#/Eb", "E", "F",
				 "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"];
var count = 0;
// Loop does not add the number to the sharp; 
// Number is only added to the flat, but number is implied.
for (i = 0; i < 9; i++){
	for (j = 0; j < 12; j++){
		notes[count] = baseNotes[j]+i.toString();
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
		console.log('Below lowest frequency!');
		return ['C0', (16.35 - frequency)/16.35];
	}
	if(frequency > 7902.13) {
		console.log('Above highest frequency!');
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
		return [notes[upperIndex], norm2];
	}

}