from abc import ABC, abstractmethod
import pandas as pd

class IDataAccess(ABC):
    @abstractmethod
    def get_cluster_data(self) -> pd.DataFrame:
        pass

    @abstractmethod
    def store_prediction(self, forecast) -> None:
        pass

    @abstractmethod
    def get_past_predictions(self, minAge) -> pd.DataFrame:
        pass

    @abstractmethod
    def update_error(self, id, error) -> None:
        pass