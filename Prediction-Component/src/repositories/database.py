import os
import pandas as pd
import psycopg
import logging

from interfaces.database.IConnection import IConnection
from interfaces.database.IDataAccess import IDataAccess
from interfaces.database.IMigration import IMigration
from interfaces.database.IQueryExecutor import IQueryExecutor

class Database(IConnection, IDataAccess, IMigration, IQueryExecutor):
    def __init__(self):
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        self.config = {
            "host": os.environ["DB_HOST"],
            "port": os.environ["DB_PORT"],
            "dbname": os.environ["DB_NAME"],
            "user": os.environ["DB_USER"],
            "password": os.environ["DB_PASSWORD"],
        }

    def get_connection(self):
        return psycopg.connect(
            host=self.config["host"],
            port=self.config["port"],
            dbname=self.config["dbname"],
            user=self.config["user"],
            password=self.config["password"]
        )

    def execute_query(self, query, params = None, fetch = True):
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, params or ())
                    if fetch:
                        return cur.fetchall()
                    conn.commit()
        except Exception as e:
            self.logger.error(f"An error occurred while executing query: {e}")
            return None

    def migrate_database(self):
        self.logger.info("Starting database migration...")
        query = """
            SELECT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = %s)
        """
        create_query = """
            CREATE TABLE IF NOT EXISTS "past_prediction" (
                id BIGSERIAL PRIMARY KEY,
                past_prediction_row_id BIGINT NOT NULL,
                time TIMESTAMP NOT NULL,
                value NUMERIC NOT NULL,
                upper NUMERIC NOT NULL,
                lower NUMERIC NOT NULL,
                createdAt TIMESTAMP NOT NULL
            );
        """

        data = ("past_prediction",)
        try:
            rows = self.execute_query(query, data)
            if rows and rows[0][0] is not None:
                self.logger.info("migrate result: " + str(rows))
                if not rows[0][0]:
                    self.execute_query(create_query, fetch=False)
                    self.logger.info("Table 'past_prediction' created.")
            else:
                self.logger.error("Error: Unable to fetch migration result.")
        except Exception as e:
            self.logger.error("An error occurred during database migration: %s", e)

        create_query = """
            CREATE TABLE IF NOT EXISTS "past_prediction_row" (
                id BIGSERIAL PRIMARY KEY,
                error NUMERIC,
                startTime TIMESTAMP NOT NULL,
                endTime TIMESTAMP NOT NULL,
                avg_value NUMERIC NOT NULL,
                upper NUMERIC NOT NULL,
                lower NUMERIC NOT NULL,
                createdAt TIMESTAMP NOT NULL
            );
        """

        data = ("past_prediction_row",)
        try:
            rows = self.execute_query(query, data)
            if rows and rows[0][0] is not None:
                self.logger.info("migrate result: " + str(rows))
                if not rows[0][0]:
                    self.execute_query(create_query, fetch=False)
                    self.logger.info("Table 'past_prediction_row' created.")
            else:
                self.logger.error("Error: Unable to fetch migration result.")
        except Exception as e:
            self.logger.error("An error occurred during database migration: %s", e)

    def get_cluster_data(self):
            query = """
                SELECT
                    time AS ds,  -- Prophet expects 'ds' (datetime) column
                    avg_usage_cpu * total_cpu / 100 AS y  -- Calculate the CPU usage
                FROM metrics
                WHERE time >= NOW() - INTERVAL '30 days'  -- Last 30 days of data
                ORDER BY time ASC;
            """
            try:
                rows = self.execute_query(query)
                # Create DataFrame with specified column names
                return pd.DataFrame(rows, columns=pd.Index(['ds', 'y']))
            except Exception as e:
                self.logger.error(f"An error occurred while retrieving cluster data: {e}")
                return pd.DataFrame()


    def store_prediction(self, forecast):
        insert_pred_query = """
            INSERT INTO past_prediction (past_prediction_row_id, time, value, upper, lower, createdAt)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        insert_row_query = """
            INSERT INTO past_prediction_row (startTime, endTime, avg_value, upper, lower, createdAt)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    time = pd.Timestamp.now()

                    cur.execute(insert_row_query, (forecast['ds'].min(), forecast['ds'].max(), forecast['yhat'].mean(), forecast['yhat_upper'].max(), forecast['yhat_lower'].min(), time))
                    cur.execute("SELECT currval(pg_get_serial_sequence('past_prediction_row','id'))")
                    lastid = cur.fetchone()
                    if not lastid:
                        self.logger.error("An error occurred while storing predictions: Could not receive last inserted rowId")
                        return
                    lastid = lastid[0]
                    for index, row in forecast.iterrows():
                        cur.execute(insert_pred_query, (lastid, row['ds'], row['yhat'], row['yhat_upper'], row['yhat_lower'], time))

                    conn.commit()
            self.logger.info(f"Stored {len(forecast)} predictions.")
        except Exception as e:
            self.logger.error(f"An error occurred while storing predictions: {e}")

    def get_past_predictions(self, minAge):
        query = """
            SELECT past_prediction_row.id AS id, time as ds, value AS y
            FROM past_prediction_row
            JOIN past_prediction ON (past_prediction_row.id = past_prediction.past_prediction_row_id)
            WHERE error IS NULL
            AND endtime < NOW() - INTERVAL '%s minutes'
            AND startTime > NOW() - INTERVAL '30 days'
        """ % minAge
        try:
            rows = self.execute_query(query)
            return pd.DataFrame(rows, columns=pd.Index(['rowid', 'ds', 'y']))
        except Exception as e:
            self.logger.error(f"An error occurred while retrieving past predictions: {e}")
            return pd.DataFrame()

    def update_error(self, id, error):
        query = """
            UPDATE past_prediction_row
            SET error = %s
            WHERE id = %s
        """
        try:
            self.execute_query(query, (error, id), fetch=False)
            self.logger.info(f"Updated error for prediction row {id}.")
        except Exception as e:
            self.logger.error(f"An error occurred while updating error: {e}")
