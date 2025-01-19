FROM python:3.13-slim

WORKDIR /app

COPY src/ .

RUN pip install --no-cache-dir pandas "psycopg[binary,pool]" prophet plotly requests flask flask_apscheduler gunicorn scikit-learn

CMD ["gunicorn", "-w", "1", "-b", "0.0.0.0:5000", "main:main()"]
