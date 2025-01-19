import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

import unittest
from unittest.mock import patch
import pandas as pd
from ml_models.prophet import ProphetModel
from repositories.database import Database
from services.externalService import ExternalService

class TestProphetModel(unittest.TestCase):

    @patch.dict(os.environ, {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "test_db",
        "DB_USER": "test_user",
        "DB_PASSWORD": "test_password",
        "FORECAST_STEPS": "12",
        "FORECAST_FREQUENCY_MINUTES": "5min",
        "ICC_MAX_ATTEMPTS": "5",
        "ICC_RETRY_INTERVAL_SECONDS": "1",
        "ICC_HOST": "http://localhost:8000"
    })
    @patch.object(Database, 'get_cluster_data')
    @patch.object(Database, 'store_prediction')
    @patch.object(ExternalService, 'send_result')
    def test_run_no_data(self, mock_send_result, mock_store_prediction, mock_get_cluster_data):
        mock_get_cluster_data.return_value = pd.DataFrame()
        db = Database()
        external_service = ExternalService()
        model = ProphetModel(db, external_service)
        model.run()
        self.assertTrue(mock_get_cluster_data.called)
        self.assertFalse(mock_store_prediction.called)
        self.assertFalse(mock_send_result.called)

    @patch.dict(os.environ, {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "test_db",
        "DB_USER": "test_user",
        "DB_PASSWORD": "test_password",
        "FORECAST_STEPS": "12",
        "FORECAST_FREQUENCY_MINUTES": "5min",
        "ICC_MAX_ATTEMPTS": "5",
        "ICC_RETRY_INTERVAL_SECONDS": "1",
        "ICC_HOST": "http://localhost:8000"
    })
    @patch.object(Database, 'get_cluster_data')
    @patch.object(Database, 'store_prediction')
    @patch.object(ExternalService, 'send_result')
    def test_run_forecast_error(self, mock_send_result, mock_store_prediction, mock_get_cluster_data):
        mock_get_cluster_data.return_value = pd.DataFrame({
            'ds': ['2023-01-01'],
            'y': [100]
        })
        with patch('src.ml_models.prophet.Prophet.fit', side_effect=Exception("Forecast error")):
            db = Database()
            external_service = ExternalService()
            model = ProphetModel(db, external_service)
            model.run()
            self.assertTrue(mock_get_cluster_data.called)
            self.assertFalse(mock_store_prediction.called)
            self.assertFalse(mock_send_result.called)

    @patch.dict(os.environ, {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "test_db",
        "DB_USER": "test_user",
        "DB_PASSWORD": "test_password",
        "FORECAST_STEPS": "12",
        "FORECAST_FREQUENCY_MINUTES": "5min",
        "ICC_MAX_ATTEMPTS": "5",
        "ICC_RETRY_INTERVAL_SECONDS": "1",
        "ICC_HOST": "http://localhost:8000",
        "ERROR_CALCULATION_AGE_MINUTES": "5"
    })  
    @patch.object(Database, 'update_error')
    @patch.object(Database, 'get_past_predictions')
    @patch.object(Database, 'get_cluster_data')
    def test_calculateError_no_data(self, mock_get_cluster_data, mock_get_past_predictions, mock_update_error):

        mock_get_cluster_data.return_value = pd.DataFrame()
        mock_get_past_predictions.return_value = pd.DataFrame()

        db = Database()
        external_service = ExternalService()

        model = ProphetModel(db, external_service)

        model.calculateError()

        self.assertTrue(mock_get_cluster_data.called)
        self.assertTrue(mock_get_past_predictions.called)
        self.assertFalse(mock_update_error.called)

    @patch.dict(os.environ, {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "test_db",
        "DB_USER": "test_user",
        "DB_PASSWORD": "test_password",
        "FORECAST_STEPS": "12",
        "FORECAST_FREQUENCY_MINUTES": "5min",
        "ICC_MAX_ATTEMPTS": "5",
        "ICC_RETRY_INTERVAL_SECONDS": "1",
        "ICC_HOST": "http://localhost:8000",
        "ERROR_CALCULATION_AGE_MINUTES": "5"
    })
    def test_calculate_mape_no_data(self):
        db = Database()
        external_service = ExternalService()
        model = ProphetModel(db, external_service)
        mape = model._calculate_mape(pd.Series(), pd.Series())
        self.assertEqual(mape, -1)

    @patch.dict(os.environ, {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "test_db",
        "DB_USER": "test_user",
        "DB_PASSWORD": "test_password",
        "FORECAST_STEPS": "12",
        "FORECAST_FREQUENCY_MINUTES": "5min",
        "ICC_MAX_ATTEMPTS": "5",
        "ICC_RETRY_INTERVAL_SECONDS": "1",
        "ICC_HOST": "http://localhost:8000",
        "ERROR_CALCULATION_AGE_MINUTES": "5"
    })
    def test_calculate_mape_correct_value(self):
        db = Database()
        external_service = ExternalService()
        model = ProphetModel(db, external_service)
        mape = model._calculate_mape(pd.Series([0,3,3,4,5]), pd.Series([1,2,3,4,5]))
        self.assertEqual(mape, 30)


if __name__ == '__main__':
    unittest.main()
