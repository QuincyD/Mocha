import threading, Queue, Tkinter, sys

from wrapper import LeapFrames
from synthesizer import Synthesizer

### GLOBAL VARIABLES
# Variables for screen size
screenX = 1000
screenY = 500

# Threading class for Leap Motion
class LeapThread(threading.Thread):
	def __init__(self, queue, hand):
		threading.Thread.__init__(self)
		self.queue = queue
		self.frameGen = LeapFrames(hand)

	def run(self):
		pass

	# Returns the position of the user's hand
	def getPos(self):
		return self.frameGen.getPos()

	# Returns the normalized position of the user's hand
	def getNormPos(self, pos=None):
		if pos:
			return self.frameGen.normalize(pos)
		return self.frameGen.getNormPos()

	# Returns the entire frame from the Leap Motion
	def getFrame(self):
		return self.frameGen.getFrame()

class GUI:
	def __init__(self, canvas):
		self.canvas = canvas
		self.color = "red"
		self._playScreen()

	# creates a cursor object
	def _createCursor(self, x=100, y=100, r=10):
		return self.canvas.create_oval(x - r, y - r, x + r, y + r, fill=self.color)
	
	def _playScreen(self):
		self.bins = self._drawBins()
		self.cursor = self._createCursor()

		self.canvas.pack()

	def _drawBins(self):
		# creating verticle lines based on the bins
		lineBoundNorms = [0.083, 0.166, 0.25, 0.33, 0.4167, 
			0.500, 0.583, 0.666, 0.750, 0.833, 0.9167]

		for norm in lineBoundNorms:
			x1 = x2 = norm * screenX
			y1, y2 = (screenY / 2) - 1, screenY - 1
			self.canvas.create_line(x1, y1, x2, y2)

		# creating a horizontal line
		self.canvas.create_line(0, screenY / 2, screenX - 1, screenY / 2)

	# updates the position of the cursor object based on pos 
	# pos = normalized data of the hand position
	def cursorUpdate(self, pos):
		self.canvas.delete(self.cursor)
		self.cursor = self._createCursor(x = pos[0] * screenX, y = pos[1] * screenY)
		self.canvas.pack()

class MainController:	
	def __init__(self, hand):
		### Initialize variables
		self.hand = hand
		self.workers = {}
		self.queue = Queue.Queue()

		### Initialize threads
		# thread for LeapMotion frames
		self.workers['frame'] = LeapThread(self.queue, self.hand)

		# thread for synthesizer
		self.workers['synth'] = Synthesizer(440, 1.0, .25)

		# starting all worker threads
		self.start()

		### Starting the GUI
		self.tk = Tkinter.Tk()
		self.tk.title = "Mocha"
		self.tk.resizable(0, 0)

		# setting up a canvas
		self.canvas = Tkinter.Canvas(self.tk, width=screenX, 
			height=screenY, bd=0, highlightthickness=0)
		
		# starting a gui class
		self.gui = GUI(self.canvas)
	
	# Function to start all of the workers
	def start(self):
		for key, obj in self.workers.iteritems():
			obj.start()

	# Function through which all necessary functions are looped (on the main thread)
	def loop(self):
		# checking to see if a new frame is available
		normalized = self.workers['frame'].getNormPos()

		if normalized:
			# updating sound and UI with new frame
			self.workers['synth'].play(normalized)
			self.gui.cursorUpdate(normalized)

		# events for the GUI to work
		self.tk.update_idletasks()
		self.tk.update()



### Main function and loop of the program
def main(argv):
	# making sure all arguments are given in the command line
	if len(argv) < 2:
		print "Welcome to Mocha!"
		print "Mocha runs on 64-bit machines using Python 2.7.4"
		print "Proper usage of the program is the following:"
		print "python driver.py (l|r)"
		sys.exit(1)

	controller = MainController(argv[1])

	try:
		while True:
			controller.loop()
	except KeyboardInterrupt:
		pass

	print "\nThank you for using Mocha!"

if __name__ == "__main__":
	main(sys.argv)
