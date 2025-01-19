import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../src')))

import unittest
from unittest.mock import patch
import pandas as pd
from repositories.database import Database
import re

class TestDatabase(unittest.TestCase):

    @patch.dict(os.environ, {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "test_db",
        "DB_USER": "test_user",
        "DB_PASSWORD": "test_password"
    })
    @patch('src.repositories.database.psycopg.connect')
    def test_get_connection_error(self, mock_connect):
        mock_connect.side_effect = Exception("Connection error")
        db = Database()
        with self.assertRaises(Exception):
            db.get_connection()

    @patch.dict(os.environ, {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "test_db",
        "DB_USER": "test_user",
        "DB_PASSWORD": "test_password"
    })
    @patch.object(Database, 'execute_query')
    def test_execute_query_error(self, mock_execute_query):
        mock_execute_query.side_effect = Exception("Query execution error")
        db = Database()

        with self.assertRaises(Exception):
            db.execute_query("SELECT * FROM test")

    @patch.dict(os.environ, {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "test_db",
        "DB_USER": "test_user",
        "DB_PASSWORD": "test_password"
    })
    @patch.object(Database, 'execute_query')
    def test_migrate_database_error(self, mock_execute_query):
        mock_execute_query.side_effect = Exception("Migration error")
        db = Database()

        with self.assertLogs(db.logger, level='ERROR') as log:
            db.migrate_database()

            # Check if the error message is in the logs
            error_message_pattern = re.compile(
                r"An error occurred during database migration: .*"
            )
            self.assertTrue(
                any(error_message_pattern.search(message) for message in log.output),
                "Expected error message not found in logs"
            )

    @patch.dict(os.environ, {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "test_db",
        "DB_USER": "test_user",
        "DB_PASSWORD": "test_password"
    })
    @patch.object(Database, 'execute_query')
    def test_get_cluster_data_error(self, mock_execute_query):
        mock_execute_query.side_effect = Exception("Data retrieval error")
        db = Database()

        with self.assertLogs(db.logger, level='ERROR') as log:
            result = db.get_cluster_data()
            self.assertTrue(result.empty)

            # Check if the error message is in the logs
            error_message_pattern = re.compile(
                r"An error occurred while retrieving cluster data: .*"
            )
            self.assertTrue(
                any(error_message_pattern.search(message) for message in log.output),
                "Expected error message not found in logs"
            )

    @patch.dict(os.environ, {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "test_db",
        "DB_USER": "test_user",
        "DB_PASSWORD": "test_password"
    })
    @patch.object(Database, 'execute_query')
    def test_store_prediction_error(self, mock_execute_query):
        # Mock the connection and cursor
        mock_execute_query.side_effect = Exception("Insert error")
        db = Database()

        forecast = pd.DataFrame({
            'ds': ['2023-01-01'],
            'yhat': [100],
            'yhat_upper': [110],
            'yhat_lower': [90]
        })

        # Capture the logs
        with self.assertLogs(db.logger, level='ERROR') as log:
            db.store_prediction(forecast)

            # Print the captured log messages
            for message in log.output:
                print(message)

            # Check if the error was logged
            error_message_pattern = re.compile(
                r"An error occurred while storing predictions: .*"
            )
            self.assertTrue(
                any(error_message_pattern.search(message) for message in log.output),
                "Expected error message not found in logs"
            )

    @patch.dict(os.environ, {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "test_db",
        "DB_USER": "test_user",
        "DB_PASSWORD": "test_password"
    })
    @patch.object(Database, 'execute_query')
    def test_update_error_get_error(self, mock_execute_query):
        # Mock the connection and cursor
        mock_execute_query.side_effect = Exception("Update error")
        db = Database()

        rowId = 1
        error = 50

        # Capture the logs
        with self.assertLogs(db.logger, level='ERROR') as log:
            db.update_error(rowId, error)

            # Print the captured log messages
            for message in log.output:
                print(message)

            # Check if the error was logged
            error_message_pattern = re.compile(
                r"An error occurred while updating error: .*"
            )
            self.assertTrue(
                any(error_message_pattern.search(message) for message in log.output),
                "Expected error message not found in logs"
            )
    
    @patch.dict(os.environ, {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_NAME": "test_db",
        "DB_USER": "test_user",
        "DB_PASSWORD": "test_password"
    })
    @patch.object(Database, 'execute_query')
    def test_get_past_predictions_get_error(self, mock_execute_query):
        # Mock the connection and cursor
        mock_execute_query.side_effect = Exception("Update error")
        db = Database()

        minAge = 10

        # Capture the logs
        with self.assertLogs(db.logger, level='ERROR') as log:
            db.get_past_predictions(minAge)

            # Print the captured log messages
            for message in log.output:
                print(message)

            # Check if the error was logged
            error_message_pattern = re.compile(
                r"An error occurred while retrieving past predictions: .*"
            )
            self.assertTrue(
                any(error_message_pattern.search(message) for message in log.output),
                "Expected error message not found in logs"
            )


if __name__ == '__main__':
    unittest.main()
