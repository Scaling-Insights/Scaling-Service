from abc import ABC, abstractmethod

class IExternalService(ABC):
    @abstractmethod
    def send_result(self, forecast) -> None:
        pass
