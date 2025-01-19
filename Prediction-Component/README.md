# Prediction-Component

This project is a Python application that utilizes the Prophet model for time series forecasting. It is designed to run scheduled tasks that retrieve data from a database, make predictions, and store the results.
## Project Structure

```
Prediction-Component
├── src
│   ├── interfaces
│   │   ├── IexternalService.py    # Interface for external service
│   │   ├── Imodel.py              # Interface for model
│   │   ├── database
│   │   │   ├── IConnection.py     # Interface for database connection
│   │   │   ├── IDataAccess.py     # Interface for data access
│   │   │   ├── IMigration.py      # Interface for database migration
│   │   │   └── IQueryExecutor.py  # Interface for query execution
│   ├── main.py                    # Entry point of the application
│   ├── ml_models
│   │   └── prophet.py             # Contains the ProphetModel class
│   ├── repositories
│   │   └── database.py            # Manages database interactions
│   └── services
│       └── externalService.py     # Contains function to send forecast results
├── Dockerfile                     # Dockerfile to build the application image
├── docker-compose.yaml            # Docker Compose file to run the application
├── metrics_seeder.py              # Script to generate seed data for the database
└── README.md                      # Documentation for the project
```

## Requirements

The required packages are specified in the Dockerfile and will be installed during the Docker image build process.

- Python 3.9
- pandas
- "psycopg[binary,pool]"
- prophet
- plotly
- requests
- flask
- flask_apscheduler
- gunicorn

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd Prediction-Component
   ```

2. Build the Docker image:
   ```
   docker build -t Prediction-Component .
   ```

3. Run the Docker container:
   ```
   docker compose up
   docker run -e DB_HOST=<host> -e DB_PORT=<port> -e DB_NAME=<dbname> -e DB_USER=<user> -e DB_PASSWORD=<password> Prediction-Component
   ```

## Usage

The application runs a scheduled task every N minutes to execute the Prophet model. The results are sent to the Index Calculation Component and stored in the database.

## Environment Variables

- `DB_HOST`: The hostname of the database.
- `DB_PORT`: The port number of the database.
- `DB_NAME`: The name of the database.
- `DB_USER`: The username for the database.
- `DB_PASSWORD`: The password for the database.
- `FORECAST_STEPS`: The number of steps to forecast.
- `FORECAST_FREQUENCY_MINUTES`: The frequency in minutes for the forecast steps.
- `FORECAST_INTERVAL_MINUTES`: The interval in minutes for running the forecast task.
- `ICC_MAX_ATTEMPTS`: The maximum number of attempts to send the forecast to the Index Calculation Component.
- `ICC_RETRY_INTERVAL_SECONDS`: The retry interval in seconds between attempts to send the forecast.
- `ICC_HOST`: The hostname of the Index Calculation Component.

## Health Check

You can check the health of the application by accessing the `/healthz` endpoint:
```
http://<host>:5000/healthz
```

## testing
```
python -m unittest discover -s tests
```
