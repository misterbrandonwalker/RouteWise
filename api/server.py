# Author: Ilia Vorontcov, Nathan Miller, Brandon Walker
#
# Organization: National Center for Advancing Translational Sciences (NCATS/NIH)

from typing import List, Optional
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict, validator
import os
import uuid
import logging
from uvicorn.logging import DefaultFormatter
import json
from datetime import datetime, timedelta
import asyncio
from rdkit.Chem import AllChem
from rdkit.Chem import Draw
from rdkit import Chem
import base64


# Set up logging
formatter = DefaultFormatter(fmt="%(levelname)s: %(message)s")
handler = logging.StreamHandler()
handler.setFormatter(formatter)

# Create a logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.addHandler(handler)

# Create Swagger Docs URL and attach it to the app
docs_base = os.getenv("url_api_docs_base", "/api/v1/docs/aicp")
alias = os.getenv("network_alias_nv_api", "nv_api")
docs_url = (
    docs_base
    + "/"
    + alias.split("-")[0].strip()
)
openapi_url = docs_url + "/openapi.json"

# Create a FastAPI app
app = FastAPI(openapi_url=openapi_url, docs_url=docs_url)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4204"],  # Allows CORS requests from localhost:3000
    allow_credentials=True,  # Allow cookies to be sent
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Directory to persist data
DATA_DIR = "data"
ROOMS_FILE = os.path.join(DATA_DIR, "rooms.json")
LAST_ACTIVITY_FILE = os.path.join(DATA_DIR, "last_activity.json")

# Ensure the data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Load rooms from file
def load_rooms():
    if os.path.exists(ROOMS_FILE):
        with open(ROOMS_FILE, "r") as file:
            data = json.load(file)
            if isinstance(data, list):
                return {room_id: [] for room_id in data}
            return data
    return {}

# Save rooms to file
def save_rooms():
    try:
        with open(ROOMS_FILE, "w") as file:
            json.dump(list(rooms.keys()), file)
    except IOError as e:
        logger.error(f"Failed to save rooms: {e}")
        raise Exception(f"Failed to save rooms: {e}")

# Load last activity times from file
def load_last_activity():
    if os.path.exists(LAST_ACTIVITY_FILE):
        with open(LAST_ACTIVITY_FILE, "r") as file:
            data = json.load(file)
            return {room_id: datetime.fromisoformat(timestamp) for room_id, timestamp in data.items()}
    return {}

# Save last activity times to file
def save_last_activity():
    with open(LAST_ACTIVITY_FILE, "w") as file:
        json.dump({room_id: timestamp.isoformat() for room_id, timestamp in last_activity.items()}, file)

# Load room data from file
def load_room_data(room_id):
    room_file = os.path.join(DATA_DIR, f"{room_id}-data.json")
    if os.path.exists(room_file):
        with open(room_file, "r") as file:
            return json.load(file)
    return {}

# Save room data to file
def save_room_data(room_id, data):
    room_file = os.path.join(DATA_DIR, f"{room_id}-data.json")
    with open(room_file, "w") as file:
        json.dump(data, file)

# Delete room data file
def delete_room_data(room_id):
    room_file = os.path.join(DATA_DIR, f"{room_id}-data.json")
    if os.path.exists(room_file):
        os.remove(room_file)

# Initialize rooms and last activity times
rooms = load_rooms()
last_activity = load_last_activity()

# Redirect root endpoint to Swagger docs
@app.get("/", include_in_schema=False)
async def redirect_to_docs():
    return RedirectResponse(url=docs_url)

