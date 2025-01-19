from abc import ABC, abstractmethod

class IMigration(ABC):
    @abstractmethod
    def migrate_database(self) -> None:
        pass
