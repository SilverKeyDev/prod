from tasks import example_task

if __name__ == "__main__":
    result = example_task.delay()
    print("Task submitted! Waiting for result...")
    print(result.get(timeout=10))  # should print "Done"
