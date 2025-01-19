from abc import ABC, abstractmethod
from typing import Any

class IConnection(ABC):
    @abstractmethod
    def get_connection(self) -> Any:
        pass
