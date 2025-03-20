# aspire-mfe-visualizer-project

This repository is dedicated to the development of a network visualizer tool wrapped with a Micro-Frontend (MFE) architecture for React. The visualizer will provide interactive, real-time visualization of complex data relationships within the ASPIRE framework.

[Cytoscape JS](https://js.cytoscape.org/) is used to visualize the graph.

## Environment

Auth authority and client ID are needed to run this app. This can be retrieved from the AICP team.

## Docker Instructions

The docker container for the MFE Visualizer can be built with:

`docker compose build`

It can then be run with:

`docker compose up -d`

The app will be running on port `8083` when running within the container. The container runs `npm run start-prod` to intiate the application. This command runs the app with webpack serve without watching the code.

## Development Instructions

Use the following steps to get the code running locally and in development mode.

Run the following in the project root:

`npm run install`

Start the application in dev mode:

`npm run start`

From there the UI should auto update with changes made to the code base. It will run on port `4204` when ran this way.

The app has the following environment variables which can be used to control app functionality:

- `REACT_APP_API_URL` - URL for the synthplanning base API
- `REACT_APP_WEBSOCKET_URL` - *TBD if still needed*
- `REACT_APP_BASE_PATH` - Application base path
- `REACT_APP_STATIC_CONTENT_PATH` - Static content path
- `AUTH_AUTHORITY` - OIDC authority
- `AUTH_CLIENT_ID` - OIDC client ID

### Code Structure

- All static public assets should be placed in `public`
- `webpack.dev.js` is used for the development server, `webpack.prod.js` is meant for serving out of the container
