import Tkinter
import threading
import logging #TODO

class GUI(threading.Thread):
	def __init__(self, queueIn, canvas, screenX, screenY):
		super(GUI, self).__init__()

		self._queueIn = queueIn
		self.canvas = canvas
		self.screenX = screenX
		self.screenY = screenY
		self.cursorColor = "red"
		self._playScreen()

	def run(self):
		pass

	# creates a cursor object
	def _createCursor(self, x=100, y=100, r=10):
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
	def cursorUpdate(self, pos):
		self.canvas.delete(self.cursor)
		self.cursor = self._createCursor(x = pos[0] * self.screenX, y = pos[1] * self.screenY)
		self.canvas.pack()