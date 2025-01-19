from abc import ABC, abstractmethod

class IModel(ABC):
    @abstractmethod
    def run(self) -> None:
        pass
    @abstractmethod
    def calculateError(self) -> None:
        pass