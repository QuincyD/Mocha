import Leap
import time
import math

def pinch():
	controller = Leap.Controller()

	finger_names = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']

	try:
		while True:
			# time.sleep(1)
			frame = controller.frame()

			# finger = frame.fingers.frontmost
			# print finger

			# stabilizedPosition = finger.stabilized_tip_position
			# print "stablized: ", stabilizedPosition

			# fingerPosition = finger.tip_position
			# print "normal: ", fingerPosition

			# fingerVelocity = finger.tip_velocity
			# print "velocity: ", fingerVelocity

			# interactionBox = frame.interaction_box
			# print interactionBox

			# normalizedPosition = interactionBox.normalize_point(stabilizedPosition)
			# print normalizedPosition

			for hand in frame.hands:
				thumb, index = None, None

				# print "Left: %s; ID: %s; Pos: %s" %(hand.is_left, hand.id, hand.palm_position)
				# print interactionBox.normalize_point(hand.palm_position)

				for finger in hand.fingers:
					if finger_names[finger.type] == "Thumb":
						thumb = finger

					elif finger_names[finger.type] == "Index":
						index = finger

				if thumb and index:
					thumbStabPos = thumb.stabilized_tip_position
					indexStabPos = index.stabilized_tip_position

					thumbPos = thumb.tip_position
					indexPos = index.tip_position

					# print "thumb: ", thumbPos
					# print "index: ", indexPos

					sum_ = []
					for i in range(3):
						sum_.append(thumbPos[i] - indexPos[i])
					# print "sum: ", sum_

					squares = []
					for i in range(3):
						squares.append(sum_[i]**2)
					# print "square: ", squares

					dist = 0
					for i in squares:
						dist += i
					dist = math.sqrt(dist)
					# print "distance: ", dist

					if dist < 20:
						print "click: %s" %(dist)

	except KeyboardInterrupt:
		print "\nFinished"

def poke():
	controller = Leap.Controller()

	finger_names = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky']

	try:
		while True:
			# time.sleep(1)
			frame = controller.frame()

			for hand in frame.hands:
				index = None

				pointables = hand.pointables
				for pointable in pointables:
					if pointable.is_finger:
						finger = Leap.Finger(pointable)

						if not (finger_names[finger.type] == "Index"):
							continue

						# zone = pointable.touch_zone
						# print "zone: ", zone

						dist = pointable.touch_distance
						# print "distance: ", dist

						if dist < 0:
							print "click: %s" %(dist)

	except KeyboardInterrupt:
		print "\nFinished"

if __name__ == "__main__":
	# pinch()
	poke()