
import zerorpc

class ContinuumBridge:

    def __init__(self, username, password):

        c = zerorpc.Client()
        c.connect("tcp://127.0.0.1:5000")


