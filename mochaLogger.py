import logging

class MochaLogger:
    """A logger to record various levels of events to a log file

    Only needs to be instantiated once when the program first starts up
    Once initialized, can be accessed across modules with:
        import logging
        logger = logging.getLogger(name='MochaLogger')

    You can write to the logger with the following commands:
        logger.debug("This is a debug level message")
        logger.info("This is an info level message")
        logger.warning("This is a warning level message")
        logger.error("This is an error level message")
        logger.critical("This is a critical level message")
    """
    def __init__(self):
        # These aren't self. because they don't need to belong to the instance
        logger = logging.getLogger('MochaLogger')
        logger.setLevel(logging.DEBUG)

        fh1 = logging.FileHandler('mocha.log')
        fh1.setLevel(logging.DEBUG)
        fh2 = logging.FileHandler('mochaErrors.log')
        fh2.setLevel(logging.ERROR)

        formatter = logging.Formatter('[%(levelname)s] (%(asctime)s) %(thread)d, %(pathname)s, %(funcName)s in line %(lineno)d \n\t %(message)s')
        fh1.setFormatter(formatter)
        fh2.setFormatter(formatter)

        logger.addHandler(fh1)
        logger.addHandler(fh2)
