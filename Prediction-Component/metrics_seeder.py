import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# Define the database structure
columns = [
    "id", "total_cpu", "avg_usage_cpu", "total_ram", "avg_usage_ram",
    "average_request", "average_latency_request", "time", "nodecount"
]

def toNum(time):
    reference_date = datetime(2024, 12, 17)
    start_of_day = time.replace(hour=0, minute=0, second=0, microsecond=0)
    seconds_since_start_of_day = (time - start_of_day).total_seconds()
    fractional_day = seconds_since_start_of_day / (24 * 60 * 60)
    whole_days = (start_of_day - reference_date).days
    numeric_representation = whole_days + fractional_day
    return numeric_representation

# Define the getMult function
def getMult(time):
    time = toNum(time)
    trend = 1 + 0.01 * time
    daily = (np.sin(2 * np.pi * (time - 0.1)) + 1.5 ) / 1.5
    weekly = np.exp(
        -((time + 4.5) - 7 * np.round((time + 4.5) / 7))**(6) / (2200)
    )
    night = (
        np.exp(
            -(((time + 0.3) - 1 * np.round((time + 0.3) / 1))**4) * 20
        ) + 0.2
    )
    noise = (np.sin(time*41)) / 9 + 1

    total = trend * daily * weekly * night * noise
    return total

# Generate data for a week with a minute interval
start_time = datetime.now() - timedelta(days=7)
end_time = datetime.now()
time_interval = timedelta(minutes=1)

data = []
current_time = start_time
id_counter = 1

# Initial max values
max_total_cpu = 10000
max_total_ram = 10000

while current_time <= end_time:
    avg_usage_cpu = getMult(current_time)
    avg_usage_ram = getMult(current_time)

    # Scale avg_usage_cpu and avg_usage_ram to be within the range of 1 to max_total_cpu and max_total_ram
    avg_usage_cpu = round(avg_usage_cpu * 10000)
    avg_usage_ram = round(avg_usage_ram * 10000)

    # Check if average usage is close to max and double the max if necessary
    if avg_usage_cpu >= max_total_cpu * 0.95:
        max_total_cpu += 2000
        max_total_ram += 2000
    if avg_usage_cpu <= ((max_total_cpu - 2000) * 0.95):
        max_total_cpu -= 2000
        max_total_ram -= 2000

    total_cpu = max_total_cpu
    total_ram = max_total_ram
    average_request = round(avg_usage_cpu / 0.004)  # Example average request
    average_latency_request = np.random.uniform(0.1, 1.0)  # Example average latency
    nodecount = max_total_cpu / 2000  # Example node count

    row = [
        id_counter, total_cpu, avg_usage_cpu, total_ram, avg_usage_ram,
        average_request, average_latency_request, current_time, nodecount
    ]
    data.append(row)

    current_time += time_interval
    id_counter += 1

# Create a DataFrame
df = pd.DataFrame(data, columns=columns)

# Save to CSV (or any other format you prefer)
df.to_csv('database_seed.csv', index=False)

print("Database seed generated successfully!")
