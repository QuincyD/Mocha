#TODO update docstyle

import sys
import logging
import threading
import Queue
import Leap

logger = logging.getLogger(name='MochaLogger')

class LeapFrames(threading.Thread):
	# Class variables for the range of the Leap Motion
	#leapX = 480	# NOTE depreciated
	#leapY = 500	# NOTE depreciated

	def __init__(self, queueOut, hand):
		super(LeapFrames, self).__init__()
		logger.info("LeapMotion thread intialized")

		self.controller = Leap.Controller()
		self.hand = hand
		self._queueIn = Queue.Queue()
		self._queueOut = queueOut
		self._frame = None
		self._stop = threading.Event()
		self._freshFrame = False

	def _cleanPos(self, pos):
		# Data must be parsed this way because palm_position is a "Vector"
		# which is a custom structure defined by Leap Motion with no
		# direct translation in a Python list
		tmp = list([])
		for i in range(3):
			tmp.append(pos[i])

		tmp[1] = 1 - tmp[1]		# need to invert ycoord for GUI

		return tmp

	def stop(self):
		self._stop.set()
		logger.info("LeapMotion thread stopped")

	def stopped(self):
		return self._stop.isSet()

	def request(self, function, *args, **kwargs):
		self._queueIn.put((function, args, kwargs))

	def run(self):
		logger.info("LeapMotion thread started")
		while not self._stop.isSet():
			try:
				function, args, kwargs = self._queueIn.get(False)
				function(*args, **kwargs)
				self._freshFrame = False
			except Queue.Empty:
				self._frame = self._getFrame()
				self._freshFrame = True

	def _getFrame(self):
		return self.controller.frame()

	def getPos(self, _normalized=False):
		if not self._freshFrame:
			self._frame = self._getFrame()

		frame = self._frame
		numHands = len(frame.hands)
		interactionBox = frame.interaction_box

		for hand in frame.hands:
			# checking if the current hand is the preferred hand given that 2 hands are in range
			if (
					(numHands == 1) or 
					(numHands == 2 and self.hand == 'l' and hand.is_left) or 
					(numHands == 2 and self.hand == 'r' and not hand.is_left)
				):

					if _normalized:
						normPos = self._cleanPos(
							interactionBox.normalize_point(hand.palm_position)
						)

						self._queueOut.put(normPos)
						break
					else:
						pos = self._cleanPos(hand.palm_position)
						self._queueOut.put(pos)
						break

		if self._queueOut.empty():
			self._queueOut.put([])

	# Returns the position data in a normalized form
	def getNormPos(self):
		self.getPos(True)

	# NOTE function should no longer be need since the leap motion SDK
	# is now taking care of this for us
	def _normalize(self, pos):
		if pos:
			# xCoord is based on the origin at the center of LM
			xCoord = (pos[0] + (self.leapX / 2)) / self.leapX

			# yCoord needs to be flipped
			yCoord = 1 - (pos[1] / self.leapY)
			
			# making sure the coords are between 0 and 1
			if xCoord < 0:
				xCoord = 0
			elif xCoord > 1:
				xCoord = 1

			if yCoord < 0:
				yCoord = 0
			elif yCoord > 1:
				yCoord = 1

			# returning the same zCoord since it's not currently in use
			tmp = [xCoord, yCoord, pos[2]]
			return tmp

def debug():
	# starting logger
	from mochaLogger import MochaLogger
	MochaLogger()
	logger = logging.getLogger(name='MochaLogger')
	logger.critical("*****     NEW DEBUG STARTED     *****\n")

	leapQueueOut = Queue.Queue()
	leap = LeapFrames(leapQueueOut, 'l')
	leap.start()

	try:
		while True:
			leap.request(leap.getNormPos)

			try:
				normPos = leapQueueOut.get(False)
				print normPos
			except Queue.Empty:
				pass

	except KeyboardInterrupt:
		leap.stop()

if __name__ == "__main__":
	debug()