# -*- coding: utf-8 -*-
"""Mocha GUI thread controller.

This file defines the main GUI controller for Mocha. The GUI class
defined below runs on its own thread. The thread is called (only) by
the update(pos) command through its Queue interface. The thread does
not return any data.

Important: mtTkinter is used in order for this thread to update a
canvas that exists in the main thread. The main thread/MainController
still maintains the responsibility to update the canvas. Canvas updates
MUST occur on every iteration of the main loop.

mtTkinter is a wrapper for Tkinter and, therefore, should have all of
the same functionality. Additionally, mtTkinter gives us the guarentee
that any exceptions will be raised through threads until the original
caller is reached.

"""

from libraries import mtTkinter as Tkinter 	# mtTkinter used for threading

import threading
import Queue
import logging

logger = logging.getLogger(name='MochaLogger')

class GUI(threading.Thread):

	"""Threaded GUI class for Mocha.

	This class controls the intialization and updating of the Mocha UI.
	Initialization, beyond initialization arguements, should be dealt
	with in a separate class. The class should be called from
	_initialize() and assigned to a self variable (in order to track
	the element for future use/delete/etc.).

	"""

	def __init__(self, queueIn, canvas, screenX, screenY):
		"""Initialization of GUI thread and canvas objects"""
		super(GUI, self).__init__()
		logger.info("GUI thread intialized")

		self._queueIn = queueIn
		self._stop = threading.Event()

		self.canvas = canvas
		self.screenX = screenX
		self.screenY = screenY
		self.cursorColor = "red"

		self._initialize()

	def _createCursor(self, x=100, y=100, r=7):
		"""Creates an oval (circle) for use as a LeapMotion Cursor.

		x,y = coordinates on the screen
		r = radius of the circle

		"""
		return self.canvas.create_oval(x - r, y - r, x + r, y + r, fill=self.cursorColor)

	def _cursorUpdate(self, pos):
		"""Updates the cursor's position based on new coordinates.

		pos = [x, y, z] normalized coordinates from LeapMotion

		Function calculates deltas because move() adds to the position
		of an object (it does not set the position).

		"""
		currentPos = self.canvas.coords(self.cursor)
		deltaX = (pos[0] * self.screenX) - currentPos[0]
		deltaY = (pos[1] * self.screenY) - currentPos[1]

		#FIXME check screen region to encapsulate cursor

		self.canvas.move(self.cursor, deltaX, deltaY)

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

	def _initialize(self):
		"""Initializes all UI elements on startup."""
		self.bins = self._drawBins()
		self.cursor = self._createCursor()

		self.canvas.pack()

	def request(self, function, *args, **kwargs):
		"""Places a work request in the queue.

		This function is the main interface into the thread. All
		functions that need to be executed (aside from stop() and
		stopped()) should be done through this command.

		Important: This thread does not have the ability to return
		information to the calling thread!

		"""
		self._queueIn.put((function, args, kwargs))

	def run(self):
		"""Main loop of the GUI thread.

		This function is called when the thread is started. The main
		loop will run until the _stop Event is set (through stop()).

		The loop blocks briefly on the queue before refreshing itself.

		"""
		logger.info("GUI thread started")
		while not self._stop.isSet():
			try:
				function, args, kwargs = self._queueIn.get(0.01) #NOTE this may be a bad thing
				function(*args, **kwargs)
			except Queue.Empty:
				pass

	def stop(self):
		"""Stops the thread from running on the next loop."""
		self._stop.set()
		logger.info("GUI thread stopped")

	def stopped(self):
		"""Returns if the thread is currently running."""
		return self._stop.isSet()

	def update(self, pos):
		"""Updates the screen based on the position of the user's hand.
		
		pos = [x, y, z] normalized coordinates from LeapMotion

		"""
		normPos = pos

		self._cursorUpdate(normPos)