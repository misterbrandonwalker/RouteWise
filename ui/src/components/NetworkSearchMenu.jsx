import React, { useState, useContext } from "react";
import UploadJson from "./GraphRetrieval/UploadJson";
import WebSocketConnection from "./GraphRetrieval/WebSocketConnection";
import ExampleGraphs from "./GraphRetrieval/ExampleGraphs";
import { MainContext } from "../contexts/MainContext";
import { Select } from "antd";

const NetworkSearchMenu = () => {
  const { setSelectedEntity, setPreviewEntity, setReactionSources, setCytoscapeGraph, setAicpGraph } = useContext(MainContext);
  const [selectedRetrievalOption, setSelectedRetrievalOption] = useState("synthesis-route-search");

  const handleRetrievalOptionChange = (option) => {
    setSelectedRetrievalOption(option);
    setSelectedEntity(null);
    setPreviewEntity(null);
    setReactionSources({});
    setCytoscapeGraph([]);
    setAicpGraph(null);
  };

  return (
    <div id="NetworkSearchMenu" className="Network-search-menu">
      <div className="Graph-selector-container">
        <Select
          defaultValue="Upload-JSON"
          onChange={handleRetrievalOptionChange}
        >
          <Select.Option value="json">Upload JSON</Select.Option>
          <Select.Option value="cytoscape-json">Upload Cytoscape JSON</Select.Option> {/* New option */}
          <Select.Option value="examples">Example Graphs</Select.Option>
          <Select.Option value="websocket" disabled="true">
            WebSocket Connection
          </Select.Option>
        </Select>
      </div>
      <div className="Graph-form-container">
      {selectedRetrievalOption === "json" && <UploadJson convertToNormalFormat={false} />}
      {selectedRetrievalOption === "cytoscape-json" && <UploadJson convertToNormalFormat={true} />}
      {selectedRetrievalOption === "websocket" && <WebSocketConnection />}
      {selectedRetrievalOption === "examples" && <ExampleGraphs />}
    </div>

    </div>
  );
};

export default NetworkSearchMenu;
