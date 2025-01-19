from prophet import Prophet
from sklearn.neighbors import LocalOutlierFactor
from datetime import datetime, timedelta
import pandas as pd
import os
import logging

from interfaces.Imodel import IModel

class ProphetModel(IModel):
    def __init__(self, db, external_service):
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        self.db = db
        self.external_service = external_service
        self.forecast_steps = int(os.environ["FORECAST_STEPS"])
        self.forecast_frequency_minutes = os.environ["FORECAST_FREQUENCY_MINUTES"] + 'min'

    def run(self):
        try:
            data = self.db.get_cluster_data()
            if data.empty:
                self.logger.warning("No data available for forecasting.")
                return
            
            data['ds'] = pd.to_datetime(data['ds'])
            last_data_point = data['ds'].max()

            if last_data_point < datetime.now() - timedelta(days=1):
                self.logger.error("No new data available for forecasting. Cancelling forecast.")
                return
            if last_data_point < datetime.now() - timedelta(hours=1):
                self.logger.warning("No new data available for forecasting.")

            # Set outliers to None
            lof = LocalOutlierFactor(n_neighbors=20, contamination=0.05)
            data['is_outlier'] = lof.fit_predict(data[['y']])
            data.loc[data['is_outlier'] == -1, 'y'] = None
            self.logger.info(f"Forecasting with {len(data)} data points excluding {(data['is_outlier'] == -1).sum()} outliers.")

            # Fit Prophet model
            model = Prophet(weekly_seasonality=True, daily_seasonality=True)
            model.fit(data)

            # Forecast
            future = model.make_future_dataframe(periods=self.forecast_steps, freq=self.forecast_frequency_minutes, include_history=False)
            future['ds'] = pd.date_range(start=datetime.now(), periods=len(future), freq=self.forecast_frequency_minutes)

            forecast = model.predict(future)

            result = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]
            # Store the prediction results
            self.db.store_prediction(result)

            # Send results
            self.external_service.send_result(result)
        except Exception as e:
            self.logger.error(f"An error occurred during the forecasting process: {e}")

    def calculateError(self):
        try:
            actual = self.db.get_cluster_data()
            predictions = self.db.get_past_predictions(int(os.environ["ERROR_CALCULATION_AGE_MINUTES"]))

            if predictions.empty or actual.empty:
                self.logger.warning("No data available for error calculation.")
                return
            
            predictions['ds'] = pd.to_datetime(predictions['ds'])
            actual['ds'] = pd.to_datetime(actual['ds'])
            predictions['actual'] = predictions['ds'].apply(lambda x: actual.iloc[(actual['ds'] - x).abs().argsort()[:1]]['y'].values[0])
            
            self.logger.info(f"Calculating MAPE for {len(predictions)} predictions.")

            for index, row in predictions.groupby('rowid'):
                mape = self._calculate_mape(row['y'], row['actual'])
                if mape < 0:
                    return
                self.db.update_error(index, mape)
        except Exception as e:
            self.logger.error(f"An error occurred during the error calculation process: {e}")

    def _calculate_mape(self, predicted, actual) -> float:
        try:
            if predicted.empty or actual.empty:
                self.logger.warning("No data available for MAPE calculation.")
                return -1
            predicted = predicted.astype(float)
            actual = actual.astype(float)
            return (abs(predicted - actual) / actual).mean() * 100
        except Exception as e:
            self.logger.error(f"An error occurred while calculating MAPE: {e}")
            return -1