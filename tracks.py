import threading, operator

class TrackException(Exception):
	def __init__(self, msg):
		self.msg = msg
	
	def	__str__(self):
		return self.msg



class TrackInfo:
	def __init__(self, num):
		self.number = num
		self.name = "Track %s" %(self.number)
		self.recording = list([])
		self.active = False

	def getActive(self):
		return self.active

	def setActive(self, state):
		self.active = state

	def getName(self):
		return self.name

	def setName(self, name):
		self.name = name

	def addData(self, pos):
		if self.active:
			self.recording.append(pos)

		else:
			raise TrackException("Track is not active")



class Tracks(threading.Thread):
	def __init__(self):
		threading.Thread.__init__(self)
		self.tracks = {}
		self.trackCurrent = 0

	def _largestTrack(self):
		try:
			return max(self.tracks.iteritems(), key=operator.itemgetter(0))[0]

		except:
			return 0

	### Getters and Setters
	
	def setTrackName(self, name, track=self.trackCurrent):
		self.tracks[track].setName(name)

	def getTrackName(self, track=self.trackCurrent):
		return self.tracks[track].getName()

	def setTrackActive(self, state, track=self.trackCurrent):
		self.tracks[track].setActive(state)

	def getTrackActive(self, track=self.trackCurrent):
		self.tracks[track].getActive()
	
	### functional functions

	def newTrack(self):
		self.trackCurrent = self._largestTrack + 1
		self.tracks[self.trackCurrent] = TrackInfo(self.trackCurrent)

		return self.trackCurrent

	def changeTrack(self, num):
		if num in self.tracks:
			self.trackCurrent = num

			# making sure that there is a TrackInfo class associated with the track number
			if not self.tracks[self.trackCurrent]:
				self.tracks[self.trackCurrent] = TrackInfo(self.trackCurrent)

			return self.trackCurrent

		else:
			raise TrackException("Given track number is not valid/found")

	def deleteTrack(self, num):
		if num in self.tracks:
			self.tracks[num] = None

			return self.trackCurrent

		else:
			raise TrackException("Given track number is not valid/found")

	def addData(self, pos):
		try:
			self.tracks[self.trackCurrent].addData(pos)

		except TrackException, err:
			raise TrackException(err)
