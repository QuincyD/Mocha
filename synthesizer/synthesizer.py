import pyaudio
import numpy as np
import time
# import matplotlib as mpl
# mpl.rcParams['backend'] = "qt4agg"
# mpl.rcParams['backend.qt4'] = "PySide"
#from matplotlib.pyplot import figure, show
import csv
import sys
import threading
import logging
import Queue

logger = logging.getLogger(name='MochaLogger')

# Create instances of this class using 'with Synthesizer() as synthesizer'.
# That way the __exit__ method should be automatically invoked to handle closing the audio stream
class Synthesizer(threading.Thread):
	'Contains methods to generate sin waves, update signal properties, and handle play back'

	def __init__(self, queueIn, frequency, amplitude, baseFrequency, maxDiffFrequency):
		super(Synthesizer, self).__init__()
		logger.info("Synthesizer thread initialized")

		# Set up signal properties
		self._stop = threading.Event()
		self._queueIn = queueIn
		self.frequency = frequency
		self.amplitude = amplitude
		self.phase = 0
		self.fs = 44100
		self.time = 0 #time.time()
		self.baseFreq = baseFrequency
		self.diffBaseMax = maxDiffFrequency
		self.signal = None
		self.csvReader = None
		self.pos = None

		# Create pyaudio stream
		p = pyaudio.PyAudio()
		#Hacky solution but change callback method to leapPlay() for leapmotion control
		self.stream = p.open(format=pyaudio.paFloat32,
					channels=1,
					rate=self.fs,
					output=True,
					frames_per_buffer=4096,
					stream_callback=self.leapCallback)

	def __enter__(self):
		return self

	def __exit__(self, exc_type, exc_value, traceback):
		self.closeStream()

	def stop(self):
		self._stop.set()
		self.closeStream()
		logger.info("Synthesizer thread stopped")

	def stopped(self):
		return self._stop.isSet()

	def request(self, function, *args, **kwargs):
		self._queueIn.put((function, args, kwargs))

	def run(self):
	#Hacky solution but change method to leapPlay() for leapmotion control
		logger.info("Synthesizer thread started")
		while not self._stop.isSet():
			try:
				function, args, kwargs = self._queueIn.get(0.01)
				function(*args, **kwargs)
			except Queue.Empty:
				pass
	

	def updateSignal(self, frame_count):
		#TODO: implement time tracking
		# (np.sin(phase+2*np.pi*freq*(TT+np.arange(frame_count)/float(RATE))))
		internal = 2*np.pi*self.frequency*(self.time + np.arange(frame_count)/float(self.fs)) + self.phase
		self.signal = (np.sin(internal)).astype(np.float32)
		# self.phase = internal[-1] % (2*np.pi)
		self.time += frame_count/float(self.fs)


	# Updates the frequency and also modifies phase so the signal's vertical positioning lines up
	def updateFreq(self, frequency):
		# currPhase = (self.time * self.frequency + self.phase) % (2*np.pi)
		# newPhase = (self.time * frequency) % (2*np.pi)
		# self.phase = currPhase - newPhase
		self.phase = (2 * np.pi * self.time * (self.frequency - frequency) + self.phase) % (2*np.pi)
		self.frequency = frequency

#	def runDebug(self, frame_count):
#		fig = figure()
#		ax1 = fig.add_subplot(211)
#		ax1.plot(np.arange(frame_count)/float(self.fs), self.signal)
#		ax1.grid(True)
#		show()
#		i = raw_input("Press Enter to continue...")

	def noLeapCallback(self, in_data, frame_count, time_info, status):
		if not self.csvReader:
			with open('output.txt', 'rb') as f:
				self.csvReader = list(csv.reader(f))
			self.csvIndex = 0;

		row = self.csvReader[self.csvIndex]
		self.csvIndex += 1

		# print row
		sys.stdout.flush()
		#Translate y values from 0-600 to be in 3rd octave
		newFreq = self.baseFreq + self.diffBaseMax*float(row[1])/600

		if newFreq != self.frequency:
			self.updateFreq(newFreq)

		self.updateSignal(frame_count)
		# self.runDebug(frame_count)

		return (self.amplitude*self.signal, pyaudio.paContinue)

	def leapCallback(self, in_data, frame_count, time_info, status):
		#print row
		# sys.stdout.flush()

		if self.pos:
		#Translate y values from 0-600 to be in 3rd octave
			newFreq = self.baseFreq + self.diffBaseMax*float(self.pos[0])

			if newFreq != self.frequency:
				self.updateFreq(newFreq)

		self.updateSignal(frame_count)
		#self.runDebug()
		# dumb
		return (self.amplitude*self.signal, pyaudio.paContinue)

	def setPos(self, pos):
		self.pos = pos

	def startStream(self):
		self.stream.start_stream()

	def stopStream(self):
		self.stream.stop_stream()

	def closeStream(self):
		self.stopStream()
		self.stream.close()

if __name__ == "__main__":
	with Synthesizer(880, 1.0, 230, 880) as synthesizer:
		synthesizer.run()
