from flask import Flask
from flask_apscheduler import APScheduler
import os
import logging

from repositories.database import Database
from ml_models.prophet import ProphetModel
from routes.health import health_blueprint
from services.externalService import ExternalService

def create_app(config):
    app = Flask(__name__)
    app.config.from_object(config)

    # Register Blueprints
    app.register_blueprint(health_blueprint)

    return app

class Config:
    SCHEDULER_API_ENABLED = True

def configure_scheduler(app, model):
    scheduler = APScheduler()
    scheduler.init_app(app)
    scheduler.add_job(id="Forecasting Task", func=model.run, trigger="interval", minutes=int(os.environ["FORECAST_INTERVAL_MINUTES"]))
    scheduler.add_job(id="Error Calculation Task", func=model.calculateError, trigger="interval", minutes=int(os.environ["ERROR_CALCULATION_INTERVAL_MINUTES"]))
    scheduler.start()

def main():
    db = Database()
    db.migrate_database()

    external_service = ExternalService()
    model = ProphetModel(db, external_service)

    app = create_app(Config)
    configure_scheduler(app, model)

    return app
