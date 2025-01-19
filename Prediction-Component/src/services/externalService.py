import requests
import os
import time
import logging

from interfaces.IexternalService import IExternalService

class ExternalService(IExternalService):
    def __init__(self):
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        self.max_attempts = int(os.environ["ICC_MAX_ATTEMPTS"])
        self.retry_interval = int(os.environ["ICC_RETRY_INTERVAL_SECONDS"])
        self.icc_host = os.environ["ICC_HOST"]

    def send_result(self, forecast):
        forecast.rename(columns={"ds": "time", "yhat": "value", "yhat_lower": "lower", "yhat_upper": "upper"}, inplace=True)
        forecast["time"] = forecast["time"].astype(str)
        forecast_json = forecast.to_dict(orient="records")
        api_payload = {"forecast": forecast_json}

        attempts = 0
        while attempts <= self.max_attempts:
            try:
                response = requests.post(self.icc_host, json=api_payload)
                if response.status_code == 201:
                    self.logger.info("Forecast sent successfully to ICC.")
                    break
                else:
                    self.logger.warning(f"Unexpected status code: {response.status_code}. Retrying...")
            except requests.RequestException as e:
                self.logger.error(f"An error occurred: {e}. Retrying...")

            attempts += 1
            time.sleep(self.retry_interval)

        if attempts >= self.max_attempts:
            self.logger.error("Failed to send forecast to ICC after multiple attempts.")
