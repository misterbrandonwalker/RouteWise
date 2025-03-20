import React, { useState, useEffect } from "react";

// components
import NetworkVisualizer from "./views/Cytoscape";

// context
import { MainContext } from "./contexts/MainContext";

// utils
import {
  defaultAppSettings,
  defaultGraphSettings,
  getSvgDimensions,
  graphLayouts,
} from "./helpers/commonHelpers";
import {
  getReactionRdkitSvgByRxsmiles,
  getMoleculeRdkitSvgBySmiles,
  checkApiStatus,
  getInchikeysFromGraph,
} from "./helpers/apiHelpers";

const defaultApiStatus = { error: false };

function App() {
  const [appSettings, setAppSettings] = useState(defaultAppSettings);
  const [graphSettings, setGraphSettings] = useState(defaultGraphSettings);
  const [networkGraph, setNetworkGraph] = useState(null);
  const [cytoscapeGraph, setCytoscapeGraph] = useState([]);
  const [aicpGraph, setAicpGraph] = useState(null);
  const [layout, setLayout] = useState(graphLayouts.HIERARCHICAL);
  const [nodeSvgs, setNodeSvgs] = useState({});
  const [reactionSources, setReactionSources] = useState({});
  const [zoomLevel, setZoomLevel] = useState();
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [previewEntity, setPreviewEntity] = useState(null);
  const [apiStatus, setApiStatus] = useState(defaultApiStatus);
  const [showReagents, setShowReagents] = useState(false);
  const [duplicateReagents, setDuplicateReagents] = useState(true);
  const [highlightAtoms, setHighlightAtoms] = useState(true);
  const [showKetcher, setShowKetcher] = useState(false);
  const [ketcherSmiles, setKetcherSmiles] = useState("");
  const [inventoryStatus, setInventoryStatus] = useState({});

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const apiStatusRes = await checkApiStatus(appSettings.apiUrl);
        setApiStatus(!!apiStatusRes.error ? { error: true } : defaultApiStatus);
      } catch (error) {
        console.error("Error fetching API status:", error);
      }
    };

    checkStatus();
  }, []);

  const addNodeSvg = (nodeSvg) => {
    setNodeSvgs((prev) => ({
      ...prev,
      ...nodeSvg,
    }));
  };


  const updateCytoscapeGraph = async (mappedGraph) => {
    // Array to hold all promises
    const promises = [];
    setSelectedEntity(null);
    setPreviewEntity(null);
    setReactionSources({});

    // Get inventory status for all inchikeys presented in the mapped graph
    setInventoryStatus("UNAVAILABLE");

    console.log("mappedGraph", mappedGraph);

    // populate molecules if any
    mappedGraph.forEach((graphElement) => {
      const molId = graphElement.data.id;
      const nodeType = graphElement.data.nodeType;
      if (graphElement.data.svg) {
        // Set graph SVG as precompiled SVG
        const svgUrl = graphElement.data.svg;

        // set up SVG dimensions to render reactions as bigger blocks
        const dimensions = getSvgDimensions(svgUrl);
        graphElement.data.width = dimensions.width;
        graphElement.data.height = dimensions.height;

        addNodeSvg({ [molId]: svgUrl });
      } else {
        // If SVG is not precompiled, fetch it from Smiles
        if (nodeType === "substance" && graphElement.data.canonical_smiles) {
          const smiles = graphElement.data.canonical_smiles;
          const substancePromise = getMoleculeRdkitSvgBySmiles(
            appSettings.apiUrl,
            smiles
          ).then((svg) => {
            if (svg) {
              const svgUrl = `data:image/svg+xml;base64,${svg}`;
              graphElement.data.svg = svgUrl;

              if (graphElement.data.srole === "tm") {
                // set up SVG dimensions to render TM as bigger blocks
                const dimensions = getSvgDimensions(svgUrl);
                graphElement.data.width = dimensions.width;
                graphElement.data.height = dimensions.height;

                // this custom type will add SVG depiction to a block
                graphElement.data.type = "custom";
              } else {
                // Hide non-target molecule depictions by default
                // We just won't add custom style, so SVG won't be rendered as block's background
                graphElement.data.type = appSettings.showStructures
                  ? "custom"
                  : "";
              }
              addNodeSvg({ [molId]: svgUrl });
            } else {
              console.error("Failed to fetch substance SVG");
            }
          });
          promises.push(substancePromise);
        } else if (nodeType === "reaction" && graphElement.data.rxsmiles) {
          const { rxid, rxsmiles, isPredicted } = graphElement.data;

          // Get reaction SVG
          const reactionSvgPromise = getReactionRdkitSvgByRxsmiles(
            appSettings.apiUrl,
            rxsmiles,
            isPredicted,
            highlightAtoms
          ).then((svg) => {
            if (svg) {
              const svgUrl = `data:image/svg+xml;base64,${svg}`;
              graphElement.data.svg = svgUrl;
              graphElement.data.type = "custom";
              addNodeSvg({ [molId]: svgUrl });

              // set up SVG dimensions to render reactions as bigger blocks
              const dimensions = getSvgDimensions(svgUrl);
              graphElement.data.width = dimensions.width;
              graphElement.data.height = dimensions.height;
            } else {
              console.error("Failed to fetch reaction SVG");
            }
          });
          promises.push(reactionSvgPromise);
        }
      }
    });

    // Wait for all SVG promises to resolve
    Promise.all(promises)
      .then(() => {
        console.log("All SVGs and requests fetched and processed.");
        // Perform any additional actions after all promises complete
      })
      .catch((error) => {
        console.error("Error fetching one or more SVGs:", error);
      })
      .finally(() => {
        setCytoscapeGraph(mappedGraph);
      });
  };

  const updateCytoscapeGraphNode = (molId, molSvg) => {
    setCytoscapeGraph((prev) => {
      const newGraph = prev.map((node) => {
        if (node.data.id === molId) {
          return {
            data: {
              ...node.data,
              type: "custom",
              svg: molSvg,
            },
          };
        }
        return node;
      });

      return newGraph;
    });
  };

  var appContext = <NetworkVisualizer />;

  return (
    <MainContext.Provider
      value={{
        appSettings,
        setAppSettings,
        graphSettings,
        setGraphSettings,
        networkGraph,
        setNetworkGraph,
        cytoscapeGraph,
        setCytoscapeGraph,
        aicpGraph,
        setAicpGraph,
        layout,
        setLayout,
        nodeSvgs,
        setNodeSvgs,
        addNodeSvg,
        updateCytoscapeGraph,
        updateCytoscapeGraphNode,
        zoomLevel,
        setZoomLevel,
        selectedEntity,
        setSelectedEntity,
        previewEntity,
        setPreviewEntity,
        apiStatus,
        showReagents,
        setShowReagents,
        showKetcher,
        setShowKetcher,
        ketcherSmiles,
        setKetcherSmiles,
        duplicateReagents,
        setDuplicateReagents,
        highlightAtoms,
        setHighlightAtoms,
        inventoryStatus,
        setInventoryStatus,
        reactionSources,
        setReactionSources,
      }}
    >
      {appContext}
    </MainContext.Provider>
  );
}

export default App;
