# boilerplate flask app: https://flask.palletsprojects.com/en/stable/quickstart/
from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"


# route: takes in event data
@app.route("/intake")
def intake():
    return "bleep bloop I now have data"


# route: responds to UI calls with data
@app.route("/upcoming_events")
def upcoming_events():
    return "events...are coming"

# route: healthcheck
@app.route("/ping")
def ping():
    return "PONG"

# function: database interaction bit

