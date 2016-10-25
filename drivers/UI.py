from libraries import mtTkinter as Tkinter
import threading
import Queue
import logging

logger = logging.getLogger(name='MochaLogger')

class GUI(threading.Thread):
	def __init__(self, queueIn, canvas, screenX, screenY):
		super(GUI, self).__init__()
		logger.info("GUI thread intialized")

		self._queueIn = queueIn
		self._stop = threading.Event()
		self.canvas = canvas
		self.screenX = screenX
		self.screenY = screenY
		self.cursorColor = "red"
		self._playScreen()

	def stop(self):
		self._stop.set()
		logger.info("GUI thread stopped")

	def stopped(self):
		return self._stop.isSet()

	def request(self, function, *args, **kwargs):
		self._queueIn.put((function, args, kwargs))

	def run(self):
		logger.info("GUI thread started")
		while not self._stop.isSet():
			try:
				function, args, kwargs = self._queueIn.get(0.01)
				function(*args, **kwargs)
			except Queue.Empty:
				pass

	# creates a cursor object
	def _createCursor(self, x=100, y=100, r=7):
		return self.canvas.create_oval(x - r, y - r, x + r, y + r, fill=self.cursorColor)
	
	def _playScreen(self):
		self.bins = self._drawBins()
		self.cursor = self._createCursor()

		self.canvas.pack()

	def _drawBins(self):
		# creating verticle lines based on the bins
		lineBoundNorms = [0.083, 0.166, 0.25, 0.33, 0.4167, 
			0.500, 0.583, 0.666, 0.750, 0.833, 0.9167]

		for norm in lineBoundNorms:
			x1 = x2 = norm * self.screenX
			y1, y2 = (self.screenY / 2) - 1, self.screenY - 1
			self.canvas.create_line(x1, y1, x2, y2)

		# creating a horizontal line
		self.canvas.create_line(0, self.screenY / 2, self.screenX - 1, self.screenY / 2)

	# updates the position of the cursor object based on pos 
	# pos = normalized data of the hand position
	def _cursorUpdate(self, pos):
		currentPos = self.canvas.coords(self.cursor)
		deltaX = (pos[0] * self.screenX) - currentPos[0]
		deltaY = (pos[1] * self.screenY) - currentPos[1]

		#FIXME check screen region to encapsulate cursor

		self.canvas.move(self.cursor, deltaX, deltaY)

	def update(self, pos):
		# normPos = pos[0]
		# click = pos[1]
		normPos = pos #FIXME when click working

		self._cursorUpdate(normPos)