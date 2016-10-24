import Tkinter
import sys
import logging #TODO
import Queue
from concurrent import futures
from mochaLogger import MochaLogger

from wrapper import LeapFrames
from synthesizer import Synthesizer
from UI import GUI

### GLOBAL VARIABLES
# Variables for screen size
screenX = 1000	#TODO set these to full screen size from Tkinter
screenY = 500

class MainController:	
	def __init__(self, hand):
		### Initialize variables
		self.hand = hand
		
		self.leapQueueOut = Queue.Queue()
		self.leap = LeapFrames(self.leapQueueOut, self.hand)
		# self.leap.daemon = True
		
		self.synth = Synthesizer(440, 1.0, .25)

		### Starting the GUI
		self.tk = Tkinter.Tk()
		self.tk.title = "Mocha"
		self.tk.resizable(0, 0)

		# setting up a canvas
		self.canvas = Tkinter.Canvas(self.tk, width=screenX, 
			height=screenY, bd=0, highlightthickness=0)
		
		# starting a gui class
		self.gui = GUI(self.canvas, screenX, screenY)

		# starting threads
		self.leap.start()

	# Function through which all necessary functions are looped (on the main thread)
	def loop(self):
		try:
			# checking to see if a new frame is available
			self.leap.request(self.leap.getNormPos)
			try:
				normalized = self.leapQueueOut.get(True)
			except Queue.Empty:
				normalized = None

			if normalized:
				# updating sound and UI with new frame
				self.gui.cursorUpdate(normalized)
				self.synth.play(normalized)

			# events for the GUI to work
			self.tk.update_idletasks()
			self.tk.update()

		except:
			self.shutdown()
			raise

	def shutdown(self):
		self.leap.stop()



### Main function and loop of the program
def main(argv):
	# making sure all arguments are given in the command line
	if len(argv) < 2:
		print "Welcome to Mocha!"
		print "Mocha runs on 64-bit machines using Python 2.7.4"
		print "Proper usage of the program is the following:"
		print "python driver.py (l|r)"
		print "(l|r) specifies the preferred hand"
		sys.exit(1)

	# starting logger
	MochaLogger()
	logger = logging.getLogger(name='MochaLogger')
	logger.critical("*****     NEW RUN STARTED     *****\n")

	controller = MainController(argv[1])

	try:
		while True:
			controller.loop()

	except KeyboardInterrupt:
		pass

	finally:
		controller.shutdown()

	print "\nThank you for using Mocha!"

if __name__ == "__main__":
	main(sys.argv)
