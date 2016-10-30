#TODO update docstring info and style

import trackInfo

import threading #FIXME
import operator
import json
import re
import os
import logging

logger = logging.getLogger(name='MochaLogger')

# Exception definition for this class
class TrackError(Exception):
	def __init__(self, msg):
		self.msg = msg
		logger.warning("TrackError exception thrown: %s" %(self.msg))
	
	def	__str__(self):
		return self.msg

class Tracks(threading.Thread):

	def __init__(self):
		threading.Thread.__init__(self)
		logger.info("Track thread initialized")

		self._newProject()

	# generator object for dict() calls to the class
	# if any other yields are added, need to change import
	def __iter__(self):
		for key, obj in self._tracks.iteritems():
			yield key, obj.getDict()

	def _newProject(self):
		self._tracks = {}
		self._trackCurrent = 0
		self._projectName = self._getNewProjectName()
		self._projectPath = str(os.getcwd())
		self.saved = True

		logger.info("New project created")

	def _saveFileFormat(self):
		return os.path.join(self._projectPath, self._projectName + '.mca')

	def _getNewProjectName(self):
		largest = 1

		all_files = os.listdir(os.getcwd())
		for file in all_files:
			tmp = file.split('.')
			print tmp
			try:
				if re.match('^MochaProject-[0-9]+$', file[0]):
					print "if entered on: ", file[0]
					tmp = tmp[0].split('-')
					if int(tmp[1]) > largest:
						largest = int(file[1])
			except:
				pass

		print "largest: ", largest
		return "MochaProject-" + str(largest + 1)

	# determines the largest key value in the _tracks dictionary
	def _largestTrack(self):
		try:
			return max(self._tracks.iteritems(), key=operator.itemgetter(0))[0]

		except:		#sloppy?
			return 0

	# a basic check to ensure a string is not null
	def _checkName(self, name):
		if not name:
			raise TrackError("String is empty or null")

	def _action(self):
		self.saved = False

	def _checkTrack(self, track):
		if track in self._tracks:
			return True
		return False

	def run(self):
		logger.info("Track thread started")

	### Getters and Setters
	
	# string setter for the project name; string must NOT be empty or null
	def setProjectName(self, name):
		try:
			self._checkName(name)
		except TrackError:
			raise

		self._projectName = name
		self._action

	# returns string of the project's current name
	def getProjectName(self):
		return self._projectName

	def setProjectPath(self, path): #TODO check if project was previously saved and add option for removing old? same for setProjName
		try:
			_checkPath(path)
		except:
			raise

		self._projectPath = path
		self._action

	def getProjectPath(self):
		return self._projectPath

	# string setter for track names; string must NOT be empty or null
	# sets current track name by default
	# optionally takes second parameter of a track number and set that track's name
	def setTrackName(self, name, track=None):
		try:
			self._checkName(name)
		except TrackError:
			raise

		if track is None:
			track = self._trackCurrent
		elif not self._checkTrack(track):
			raise TrackError("Given track is not a valid track!")
		
		self._tracks[track].setName(name)
		self._action()

	# returns a string stating the name of the current track
	# optionally takes a parameter of a track number; will return given track's name
	def getTrackName(self, track=None):
		if track is None:
			track = self._trackCurrent
		elif not self._checkTrack(track):
			raise TrackError("Given track is not a valid track!")

		return self._tracks[track].getName()

	# bool setter for the state of the current track
	# optionally takes a second parameter of a track number; will set given track's state
	def _setTrackActive(self, state, track=None):
		if track is None:
			track = self._trackCurrent
		elif not self._checkTrack(track):
			raise TrackError("Given track is not a valid track!")

		self._tracks[track].active = state

	# returns bool of the current track's active state
	# optionally takes a parameter of a track number; will return given track's state
	def getTrackActive(self, track=None):
		if track is None:
			track = self._trackCurrent
		elif not self._checkTrack(track):
			raise TrackError("Given track is not a valid track!")
		
		return self._tracks[track].active
	
	# returns a JSON object of the entire Tracks class (including recorded _tracks)
	def getJSON(self):
		return json.dumps(dict(self), indent=4)

	### track interfaces

	def getFullTrack(self, track=None):
		if track is None:
			track = self._trackCurrent
		elif not self._checkTrack(track):
			raise TrackError("Given track is not a valid track!")
			
		return self._tracks[track].getRecording()

	def getAllFullTrack(self):
		output = {}
		for key, obj in self._tracks.iteritems():
			output[key] = obj.getRecording()

		return output

	#NOTE getFrame, resetFrameCounter, etc can be implemented, but are not needed
	#	for a wav file implementation of _tracks

	def getCompiledTrack(self, track=None):
		if track is None:
			track = self._trackCurrent
		elif not self._checkTrack(track):
			raise TrackError("Given track is not a valid track!")

		return self._tracks[track].getCompiled()

	def getAllCompiledTrack(self):
		output = {}
		for key, obj in self._tracks.iteritems():
			output[key] = obj.getCompiled()

		return output

	def setCompiledTrack(self, name, track=None):
		if track is None:
			track = self._trackCurrent
		elif not self._checkTrack(track):
			raise TrackError("Given track is not a valid track!")

		try:
			self._tracks[track].setCompiled(name)
		except TrackError:
			raise

	### track creation

	# Create a new track and initialize a TrackInfo class within the dict
	def _newTrack(self):
		# determines the highest current track number, starts a track with that # + 1
		self._trackCurrent = self._largestTrack() + 1
		self._tracks[self._trackCurrent] = TrackInfo(self._trackCurrent)

		logger.info("New track created: %s" %(self._trackCurrent))

		return self._trackCurrent

	# This function should not be needed, and therefore should never be called.
	# Leaving it here for now, however, in case implementation plans change in the future.
	def _changeTrack(self, track):
		if self._checkTrack(track):
			self._trackCurrent = track

			# making sure that there is a TrackInfo class associated with the track number
			if not self._tracks[self._trackCurrent]:
				self._tracks[self._trackCurrent] = TrackInfo(self._trackCurrent)

			return self._trackCurrent

		else:
			raise TrackError("Given track number is not valid/found")

	# Deleting a track
	def deleteTrack(self, track=None):
		if track is None:
			track = self._trackCurrent
		elif not self._checkTrack(track):
			raise TrackError("Given track is not a valid track!")

		del self._tracks[track]

		self._action()

		logger.info("Track deleted: %s" %(track))

	### track updating

	# start recording on a new track
	def startRecording(self):
		trackNum = self._newTrack()
		self._setTrackActive(True)

		self._action()

		logger.info("Track recording started: %s" %(self._trackCurrent))

		return trackNum

	# stop recording on the current track
	def stopRecording(self):
		self._setTrackActive(False)

		logger.info("Track recording stopped: %s" %(self._trackCurrent))

	# add a new position frame to the current track
	# position frame should be of the form (x, y, z[not normalized])
	# optionally takes a second parameter of a track number; will add frame to given track
	# TRACKS MUST BE ACTIVE FOR RECORDING
	def addData(self, pos, track=None):
		if track is None:
			track = self._trackCurrent
		elif not self._checkTrack(track):
			raise TrackError("Given track is not a valid track!")

		try:
			self._tracks[track].addData(pos)

		except TrackError:
			raise

	### saving and opening

	# saves the project into a .mca file type
	# saved project is in json format to be read in by calling importProject(fn)
	# takes string as input to specificy a filepath/name
	# name should not include an extension
	def saveProject(self):
		try:
			with open(self._saveFileFormat(), 'w') as f:
				f.write(self.getJSON())
		except:
			#raise TrackError("Could not open/write the file")
			raise	#not sure which of the statements is better...

		self.saved = True

		logger.info("%s has been saved" %(self._projectName))

	def closeProject(self, override=False):
		if not override and not self.saved:
			raise TrackError("Project not recently saved!")

		logger.info("%s has been closed" %(self._projectName))
		
		self._newProject()

	def importProject(self, fn, override=False):
		try:
			self.closeProject(override)

			_checkFile(fn)

			with open(fn, 'r') as f:
				data = json.load(f)
				for key, obj in data.iteritems():
					trackInfo = TrackInfo()
					trackNum = trackInfo.importTrack(obj)
					self._tracks[trackNum] = trackInfo

		except TrackError:
			raise

		except:
			#raise TrackError("Could not open/read the file")
			raise	#not sure which of the statements is better...

		self._trackCurrent = self._largestTrack()

		# determining project name and path
		path = fn.split('/')
		self._projectName = path.pop().split('.')[0]
		self._projectPath = '/' + '/'.join(path)

		logger.info("%s has been imported" %(self._projectName))



