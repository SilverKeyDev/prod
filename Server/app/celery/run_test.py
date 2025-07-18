# run_test.py
from tasks import add

if __name__ == "__main__":
    result = add.delay(3, 4)
    print("Task submitted! Waiting for result...")
    print(result.get(timeout=10))  # should print 7