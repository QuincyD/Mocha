import pyaudio, csv, sys, threading
import numpy as np

# Create instances of this class using 'with Synthesizer() as synthesizer'.
# That way the __exit__ method should be automatically invoked to handle closing the audio stream
class Synthesizer(threading.Thread):
	'Contains methods to generate sin waves, update signal properties, and handle play back'

	# Need to keep interface the same across all synthesizer types, so we accept base and maxDiff
	def __init__(self, frequency, amplitude, baseFrequency, maxDiffFrequency):
		threading.Thread.__init__(self)

		# Set up signal properties
		self.frequency = frequency
		self.amplitude = amplitude
		self.phase = 0
		self.time = 0
		self.fs = 44100
		self.signal = None
		# self.noteWaves = self._getNoteWaves(self._getNoteFreqs())
		self.noteWaves = self._getNoteWaves(440, 880, 1000)

		# Create pyaudio stream
		p = pyaudio.PyAudio()
		self.stream = p.open(format=pyaudio.paFloat32,
					channels=1,
					rate=self.fs,
					output=True)

	def __enter__(self):
		return self

	def __exit__(self, exc_type, exc_value, traceback):
		self.closeStream()

	def run(self):
		rowVals = []
		with open('output.txt', 'rb') as f:
			reader = csv.reader(f)
			for row in reader:
				rowVals.append([float(i) for i in row])

		xyz = zip(*rowVals)
		minX = abs(min(xyz[0]))
		maxXAdjusted = max(xyz[0]) + minX
		normalized = [[round((row[0]+minX)/maxXAdjusted, 3), .6, row[2]]
						for row in rowVals]
		print normalized[0:5]
		print rowVals[0:5]

		for pos in normalized:
			self.play(pos)

	# def _getNoteFreqs(self):
	# 	return {
	# 		'A': 110.00,
	# 		'Bb': 116.54,
	# 		'B': 123.47,
	# 		'C': 130.81,
	# 		'Db': 138.59,
	# 		'D': 146.83,
	# 		'Eb': 155.56,
	# 		'E': 164.81,
	# 		'F': 174.61,
	# 		'Gb': 185,
	# 		'G': 196,
	# 		'Ab': 207.65,
	# 	}

	# def _getNoteWaves(self, noteFreqs):
	#
	# 	waves = {}
	# 	for note, freq in noteFreqs.iteritems():
	# 		signalDuration = (1./freq)
	# 		time = np.arange(self.fs * signalDuration)
	# 		internal = 2 * np.pi * time * freq / self.fs
	# 		signal = (np.sin(internal)).astype(np.float32)
	# 		waves[note] = signal
	#
	# 	return waves

	def _getNoteWaves(self, baseFreq, topFreq, numSteps):
		waves = []
		for freq in np.linspace(baseFreq, topFreq, numSteps):
			signalDuration = (1./freq)
			time = np.arange(self.fs * signalDuration)
			internal = 2 * np.pi * time * freq / self.fs
			signal = (np.sin(internal)).astype(np.float32)
			waves.append(signal)

		return waves

	# def _getClosestNote(self, pos):
	# 	if pos < 0.083:
	# 		return 'A'
	# 	if pos < 0.166:
	# 		return 'Bb'
	# 	if pos < 0.25:
	# 		return 'B'
	# 	if pos < 0.33:
	# 		return 'C'
	# 	if pos < 0.4167:
	# 		return 'Db'
	# 	if pos < 0.500:
	# 		return 'D'
	# 	if pos < 0.583:
	# 		return 'Eb'
	# 	if pos < 0.666:
	# 		return 'E'
	# 	if pos < 0.750:
	# 		return 'F'
	# 	if pos < 0.833:
	# 		return 'Gb'
	# 	if pos < 0.9167:
	# 		return 'G'
	# 	return 'Ab'

	def playSignal(self, signal):
		# Write signal to the stream
		self.stream.write(self.amplitude*signal)

	def play(self, pos):
		if pos[1] > 0.5:
			# closest = self._getClosestNote(pos[0])
			# self.playSignal(self.noteWaves[closest])

			# Assuming normalized position data rounded to the thousandths place
			# Create the index (making simple wrap-around for largest elements)
			i = int(pos[0] * 1000) % 1000
			for repeat in range(0, 20):
				self.playSignal(self.noteWaves[i])

	def closeStream(self):
		self.stream.stop_stream()
		self.stream.close()


if __name__ == "__main__":
	with Synthesizer(880, 1.0, 230, 880) as synthesizer:
		synthesizer.run()