def _checkFile(file):
	if not re.match('^(/\w+)*(\w+)(\.([a-zA-Z]{3}))$', file):
		raise TrackError("Given filename is not formatted properly!")
	if not os.path.isfile(file):
		raise TrackError("Given filename is not valid!")

def _checkPath(path):
	if not re.match('^(/\w+)*$', path):
		raise TrackError("Given path is not formatted properly!")
	if not os.path.isdir(path):
		try:
			os.mkdir(path)
		except:
			raise TrackError("Given path did not exist and could not be created!")

# function for debugging
def debug():
	from mochaLogger import MochaLogger
	MochaLogger()
	logger = logging.getLogger(name='MochaLogger')
	logger.critical("*****     NEW RUN STARTED     *****\n")

	from wrapper import LeapFrames
	import time
	leap = LeapFrames('l')

	tracks = Tracks()
	tracks.start()
	tracks.setProjectName("output")

	for _ in range(2):
		try:
			tracks.startRecording()
			while True:
				time.sleep(1)
				pos = leap.getNormPos()
				try:
					tracks.addData(pos)
				except TrackError:
					raise
		except KeyboardInterrupt:
			tracks.stopRecording()
	print ""

	tracks.setTrackName("Booty")
	tracks.setTrackName("Big", 1)

	tracks.saveProject()

	tracks.closeProject()

	print "CLOSED PROJECT"
	print tracks.getJSON()

	try:
		tracks.startRecording()
		while True:
			time.sleep(1)
			pos = leap.getNormPos()
			try:
				tracks.addData(pos)
			except TrackError:
				raise
	except KeyboardInterrupt:
		tracks.stopRecording()
	print ""

	tracks.saveProject()

	tracks.importProject("output.mca")

	print "\nIMPORTED PROJECT"
	print tracks.getJSON()
	print tracks.getProjectPath(), tracks.getProjectName()

if __name__ == "__main__":
	debug()
