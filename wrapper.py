import sys
import Leap

class LeapFrames:
	# Class variables for the range of the Leap Motion
	leapX = 480
	leapY = 500

	def __init__(self, hand):
		self.controller = Leap.Controller()
		self.hand = hand

	def getFrame(self):
		return self.controller.frame()

	def getPos(self):
		frame = self.controller.frame()
		for hand in frame.hands:
			# checking if the current hand is one we care about
			if (hand.is_left and self.hand == 'l') or (not hand.is_left and self.hand == 'r'):
				# Data must be parsed this way because palm_position is a "Vector"
				# which is a custom structure defined by Leap Motion with no
				# direct translation in a Python list
				tmp = list([])
				for i in range(3):
					tmp.append(hand.palm_position[i])
				return tmp
		# if a hand is not found or it is a bad frame, return nothing
		return []

	# Returns the position data in a normalized form
	def getNormPos(self):
		pos = self.getPos()

		# making sure a position was returned
		if pos:
			return self.normalize(pos)
		return pos

	def normalize(self, pos):
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

# Main function is used only for testing and should be removed for final release
def main():

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
	print test.getNormPos()


# main call handling
if __name__ == '__main__':
	main()