# Add simple status endpoint to return 200
@app.get("/status")
async def status():
    return {"status": "OK"}

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, room_id: str = Query(default=None)):
    await websocket.accept()
    
    # Generate a random room ID if not provided
    if room_id is None or room_id == "":
        room_id = str(uuid.uuid4())

    # Add the client to the specified room
    if room_id not in rooms:
        rooms[room_id] = []
        save_rooms()
    rooms[room_id].append(websocket)
    last_activity[room_id] = datetime.now()
    save_last_activity()
    
    try:
        await websocket.send_text(f"Connected to room: {room_id}")
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=60)
                last_activity[room_id] = datetime.now()
                save_last_activity()
                # Broadcast the message to all clients in the room
                for client in rooms[room_id]:
                    await client.send_text(f"Message Received in {room_id}")
            except asyncio.TimeoutError:
                # Send a ping message to keep the connection alive
                await websocket.send_text("ping")
                last_activity[room_id] = datetime.now()
                save_last_activity()
    except WebSocketDisconnect:
        # Remove the client from the room on disconnect
        rooms[room_id].remove(websocket)
        if not rooms[room_id]:
            last_activity[room_id] = datetime.now()
            save_last_activity()

################
# HTML Content
################

# Read HTML content from file
def get_html_content(file_path: str) -> str:
    with open(file_path, 'r') as file:
        return file.read()

# Serve HTML content, hide from swagger
@app.get("/ws-test", include_in_schema=False)
async def getWsTestHtml():
    html_content = get_html_content("websocket_validation.html")
    return HTMLResponse(html_content)

################
# Rooms Endpoint
################

# Endpoint to return the list of rooms
@app.get("/rooms")
async def get_rooms():
    return {"rooms": list(rooms.keys())}

# Example of using the model
example_graph = {
  "nodes": [
    {
      "node_label": "ASPIRE-00000000149166",
      "is_balanced": False,
      "is_in_savi_130k": True,
      "is_in_uspto_full": False,
      "node_type": "Reaction",
      "rxid": "ASPIRE-00000000149166",
      "node_id": "ASPIRE-00000000149166",
      "rxsmiles": "N1(C(=O)C(N2C=CN=C2)=O)C=CN=C1.[F:15][C:16]1[CH:21]=[CH:20][C:19]([N:22]2[C:31]([CH2:32][CH2:33][CH2:34][CH2:35][C:36]([O:38][C:39]([CH3:42])([CH3:41])[CH3:40])=[O:37])=[CH:30][C:29]3[C:24](=[CH:25][CH:26]=[C:27]([CH:43]=[N:44]O)[CH:28]=3)[C:23]2=[O:46])=[CH:18][CH:17]=1>C1(C)C=CC=CC=1.ClCCCl.C(OCC)(=O)C>[C:43]([C:27]1[CH:28]=[C:29]2[C:24](=[CH:25][CH:26]=1)[C:23](=[O:46])[N:22]([C:19]1[CH:20]=[CH:21][C:16]([F:15])=[CH:17][CH:18]=1)[C:31]([CH2:32][CH2:33][CH2:34][CH2:35][C:36]([O:38][C:39]([CH3:42])([CH3:41])[CH3:40])=[O:37])=[CH:30]2)#[N:44]"
    },
    {
      "node_label": "BDERNNFJNOPAEC-UHFFFAOYSA-N",
      "inchikey": "BDERNNFJNOPAEC-UHFFFAOYSA-N",
      "is_in_savi_130k": True,
      "is_in_uspto_full": True,
      "node_type": "substance",
      "node_id": "BDERNNFJNOPAEC-UHFFFAOYSA-N",
      "smiles": "CCCO",
      "srole": "sm"
    },
    {
      "node_label": "GYWYRJBGPKHKCX-UHFFFAOYSA-N",
      "inchikey": "GYWYRJBGPKHKCX-UHFFFAOYSA-N",
      "is_in_savi_130k": True,
      "is_in_uspto_full": False,
      "node_type": "substance",
      "node_id": "GYWYRJBGPKHKCX-UHFFFAOYSA-N",
      "smiles": "Nc1sc2c(c1C(=O)O)CCC2",
      "srole": "sm"
    },
    {
      "node_label": "CYWIEOWOBJPEMV-UHFFFAOYSA-N",
      "inchikey": "CYWIEOWOBJPEMV-UHFFFAOYSA-N",
      "is_in_savi_130k": True,
      "is_in_uspto_full": False,
      "node_type": "substance",
      "node_id": "CYWIEOWOBJPEMV-UHFFFAOYSA-N",
      "smiles": "CCCOC(=O)c1c(N)sc2c1CCC2",
      "srole": "tm"
    }
  ],
  "edges": [
    {
      "start_node": "ASPIRE-00000000149166",
      "end_node": "CYWIEOWOBJPEMV-UHFFFAOYSA-N",
      "node_label": "1706658_3806431",
      "edge_label": "ASPIRE-00000000149166|CYWIEOWOBJPEMV-UHFFFAOYSA-N",
      "edge_type": "product_of",
      "is_in_savi_130k": True,
      "is_in_uspto_full": False,
      "uuid": "product_of_7ff022fe503a99593d8b68dc37c786c70b2f15442ba9eae5b6219e4e84590a35",
      "start_node_id": 1706658,
      "end_node_id": 3806431,
      "inchikey": "CYWIEOWOBJPEMV-UHFFFAOYSA-N",
      "rxid": "ASPIRE-00000000149166"
    },
    {
      "start_node": "BDERNNFJNOPAEC-UHFFFAOYSA-N",
      "end_node": "ASPIRE-00000000149166",
      "node_label": "3346942_1706658",
      "edge_label": "BDERNNFJNOPAEC-UHFFFAOYSA-N|ASPIRE-00000000149166",
      "edge_type": "reactant_of",
      "is_in_savi_130k": True,
      "is_in_uspto_full": False,
      "uuid": "reactant_of_e84641a371828ab2a0832875930b6a6f9a42a68b8b523f77a57250cec32a31c6",
      "start_node_id": 3346942,
      "end_node_id": 1706658,
      "inchikey": "BDERNNFJNOPAEC-UHFFFAOYSA-N",
      "rxid": "ASPIRE-00000000149166"
    },
    {
      "start_node": "GYWYRJBGPKHKCX-UHFFFAOYSA-N",
      "end_node": "ASPIRE-00000000149166",
      "node_label": "3833932_1706658",
      "edge_label": "GYWYRJBGPKHKCX-UHFFFAOYSA-N|ASPIRE-00000000149166",
      "edge_type": "reactant_of",
      "is_in_savi_130k": True,
      "is_in_uspto_full": False,
      "uuid": "reactant_of_b35c2df402b812567ce030cf4dde4a4b6a998875156eee7ebd0090121c1ad1b6",
      "start_node_id": 3833932,
      "end_node_id": 1706658,
      "inchikey": "GYWYRJBGPKHKCX-UHFFFAOYSA-N",
      "rxid": "ASPIRE-00000000149166"
    }
  ]
}


