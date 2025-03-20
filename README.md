# aspire-network-visualizer
New light-weight version of the Network Visualizer for graph rendering and network investigation.

1.  [Prerequisite](#prerequisite)
2.  [Installation](#installation)
3.  [Visualize data using JSON examples](#visualize-data-using-json-examples)
4.  [JSON data structure explained](#json-data-structure-explained)
    * [Nodes structure](#nodes-structure)
    * [Edges structure](#edges-structure)
5.  [Where to find Room ID](#where-to-find-room-id)
6.  [Sending data using curl](#sending-data-using-curl)
7.  [Sending data via REST API](#sending-data-via-rest-api)
8.  [App settings](#app-settings)
9.  [Showing graphical content inside the nodes](#showing-graphical-content-inside-the-nodes)
10.  [Running containers on custom ports](#running-containers-on-custom-ports)

## Prerequisite

Required software you need to be installed before you move to visualizer installation step:

* [Docker desktop](https://www.docker.com/products/docker-desktop/)
* Any web-browser

Optional (not required, but nice to have):
* [Git](https://git-scm.com/)

## Installation

**In case you have git installed**, run the following command using terminal:

* via HTTPS: 

    ```
    git clone https://github.com/ncats/aspire-network-visualizer.git
    ```
* via SSH: 

    ```
    git clone git@github.com:ncats/aspire-network-visualizer.git
    ```

<hr>

**In case you DON'T have Git installed:**

* find green button named "Code" and click on it
* click "Download ZIP" link at the bottom of the list
* once downloaded - unzip the code and open terminal at the root of the unzipped folder

![Alt](/images/git-zip.png "Download ZIP archive")

<hr>

Next step - open the folder with the code (cloned from Git or unzipped) with your Terminal and run the following command: 

```
docker-compose up -d
```

**Note:** If on a Mac M series chip `export DOCKER_DEFAULT_PLATFORM=linux/amd64` may be needed to run containers.

After a few minutes, you should be able to see 3 new containers up and running in your Docker:

![Alt](/images/docker-images.png "Docker containers up and running")

Open `http://localhost:3000` to start the Network Visualizer app and follow the next steps in this document.

## Visualize data using JSON examples

You can use attached JSON examples (check `json-examples` folder) to render some prepared graphs:

![Alt](/images/json.gif "How to visualize graph using JSON files")

In the following section we'll describe basic graph structure, so you can create and render your own datasets.

## JSON data structure explained

If you open any of the attached to this repo examples in JSON format - you may notice, that graph structure is as simple as the following pattern:

```
{
  "nodes": []
  "edges": []
}
```

Where `nodes` is an array of graph nodes, and `edges` - array of graph edges (connectors between the nodes).

<hr>

### Nodes structure

In the table below you can find all supported attributes for the **nodes**:

| Attribute | Description |
| --- | --- |
| `node_type` | Type of the node, can be: `reaction` (represented by red circle) or `substance` (gray square box) |
| `node_label` | Label for the node displayed on hover |
| `srole` | _Works with substance nodes only:_ can be `sm` (**starting material**), `tm` (**target molecule**) or `im` (**intermediate material**). We use different colors depending on the node role, so you can easily find e.g. target molecule in a big graph |
| `base64svg` | If you want to include an image for the node - you can do that using this parameter. Check [this section](#showing-graphical-content-inside-the-nodes) for details) |

<hr>

### Edges structure

In the following table below you'll find all supported parameters for the **edges**:

| Attribute | Description |
| --- | --- |
| `edge_type` | Type of the edge, its color depends on the type: `product_of` (orange line), `reactant_of` (blue line) or `reagent_of` (gray line) |
| `start_node` | Node label for the node at the beginning of the edge |
| `end_node` | Node label for the node at the end of the edge |

## Where to find Room ID

Network Visualizer comes with a UI component as well as a few useful tools like websocket server and REST API server to handle graph data from client to server. Basically, Visualizer connects listens to a specific broadcast message, and we use something we're calling "Room ID" for that purpose to identify all potential clients could be connected to the same server.

**Room ID** is a unique and random identificator for your app instance, and you'll get a new one every time you run the app or refresh a browser's page. You can also open several tabs in your browser with the same Visualizer - but every single instance will get their own unique Room ID. That way, only messages (with graph data you're about to send) server sends to your app will be rendered, based on the passed Room ID, which will prevent any potential collisions.

You can find your Room ID at the right top corner, and if you need to copy that value - just click "copy" icon next to the ID:

![Alt](/images/room-id.gif "How to find Room ID")

## Sending data using curl

Another way to render graphs - using `curl` command. Here's a basic snippet for that:

```
curl -X 'POST' \
  'http://localhost:5099/rooms/{ROOM_ID}' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
      "nodes": [],
      "edges": []
    }'
```

Then you just need to: 

* adjust array of nodes and edges (you can find graph examples in `json-examples` folder)
* replace `ROOM_ID` with the unique ID for your Network Visualizer ([how to find it?](#where-to-find-room-id))

## Sending data via REST API

You can also use REST API to send your graph data to the Network Visualizer. This project includes a [Swagger page](http://localhost:5099/api/v1/docs/aicp/nv_api#/default/send_message_websocket_post) where you can try it out.

That page includes one graph as an example, but you can update nodes and edges right there before sending to Visualizer.

You still will need you [Room ID](#where-to-find-room-id) in order to send graph data to your specific app.

![Alt](/images/rest-api.gif "Using REST API and Swagger")

## App settings

You can change some app settings using "Settings" button in the bottom right corner:

![Alt](/images/settings.gif "App settings")

## Showing graphical content inside the nodes

This is an advanced feature and requires to have a solid understanding of some web-based technologies like **SVG** ([_Scalable Vector Graphics_](https://en.wikipedia.org/wiki/SVG)) and strings encoding.

Basically, to add a background (e.g. molecule structure) to the node, you'll need to make the following adjustments to the node:

```
{
    // ...other node attributes
    "node_type": "custom",
    "base64svg": "base64_encoded_image"    
}
```

What we see here:

* we replaced `node_type` to type `custom` (this will allow rendering SVG inside this specific node)
* we added new attribute `base64svg` that must contain encoded SVG in a specific format (explained below)

The last missing chunk of this puzzle is how to encode any SVG image, so Network Visualizer can display it correctly. For that purpose we're going to use the following SVG code as an example:

```
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24">
  <circle cx="12" cy="10" r="6" fill="#f00" />
  <circle cx="7" cy="20" r="3" fill="#00f" />
  <circle cx="17" cy="20" r="3" fill="#00f" />
  <line x1="7" y1="20" x2="12" y2="10" stroke="#000" stroke-width="2" />
  <line x1="17" y1="20" x2="12" y2="10" stroke="#000" stroke-width="2" />
</svg>
```

Which represents a molecule structure for water (H2O):

![Alt](/images/h2o.png "Water molecule")

Now, we need to convert that SVG to [base64](https://en.wikipedia.org/wiki/Base64) string (you can find code snippet for your preferred programming language e.g. JavaScript or Python).

Finally, once we get base64 line like this for the water molecule:

```
PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjYiIGZpbGw9IiNmMDAiIC8+CiAgPGNpcmNsZSBjeD0iNyIgY3k9IjIwIiByPSIzIiBmaWxsPSIjMDBmIiAvPgogIDxjaXJjbGUgY3g9IjE3IiBjeT0iMjAiIHI9IjMiIGZpbGw9IiMwMGYiIC8+CiAgPGxpbmUgeDE9IjciIHkxPSIyMCIgeDI9IjEyIiB5Mj0iMTAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIiAvPgogIDxsaW5lIHgxPSIxNyIgeTE9IjIwIiB4Mj0iMTIiIHkyPSIxMCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIC8+Cjwvc3ZnPg==
```

Now, before we pass that as an attribute for the node - we need to concatenate this base64 with some metadata:

```
"base64svg": "<PUT_YOUR_SVG_ENCODED_AS_BASE64_HERE>"
```

Just replace `PUT_YOUR_SVG_ENCODED_AS_BASE64_HERE` with the string we just generated, so the final version of it will look like the following:

```
"base64svg": "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjYiIGZpbGw9IiNmMDAiIC8+CiAgPGNpcmNsZSBjeD0iNyIgY3k9IjIwIiByPSIzIiBmaWxsPSIjMDBmIiAvPgogIDxjaXJjbGUgY3g9IjE3IiBjeT0iMjAiIHI9IjMiIGZpbGw9IiMwMGYiIC8+CiAgPGxpbmUgeDE9IjciIHkxPSIyMCIgeDI9IjEyIiB5Mj0iMTAiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIyIiAvPgogIDxsaW5lIHgxPSIxNyIgeTE9IjIwIiB4Mj0iMTIiIHkyPSIxMCIgc3Ryb2tlPSIjMDAwIiBzdHJva2Utd2lkdGg9IjIiIC8+Cjwvc3ZnPg=="
```

## Generating SVGs from Smiles

If your nodes have are of type 'Reaction' or 'Substance' you can include 'rxsmiles' or 'smiles' respectively to have that smiles structure visualized within the node.
