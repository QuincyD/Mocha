import sys
import Leap

class LeapFrames:
	# Class variables for the range of the Leap Motion
	#leapX = 480	# NOTE depreciated
	#leapY = 500	# NOTE depreciated

	def __init__(self, hand):
		self.controller = Leap.Controller()
		self.hand = hand

	def _cleanPos(self, pos):
		# Data must be parsed this way because palm_position is a "Vector"
		# which is a custom structure defined by Leap Motion with no
		# direct translation in a Python list
		tmp = list([])
		for i in range(3):
			tmp.append(pos[i])

		return tmp

	def getFrame(self):
		return self.controller.frame()

	def getPos(self, normalized=False):
		frame = self.controller.frame()
		numHands = len(frame.hands)
		interactionBox = frame.interaction_box

		for hand in frame.hands:
			# checking if the current hand is the preferred hand given that 2 hands are in range
			if (
					(numHands == 1) or 
					(numHands == 2 and self.hand == 'l' and hand.is_left) or 
					(numHands == 2 and self.hand == 'r' and not hand.is_left)
				):

					if normalized:
						return self._cleanPos(
							interactionBox.normalize_point(hand.palm_position)
						)
					else:
						return self._cleanPos(hand.palm_position)

		# if a hand is not found or it is a bad frame, return nothing
		return []

	# Returns the position data in a normalized form
	def getNormPos(self):
		return self.getPos(True)

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

# Debug function is used only for testing and should be removed for final release
def debug():

	#controller = Leap.Controller()
	test = LeapFrames('l')

	print "woo"
	try:
		sys.stdin.readline()
	except KeyboardInterrupt:
		pass

	#frame = controller.frame()
	#for hand in frame.hands:
	#	print hand.palm_position
	print len(test.getFrame().hands)


# main call handling
if __name__ == '__main__':
	debug()