class Node(BaseModel):
    node_type: str
    node_label: str
    node_id: Optional[str] = None
    uuid: Optional[str] = None
    inchikey: Optional[str] = None
    srole: Optional[str] = None
    smiles: Optional[str] = None 
    rxid: Optional[str] = None
    rxsmiles: Optional[str] = None
    base64svg: Optional[str] = None

    model_config = ConfigDict(extra='allow')

    @validator('node_id', pre=True)
    def convert_node_id_to_str(cls, value):
        # Convert value to string if it's an integer
        if isinstance(value, int):
            return str(value)
        return value

class Edge(BaseModel):
    edge_type: str
    start_node: str
    end_node: str
    edge_label: str
    uuid: Optional[str] = None

    model_config = ConfigDict(extra='allow')


# Graph data model
class Graph(BaseModel):
    nodes: List[Node] = Field(description="List of nodes in the graph", examples=[example_graph["nodes"]])
    edges: List[Edge] = Field(description="List of edges in the graph", examples=[example_graph["edges"]])


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,  # Set the HTTP status code you want
        content={
            "detail": "Invalid input for Graph schema. Graph data must be a valid JSON object with 'nodes' and 'edges' keys. Please read the documentation for more information.",
            "errors": exc.errors(),
        },
    )

# Endpoint to push JSON data to a specific room
@app.post("/rooms/{room_id}/data")
async def push_json_to_room(room_id: str, json_data: Graph):
    if room_id not in rooms:
        # Create room if not found
        rooms[room_id] = []
        save_rooms()
    
    # Store the JSON data for the room
    save_room_data(room_id, json_data.model_dump())
    last_activity[room_id] = datetime.now()
    save_last_activity()
    
    # Notify all clients in the room about the new data
    for client in rooms[room_id]:
        await client.send_text(f"New data available at /rooms/{room_id}/data")
    
    return {"message": "Data pushed to room successfully", "room_id": room_id}

