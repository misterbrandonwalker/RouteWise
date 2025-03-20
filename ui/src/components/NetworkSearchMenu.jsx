import React, { useState, useContext } from "react";
import UploadJson from "./GraphRetrieval/UploadJson";
import SyntheticGraphQueryV2 from "./GraphRetrieval/SyntheticGraphQueryV2";
import SynthRouteSearch from "./GraphRetrieval/SynthRouteSearch";
import ReactionSearch from "./GraphRetrieval/ReactionSearch";
import WebSocketConnection from "./GraphRetrieval/WebSocketConnection";
import ExampleGraphs from "./GraphRetrieval/ExampleGraphs";
import { MainContext } from "../contexts/MainContext";
import { Select } from "antd";

const NetworkSearchMenu = () => {
  const { appSettings, setSelectedEntity, setPreviewEntity, setReactionSources, setCytoscapeGraph, setAicpGraph } = useContext(MainContext);
  const [selectedRetrievalOption, setSelectedRetrievalOption] =
    useState("synthesis-route-search");

  const handleRetrievalOptionChange = (option) => {
    setSelectedRetrievalOption(option);
    setSelectedEntity(null);
    setPreviewEntity(null);
    setReactionSources({});
    setCytoscapeGraph([]);
    setAicpGraph(null);
  };

  return (
    <div
      id = "NetworkSearchMenu"
      className="Network-search-menu"
    >
      <div className="Graph-selector-container">
        <Select
          defaultValue="synthesis-route-search"
          onChange={handleRetrievalOptionChange}
        >
          <Select.Option value="synthesis-route-search">Synthesis Route Search</Select.Option>
          <Select.Option value="synthesis-graph-query">Synthesis Graph Query</Select.Option>
          <Select.Option value="reaction-search">Reaction (RXID) Search</Select.Option>
          <Select.Option value="json">Upload JSON</Select.Option>
          <Select.Option value="text" disabled="true">
            Text Input
          </Select.Option>
          <Select.Option value="examples">Example Graphs</Select.Option>
          <Select.Option value="websocket" disabled="true">
            WebSocket Connection
          </Select.Option>
          <Select.Option value="topyieldroutes" disabled="true">
            Top Yield Routes
          </Select.Option>
        </Select>
      </div>
      <div className="Graph-form-container">
        {selectedRetrievalOption === "json" && <UploadJson />}
        {selectedRetrievalOption === "synthesis-graph-query" && <SyntheticGraphQueryV2 />}
        {selectedRetrievalOption === "synthesis-route-search" && <SynthRouteSearch />}
        {selectedRetrievalOption === "reaction-search" && <ReactionSearch />}
        {selectedRetrievalOption === "websocket" && <WebSocketConnection />}
        {selectedRetrievalOption === "text" && <UploadJson />}
        {selectedRetrievalOption === "examples" && <ExampleGraphs />}
      </div>
    </div>
  );
};

export default NetworkSearchMenu;
