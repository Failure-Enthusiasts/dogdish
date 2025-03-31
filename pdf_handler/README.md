# PDF Handler

The PDF handler is a service that is responsible for processing the caterer PDF files.

## Installing Requirements

## Running in Development Mode

1. Create and activate a virtual environment:

    ``` bash
    python -m venv venv
    source venv/bin/activate  
    ```

2. Install the development requirements:

    ``` bash
    pip install -r requirements.txt
    ```

3. Configure you environment variables

    Make a copy of the [env.example](./env.example) file named [.env](./.env) and fill in the `GEMINI_API_KEY` with a key from [aistudio](https://aistudio.google.com/apikey).

    Export the environment variables with the command:

    ``` bash
    export $(cat .env)
    ```

4. Start the development server:

    ``` bash
    fastapi dev api.py
    ```

The service will start running on `localhost:8000`.
