#TODO update docstyle

from libraries import Leap

import sys
import logging
import threading
import Queue
import time

logger = logging.getLogger(name='MochaLogger')

class LeapFrames(threading.Thread):
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
			cur = float('%.6f' %(pos[i]))
			tmp.append(cur)

		tmp[1] = 1 - tmp[1]		# need to invert ycoord for GUI

		return tmp

	def _getFrame(self):
		return self.controller.frame()

	def getPos(self, _normalized=False):
		if not self._freshFrame:
			self._frame = self._getFrame()

		frame = self._frame
		numHands = len(frame.hands)
		interactionBox = frame.interaction_box

		time_ = time.time()
		pos = None
		click = False

		for hand in frame.hands:
			# checking if the current hand is the preferred hand given that 2 hands are in range
			if (
					(numHands == 1) or 
					(numHands == 2 and self.hand == 'l' and hand.is_left) or 
					(numHands == 2 and self.hand == 'r' and not hand.is_left)
				):

					pointables = hand.pointables
					for pointable in pointables:
						if pointable.is_finger:
							finger = Leap.Finger(pointable)

							if not finger.type == 1:	#0: thumb, 1: index, 2: middle, etc
								continue

							dist = pointable.touch_distance
							if dist < 0:
								click = True
								break

					if _normalized:
						pos = self._cleanPos(
							interactionBox.normalize_point(hand.palm_position)
						)

						break
					else:
						pos = self._cleanPos(hand.palm_position)
						break

		self._queueOut.put((time_, pos, click))

	# Returns the position data in a normalized form
	def getNormPos(self):
		self.getPos(True)

	def request(self, function, *args, **kwargs):
		self._queueIn.put((function, args, kwargs))

	def run(self):
		logger.info("LeapMotion thread started")
		while not self._stop.isSet():
			self.getNormPos()

	def stop(self):
		self._stop.set()
		logger.info("LeapMotion thread stopped")

	def stopped(self):
		return self._stop.isSet()



def debug():
	"""Debug code for testing the class."""
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