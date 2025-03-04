# boilerplate flask app: https://flask.palletsprojects.com/en/stable/quickstart/
from flask import Flask, request
from database_handler.db import Event, insert_event
from pydantic import ValidationError



app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"


# route: takes in event data
@app.route("/intake", methods=["POST"])
def intake():
    incoming_event = request.json  # receives JSON
    print(f"Incoming events: {incoming_event}")

    # verify it's an Event
    for event in incoming_event["event"]:
        try:
            is_event = Event.model_validate(event)
            if is_event:
                # post to the DB as incoming_event['event']
                insert_event(is_event)

                return "Event Created!"

        except ValidationError as e:
            # raise an error
            return f"Validation Error: {e}"
    
    return '{"message": "ok"}'
    


# route: responds to UI calls with data
@app.route("/upcoming_events")
def upcoming_events():
    return "events...are coming"

# route: healthcheck
@app.route("/ping")
def ping():
    return "PONG"

# function: database interaction bit

