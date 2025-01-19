from abc import ABC, abstractmethod
from typing import Any

class IQueryExecutor(ABC):
    @abstractmethod
    def execute_query(self, query, params=None, fetch=True) -> Any:
        pass
