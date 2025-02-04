# boilerplate flask app: https://flask.palletsprojects.com/en/stable/quickstart/
from flask import Flask, request
from database_handler.db import Event
from pydantic import ValidationError



app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"


# route: takes in event data
@app.route("/intake", methods=["POST"])
def intake():
    incoming_event = request.json  # receives JSON
    print(f"Incoming event: {incoming_event}")


    # verify it's an Event
    try:
        is_event = Event.model_validate_json(incoming_event['event'])
        if is_event:
            # post to the DB as incoming_event['event']
            print(f"is_event: {is_event}")
            return "Event Created!"

    except ValidationError as e:
        # raise an error
        return f"Validation Error: {e}"
    
    return "Event not created!"
    


# route: responds to UI calls with data
@app.route("/upcoming_events")
def upcoming_events():
    return "events...are coming"

# route: healthcheck
@app.route("/ping")
def ping():
    return "PONG"

# function: database interaction bit