# Endpoint to retrieve JSON data for a specific room
@app.get("/rooms/{room_id}/data", 
        response_model=Graph, 
        response_model_exclude_none=True,
        response_model_exclude_unset=True
)
async def get_json_from_room(room_id: str):
    data = load_room_data(room_id)
    if not data:
        raise HTTPException(status_code=404, detail="No data found for this room")
    
    last_activity[room_id] = datetime.now()
    save_last_activity()
    return data


# Endpoint to download JSON data for a specific room
@app.get("/rooms/{room_id}/download")
async def download_room_data(room_id: str):
    room_file = os.path.join(DATA_DIR, f"{room_id}-data.json")
    if not os.path.exists(room_file):
        raise HTTPException(status_code=404, detail="No data found for this room")
    
    last_activity[room_id] = datetime.now()
    save_last_activity()
    return FileResponse(room_file, media_type='application/json', filename=f"{room_id}-data.json")


###################
# Helper Endpoints
###################

# Endpoint to convert reaction smiles to SVG
@app.get("/rxsmiles2svg")
async def rxsmiles_to_svg_endpoint(rxsmiles: str = 'CCO.CC(=O)O>>CC(=O)OCC.O', highlight: bool = True, img_width: int = 1800, img_height: int = 600, base64_encode: bool = True):
    rxn = AllChem.ReactionFromSmarts(rxsmiles, useSmiles=True)
    d2d = Draw.MolDraw2DSVG(img_width, img_height)

    d2d.DrawReaction(rxn, highlightByReactant=highlight)
    d2d.FinishDrawing()

    svg = d2d.GetDrawingText()
    if base64_encode:
        svg = base64.b64encode(svg.encode('utf-8')).decode('utf-8')
        return JSONResponse(content={"rxsmiles": rxsmiles, "svg_base64": svg})
    else:
        return JSONResponse(content={"rxsmiles": rxsmiles, "svg": svg})

# Endpoint to convert molecule SMILES to SVG
@app.get("/molsmiles2svg")
async def smiles_to_svg_endpoint(mol_smiles: str = 'Cc1cc(Br)cc(C)c1C1C(=O)CCC1=O', img_width: int = 300, img_height: int = 300, base64_encode: bool = True):
    if not mol_smiles:
        logger.error("Empty SMILES string provided")
        raise HTTPException(status_code=400, detail="Empty SMILES string provided")

    mol = Chem.MolFromSmiles(mol_smiles)
    if mol is None:
        logger.error(f"Invalid SMILES string: {mol_smiles}")
        raise HTTPException(status_code=400, detail=f"Invalid SMILES string: {mol_smiles}")

    d2d = Draw.MolDraw2DSVG(img_width, img_height)
    try:
        d2d.DrawMolecule(mol)
    except Exception as e:
        logger.error(f"Failed to draw molecule: {mol_smiles}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to draw molecule: {mol_smiles}")
    d2d.FinishDrawing()

    svg = d2d.GetDrawingText()
    if base64_encode:
        svg = base64.b64encode(svg.encode('utf-8')).decode('utf-8')
        return JSONResponse(content={"smiles": mol_smiles, "svg_base64": svg})
    else:
        return JSONResponse(content={"smiles": mol_smiles, "svg": svg})

##################
# Background Task
##################

# Background task to clean up inactive rooms
async def cleanup_inactive_rooms():
    while True:
        now = datetime.now()
        inactive_rooms = [room_id for room_id, last_active in last_activity.items() if now - last_active > timedelta(minutes=5)]
        for room_id in inactive_rooms:
            if room_id in rooms:
                del rooms[room_id]
                del last_activity[room_id]
                delete_room_data(room_id)
                save_rooms()
                save_last_activity()
        await asyncio.sleep(60)

# Start the cleanup task
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(cleanup_inactive_rooms())

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("port_nv_api", 5099))
    uvicorn.run(app, host="0.0.0.0", port=port)
