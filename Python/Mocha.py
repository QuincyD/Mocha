# -*- coding: utf-8 -*-
"""Mocha: Motion Composer

Mocha (Motion Composer) is a music composition software designed for
use in the University of Michigan College of Engineering EECS 
481-002 class. The goal of the project is to enable our customer, Brad
Ebenhoeh, to create music using only his left hand. The team's goal is
to allow Brad to regain creative freedom.

Mocha is created for Python 2.7.4 using a Leap Motion (v2 SDK).

Proper usage of Mocha is as follows:
python2.7 Mocha.py [l|r]
	[l|r] specifies the user's preferred hand (left | right)

Authors:
	Quincy Davenport
	Joseph Korany
	Brandon Mendrick
	Tyler Seruga

Thank for you using Mocha (Motion Composer)!

"""

from drivers.controller import MainController
from drivers.mochaLogger import MochaLogger

import sys
import logging

class ProgramController:
	
	"""Control interface between the MainController and the main loop.

	Class is used for the sole purpose of determining when the main
	loop should stop looping. This is not the best solution and a
	better one should be considered.

	Other docstrings are omitted because I am lazy and this will likely
	change.

	"""
	
	def __init__(self):
		self.running = True

	def stop(self):
		self.running = False

	def isRunning(self):
		return self.running

def main():
	"""Main loop controller for Mocha.

	This is the main method for running Mocha. The function defines all
	necessary utilities for the MainController to run. Additionally, it
 		controlls the main loop of Mocha.

	Important: the main loop and the MainController exist on a thread
	together. All other modules should be running on separate threads.

	"""
	if len(sys.argv) < 2:
		print "Welcome to Mocha!"
		print "Mocha runs on 64-bit machines using Python 2.7.4"
		print "Proper usage of the program is the following:"
		print "python driver.py (l|r)"
		print "(l|r) specifies the preferred hand"
		sys.exit(1)

	# starting logger
	MochaLogger()
	logger = logging.getLogger(name='MochaLogger')
	logger.critical("\n*****     NEW RUN STARTED     *****")

	# create the MainController object
	programController = ProgramController()
	controller = MainController(sys.argv[1], programController)

	# Begin the main function loop
	try:
		while programController.isRunning():
			controller.loop()

	#TODO determine if this is necessary?
	except KeyboardInterrupt:
		pass

	# cleans up the controller when the program is set to exit
	finally:
		controller.shutdown()
		controller.tk.destroy()

	print "\nThank you for using Mocha!"

if __name__ == "__main__":
	"""Executes when file is called as main executable."""
	main()