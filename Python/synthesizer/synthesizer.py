import pyaudio
import numpy as np
import time
import csv
import sys
import threading
import logging
import Queue
#TODO: find way to import SciPy (for square and sawtooth). Pip fails to build wheel

logger = logging.getLogger(name='MochaLogger')

# Create instances of this class using 'with Synthesizer() as synthesizer'.
# That way the __exit__ method should be automatically invoked to handle closing the audio stream
class Synthesizer(threading.Thread):
	'Contains methods to generate sin waves, update signal properties, and handle play back'

	def __init__(self, queueIn, baseFrequency, maxDiffFrequency, noLeap=False):
		super(Synthesizer, self).__init__()
		logger.info("Synthesizer thread initialized")

		# Set up signal properties
		self._stop = threading.Event()
		self._queueIn = queueIn
		self.frequency = (baseFrequency + maxDiffFrequency)/2.0
		self.amplitude = 0.0
		self.maxAmplitude = .75
		self.phase = 0
		self.fs = 44100
		self.time = 0
		self.baseFreq = baseFrequency
		self.diffBaseMax = maxDiffFrequency
		self.signal = None
		self.lastSignal = [];
		self.csvReader = None
		self.pos = None
		self.firstSignal = False
		callback = self.leapCallback

		if noLeap:
			callback = self.noLeapCallback

		# Create pyaudio stream
		p = pyaudio.PyAudio()
		#Hacky solution but change callback method to leapPlay() for leapmotion control
		self.stream = p.open(format=pyaudio.paFloat32,
					channels=1,
					rate=self.fs,
					output=True,
					frames_per_buffer=512,#4096/8,
					stream_callback=callback)

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

	def updateSignal(self, frame_count, fadein=False, fadeout=False):
		internal = 2*np.pi*self.frequency*(self.time + np.arange(frame_count)/float(self.fs)) + self.phase
		signal = (np.sin(internal)).astype(np.float32)
		noise1 = (np.sin(internal + .25 * np.pi)).astype(np.float32)
		noise2 = (np.sin(internal + .5 * np.pi)).astype(np.float32)
		# Play around with shift and amplitudes of noise.
		# Original (shift, amp): noise1:(.25, .75), noise2:(.5, .1)
		self.signal = .75*noise1 + .2*noise2 + signal
		maxVal = np.amax(self.signal)
		self.signal = self.signal / maxVal
		# newMax = np.amax(self.signal)
		# print maxVal, newMax
		# sys.stdout.flush()
		# print self.signal
		# sys.stdout.flush()

		if fadein:
			self.signal = np.linspace(0.0, self.maxAmplitude, frame_count).astype(np.float32) * self.signal
			self.amplitude = self.maxAmplitude
		elif fadeout:
			self.signal = np.linspace(1.0, 0.0, frame_count).astype(np.float32) * self.amplitude * self.signal
			self.amplitude = 0.0
		else:
			self.signal = self.signal*self.amplitude
		self.time += frame_count/float(self.fs)

	# Updates the frequency and also modifies phase so the signal's vertical positioning lines up
	def updateFreq(self, frequency):
		self.phase = (2 * np.pi * self.time * (self.frequency - frequency) + self.phase) % (2*np.pi)
		self.frequency = frequency

	def noLeapCallback(self, in_data, frame_count, time_info, status):
		if not self.csvReader:
			with open('output.txt', 'rb') as f:
				self.csvReader = list(csv.reader(f))
			self.csvIndex = 0
			self.amplitude = self.maxAmplitude

		self.pos = self.csvReader[self.csvIndex]
		self.csvIndex += 1
		newFreq = self.baseFreq + self.diffBaseMax*float(self.pos[1])
		# sys.stdout.flush()
		if newFreq != self.frequency:
			self.updateFreq(newFreq)

		self.updateSignal(frame_count)
		# print str(self.signal[0]) + ' ' + str(self.signal[-1])
		# sys.stdout.flush()
		return (self.signal, pyaudio.paContinue)

	def leapCallback(self, in_data, frame_count, time_info, status):
		fadeout = False
		if self.pos:
			playSignal = float(self.pos[1]) > .5

			#Translate y values from 0-600 to be in range baseFreq-(baseFreq+diffBaseMax)
			newFreq = self.baseFreq + self.diffBaseMax*float(self.pos[0])
			if playSignal and newFreq != self.frequency:
				self.updateFreq(newFreq)

			# Set the amplitude to zero if hand is above threshold, else transition amplitude
			if playSignal and self.amplitude == 0.0:
				self.firstSignal = True
			elif not playSignal and self.amplitude != 0:
				fadeout = True

			# NOTE: Weird woodblock effect
			# if playSignal and self.amplitude < 1.0:
			# 	self.amplitude += .1
			# elif playSignal:
			# 	self.amplitude = .1
			# else:
			# 	self.amplitude = 0.0

		# Generate the new signal and return it to pyaudio
		self.updateSignal(frame_count, self.firstSignal, fadeout)
		# if len(self.lastSignal):
		# 	print self.lastSignal[-1], self.signal[0]
		# 	sys.stdout.flush()
		# No longer the first signal in a new playback "session"
		self.firstSignal = False
		self.lastSignal = self.signal
		return (self.signal, pyaudio.paContinue)

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
	with Synthesizer(Queue.Queue(), 230, 880, True) as synthesizer:
		synthesizer.run()
