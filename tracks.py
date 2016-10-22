#TODO update docstring info and style

import threading
import operator
import json
import logger #TODO

#TODO add in an error code/priority/?; not sure if i need to quantify beyond the message
# Exception definition for this class
class Error(Exception):
	def __init__(self, msg):
		self.msg = msg
	
	def	__str__(self):
		return self.msg


#TODO add in tracking for a wav file and associated set/get/?
class TrackInfo(cls):
	def __init__(self, num):
		self.number = num
		self.name = "Track %s" %(self.number)
		self.recording = list([])
		self.active = False

	# complies the track's variables into a dictionary
	def getDict(self):
		output = dict({})
		output['number'] = self.number
		output['name'] = self.name
		output['recording'] = self.recording
		return output

	# returns a bool stating if the track is active (i.e. recording)
	def getActive(self):
		return self.active

	# bool setter for a track's active state
	def setActive(self, state):
		self.active = state

	# returns string of the track's current name
	def getName(self):
		return self.name

	# string setter for a track's name
	def setName(self, name):
		self.name = name

	# returns list of normalized position values in list (x, y, z[not normalized])
	#TODO need to check if the index given is within range and that the track is not active
	def getFrame(self, index):
		return self.recording[index]

	# returns a bool stating if the track is empty
	def isEmpty(self):
		if self.recording:
			return False
		else:
			return True

	# normalized position setter for a frame of the track
	# requires pos list of (x, y, z[not normalized]); active must be True (i.e. recording)
	def addData(self, pos):
		if self.active:
			self.recording.append(pos)

		else:
			raise Error("Track is not active")



#class Tracks(cls, threading.Thread):
class Tracks(cls):
	def __init__(self):
		#threading.Thread.__init__(self)
		self.tracks = {}
		self.trackCurrent = 0
		self.trackFrame = 0
		self.projectName = "New Project"
		self.projectPath = "" #TODO

	# generator object for dict() calls to the class
	def __iter__(self):
		for key, obj in self.tracks.iteritems():
			yield key, obj.getDict()

	# determines the largest key value in the tracks dictionary
	def _largestTrack(self):
		try:
			return max(self.tracks.iteritems(), key=operator.itemgetter(0))[0]

		except:
			return 0

	# a basic check to ensure a string is not null
	def _checkName(self, name):
		if not name:
			raise Error("String is empty or null")

	### Getters and Setters
	
	# string setter for the project name; string must NOT be empty or null
	def setProjectName(self, name):
		try:
			self._checkName(name)
		except Error as error:
			raise TrackException(error)

		self.projectName = name

	# returns string of the project's current name
	def getProjectName(self):
		return self._projectName

	# string setter for track names; string must NOT be empty or null
	# sets current track name by default
	# optionally takes second parameter of a track number and set that track's name
	def setTrackName(self, name, track=None):
		try:
			self._checkName(name)
		except Error as error:
			raise TrackException(error)

		if track is None:
			track = self.trackCurrent
		self.tracks[track].setName(name)

	# returns a string stating the name of the current track
	# optionally takes a parameter of a track number; will return given track's name
	def getTrackName(self, track=None):
		if track is None:
			track = self.trackCurrent
		return self.tracks[track].getName()

	# bool setter for the state of the current track
	# optionally takes a second parameter of a track number; will set given track's state
	def _setTrackActive(self, state, track=None):
		if track is None:
			track = self.trackCurrent
		self.tracks[track].setActive(state)

	# returns bool of the current track's active state
	# optionally takes a parameter of a track number; will return given track's state
	def getTrackActive(self, track=None):
		if track is None:
			track = self.trackCurrent
		self.tracks[track].getActive()
	
	# returns a JSON object of the entire Tracks class (including recorded tracks)
	def getJSON(self):
		return json.dumps(dict(self), indent=4)

	#TODO getFrame, resetFrame, (bool toggle for looping?)
	#TODO call to get entire (recorded) track

	### track creation

	# Create a new track and initialize a TrackInfo class within the dict
	def _newTrack(self):
		# determines the highest current track number, starts a track with that # + 1
		self.trackCurrent = self._largestTrack() + 1
		self.tracks[self.trackCurrent] = TrackInfo(self.trackCurrent)

		return self.trackCurrent

	# This function should not be needed, and therefore should never be called.
	# Leaving it here for now, however, in case implementation plans change in the future.
	def _changeTrack(self, num):
		if num in self.tracks:
			self.trackCurrent = num

			# making sure that there is a TrackInfo class associated with the track number
			if not self.tracks[self.trackCurrent]:
				self.tracks[self.trackCurrent] = TrackInfo(self.trackCurrent)

			return self.trackCurrent

		else:
			raise Error("Given track number is not valid/found")

	# Deleting a track
	def deleteTrack(self, track=None):
		if track is None:
			track = self.trackCurrent

		if track in self.tracks:
			del self.tracks[track]

		else:
			raise Error("Given track number is not valid/found")

	### track updating

	# start recording on a new track
	def startRecording(self):
		self._newTrack()
		self._setTrackActive(True)

	# stop recording on the current track
	def stopRecording(self):
		self._setTrackActive(False)

	# add a new position frame to the current track
	# position frame should be of the form (x, y, z[not normalized])
	# optionally takes a second parameter of a track number; will add frame to given track
	# TRACKS MUST BE ACTIVE FOR RECORDING
	def addData(self, pos, track=None):
		if track is None:
			track = self.trackCurrent
		try:
			self.tracks[track].addData(pos)

		except Error as error:
			raise TrackException(error)

	### saving and opening

	# saves the project into a .mca file type
	# saved project is in csv format to be read in by calling importProject(fn)
	# takes string as input to specificy a filepath/name
	# name should not include an extension
	def saveProject(self, fn): #TODO figure out what i can autofill here based on stored projectName/path??
		try:
			with open(str(fn) + '.mca', 'w') as f:
				f.write(self.getJSON())
		except:
			raise Error("Could not open/write the file")

	#TODO
	def closeProject(self):
		pass

	#TODO
	def importProject(self, fn):
		try:
			with open(str(fn) + '.mca', 'r') as f:
				data = json.load(f)
				for key in data:
					print key
		except:
			raise Error("Could not open/read the file")



# function for debugging
def debug():
	from wrapper import LeapFrames
	import time
	leap = LeapFrames('l')

	tracks = Tracks()

	for _ in range(2):
		try:
			tracks.startRecording()
			while True:
				time.sleep(1)
				pos = leap.getNormPos()
				try:
					tracks.addData(pos)
				except Error as error:
					print error
		except KeyboardInterrupt:
			tracks.stopRecording()

	print "test"
	print tracks.getJSON()

	tracks.saveProject('output.txt')

if __name__ == "__main__":
	debug()
