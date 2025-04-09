# Image for REST wrapper around the WebSocket server

This microservice allows to use regular http(s) REST API around the WebSocket protocol/instance we have.

**Build the Image**

If on mac: `export DOCKER_DEFAULT_PLATFORM=linux/amd64`

`docker build -t websocket-microservice .`

**Start the Image**

`docker run -p 5099:5099 websocket-microservice`

**Test the Image**

<B>NOTE</B>: This command below will ignore the self-signed SSL certificate warning. In production environment we need to use proper certificates.

Check `test_endpoint.txt` for HTTP POST example via `curl`. Replace `room_id` with existing room from your client where you expect to send your data.

## Endpoint Parameters

**/websocket**

- `input_json`:	mandatory, expects a valid JSON with 2 parameters:
    * `message`: body of your request; contains graph data in JSON format
    * `room_id`: unique room ID from your client