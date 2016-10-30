from libraries import mtTkinter as Tkinter
from drivers.wrapper import LeapFrames
from drivers.UI import GUI
from synthesizer.synthesizer import Synthesizer

import logging #TODO
import Queue
import time

logger = logging.getLogger(name='MochaLogger')

### GLOBAL VARIABLES
# Variables for screen size
screenX = 1000	#TODO set these to full screen size from Tkinter
screenY = 500

class MainController:
	def __init__(self, hand, programController):
		### Initialize variables
		self.hand = hand
		self.programController = programController

		self.leapQueueOut = Queue.Queue()
		self.leap = LeapFrames(self.leapQueueOut, self.hand)
		self.leap.daemon = True

		self.synthQueueIn = Queue.Queue()
		self.synth = Synthesizer(self.synthQueueIn, 230, 880)
		self.synth.daemon = True

		### Starting the GUI
		self.tk = Tkinter.Tk()
		self.tk.title = "Mocha"
		self.tk.resizable(0, 0)
		self.tk.protocol("WM_DELETE_WINDOW", self.onClosing)

		# setting up a canvas
		self.canvas = Tkinter.Canvas(self.tk, width=screenX,
			height=screenY, bd=0, highlightthickness=0)

		# starting a gui class
		self.guiQueueIn = Queue.Queue()
		self.gui = GUI(self.guiQueueIn, self.canvas, screenX, screenY)
		self.gui.daemon = True

		# starting threads
		self.leap.start()
		self.gui.start()
		self.synth.start()

		self.synth.request(self.synth.startStream)

	def _updateGUI(self, pos):
		try: #FIXME this is dumb for when new screens need to be called
			self.guiQueueIn.get(False)
		except Queue.Empty:
			pass
		finally:
			self.gui.request(self.gui.update, pos)

	def onClosing(self):
		#TODO check if the current project is saved (prompt respectively)
		self.programController.stop()

	# Function through which all necessary functions are looped (on the main thread)
	def loop(self):
		loopStart = time.time()
		try:
			while True: #FIXME should be its own function (this is sloppy)
				try:
					time_, normalized, click = self.leapQueueOut.get()
					if loopStart - time_ < 0.02 and self.leapQueueOut.qsize() < 20: #NOTE not sure how much i like this
						break

				except Queue.Empty:
					time_, normalized, click = time.time(), None, None
					break

			#TODO figure out what needs to happen with click data
			# need to bind events to mouse clicks and leap clicks
			# raise the leap motion clicks to the gui class here.

			if normalized:
				# updating sound and UI with new frame
				self._updateGUI(normalized)
				self.synth.request(self.synth.setPos, normalized)

			elif normalized is None:
				# if a frame is not found (ie no hand visible) goto center of screen
				defaultPos = [0.5, 0.5, 0.5]

				self._updateGUI(defaultPos)
				self.synth.request(self.synth.setPos, defaultPos) #FIXME need to turn off synth in this case, also need to make sure it is active in above calls

			# events for the GUI to work
			self.tk.update_idletasks()
			self.tk.update()

		except:
			self.shutdown()
			raise


	def shutdown(self):
		self.leap.stop()
		self.gui.stop()
		self.synth.stop()
