import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

import unittest
from unittest.mock import patch
import pandas as pd
from services.externalService import ExternalService

class TestExternalService(unittest.TestCase):

    @patch.dict(os.environ, {
        "ICC_MAX_ATTEMPTS": "5",
        "ICC_RETRY_INTERVAL_SECONDS": "1",
        "ICC_HOST": "http://localhost:8000"
    })
    @patch('src.services.externalService.requests.post')
    def test_send_result_error(self, mock_post):
        mock_post.side_effect = Exception("Request error")
        service = ExternalService()
        forecast = pd.DataFrame({
            'ds': ['2023-01-01'],
            'yhat': [100],
            'yhat_upper': [110],
            'yhat_lower': [90]
        })
        with self.assertRaises(Exception):
            service.send_result(forecast)

    @patch.dict(os.environ, {
        "ICC_MAX_ATTEMPTS": "5",
        "ICC_RETRY_INTERVAL_SECONDS": "1",
        "ICC_HOST": "http://localhost:8000"
    })
    @patch('src.services.externalService.requests.post')
    def test_send_result_retry(self, mock_post):
        mock_post.return_value.status_code = 500
        service = ExternalService()
        forecast = pd.DataFrame({
            'ds': ['2023-01-01'],
            'yhat': [100],
            'yhat_upper': [110],
            'yhat_lower': [90]
        })
        service.send_result(forecast)
        self.assertEqual(mock_post.call_count, service.max_attempts + 1)

if __name__ == '__main__':
    unittest.main()
