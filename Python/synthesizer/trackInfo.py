#TODO update docstyle

import re
import os.path
import logging #TODO

logger = logging.getLogger(name='MochaLogger')

# Exception definition for this class #TODO import from tack
class TrackError(Exception):
	def __init__(self, msg):
		self.msg = msg
		logger.warning("TrackError exception thrown: %s" %(self.msg))
	
	def	__str__(self):
		return self.msg

class TrackInfo():
	def __init__(self, num=-1):
		self._number = num
		self._name = "Track %s" %(self._number)
		self.active = False
		self._recording = list([])
		self._compiled = ""

	def importTrack(self, info):
		try:
			self._number = int(info['number'])
			self._name = str(info['name'])
			self.active = False
			self._recording = list(info['recording'])
			#self._compiled = str(info['compiled']) # see below TODO

		except:
			raise TrackError("Problem during track import!")

		return self._number

	# complies the track's variables into a dictionary
	def getDict(self):
		output = dict({})
		output['number'] = self._number
		output['name'] = self._name
		#output['compiled'] = self._compiled #TODO determine if compiled files are constant or recompiled on project open
		output['recording'] = self._recording
		return output

	def getNumber(self):
		return self._number

	def getName(self):
		return self._name

	def setName(self, name):
		if re.match('^\w+$', name):
			self._name = name

		else:
			raise TrackError("Given name is not valid!")

	def getCompiled(self):
		return self._compiled

	def setCompiled(self, path):
		# this is checking if the path is invalid (and raising appropriate error)
		if not _checkFileName(path):
			raise TrackError("File path / name formatting is incorrect!")

		# raising error for the case where the path is invalid for the system
		if not os.path.isfile(path):
			raise TrackError("File path is not valid")

		self._compiled = path

	# returns list of normalized position values in list (x, y, z[not normalized])
	def getFrame(self, index):
		if self.active:
			raise TrackError("Track %s is active!" %(self._number))
		if len(self._recording) <= index:
			raise TrackError("Given index is outside recorded bounds!")
		
		return self._recording[index]

	def getRecording(self):
		return self._recording

	# returns a bool stating if the track is empty
	def isEmpty(self):
		if self._recording:
			return False
		else:
			return True

	# normalized position setter for a frame of the track
	# requires pos list of (x, y, z[not normalized]); active must be True (i.e. recording)
	def addData(self, pos):
		if self.active:
			self._recording.append(pos)

		else:
			raise TrackError("Track %s (%s) is not active" %(self._number, self._name))

def _checkFileName(path):
	return re.match('^(/\w+)*(\w+)(\.([a-zA-Z]{3}))$', path)