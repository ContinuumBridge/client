
from twisted.internet.protocol import ClientFactory

class CbClientFactory(ClientFactory):

    def __init__(self, processMsg, initMsg):
        self.processMsg = processMsg
        self.initMsg = initMsg

    def buildProtocol(self, addr):
        self.proto = CbClientProtocol(self.processMsg, self.initMsg)
        return self.proto

    def sendMsg(self, msg):
        self.proto.sendMsg(msg)

class Concentrator():
    def __init__(self, argv):

        # Connection to conduit process
        initMsg = {"type": "status",
                   "time_sent": self.isotime(),
                   "body": "bridge manager started"}
        self.concFactory = CbClientFactory(self.processServerMsg, initMsg)
        self.jsConnect = reactor.connectTCP("localhost", 5000, self.concFactory, timeout=10)

