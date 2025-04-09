import React, { useContext, useState } from "react";
import { Button, Flex, Modal, Typography, Switch } from "antd";
import { MainContext } from "../contexts/MainContext";

const { Text } = Typography;

const BaseLayoutHeader = () => {
  const {
    aicpGraph,
    setSelectedEntity,
    setPreviewEntity,
    setShowReagents,
    showReagents,
  } = useContext(MainContext);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCytoscapeModalVisible, setIsCytoscapeModalVisible] = useState(false);

  const showModal = () => {
    setIsModalVisible(true);
    setSelectedEntity(null);
    setPreviewEntity(null);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    setIsCytoscapeModalVisible(false); // Close Cytoscape JSON modal as well
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsCytoscapeModalVisible(false); // Close Cytoscape JSON modal
  };

 // Convert the graph to Cytoscape JSON format
const convertToCytoscapeJson = () => {
  if (!aicpGraph) return {};

  const cytoscapeJson = {
    elements: {
      nodes: aicpGraph.nodes.map((node) => {
        // Wrap the entire node object inside 'data' field without modifying the original fields
        return { data: node };
      }),

      edges: aicpGraph.edges.map((edge) => {
        // Wrap the entire edge object inside 'data' field without modifying the original fields
        return { data: edge };
      }),
    }
  };

  return JSON.stringify(cytoscapeJson, null, 2);
};

  // Graph JSON for the original graph
  const graphJson = JSON.stringify(aicpGraph, null, 2);

  // Cytoscape JSON
  const cytoscapeJson = convertToCytoscapeJson();

  return (
    <Flex
      justify="space-between"
      align="center"
      style={{ padding: "10px", paddingRight: "20px", maxHeight: 70 }}
    >
      <Flex gap="middle" wrap="wrap">
        <Switch
          checkedChildren="Show Reagents"
          unCheckedChildren="No Reagents"
          onClick={() => setShowReagents(!showReagents)}
        />
      </Flex>
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <pre style={{ margin: 0 }}>
            <b>Nodes:</b> {aicpGraph ? aicpGraph.nodes.length : "N/A"}
          </pre>
          <pre style={{ margin: 0 }}>
            <b>Edges:</b> {aicpGraph ? aicpGraph.edges.length : "N/A"}
          </pre>
          <Button
            disabled={!aicpGraph}
            type="primary"
            onClick={showModal}
            size="small"
          >
            View JSON
          </Button>
          {/* New Button to View Cytoscape JSON */}
          <Button
            disabled={!aicpGraph}
            type="primary"
            onClick={() => setIsCytoscapeModalVisible(true)}
            size="small"
          >
            View Cytoscape JSON
          </Button>
        </div>

        {/* Modal for the original graph JSON */}
        <Modal
          title={
            <Text strong copyable={{ text: graphJson }}>
              Graph JSON
            </Text>
          }
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          width={1200}
          styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
        >
          <pre>{graphJson}</pre>
        </Modal>

        {/* Modal for Cytoscape JSON */}
        <Modal
          title={
            <Text strong copyable={{ text: cytoscapeJson }}>
              Cytoscape Graph JSON
            </Text>
          }
          open={isCytoscapeModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          width={1200}
          styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
        >
          <pre>{cytoscapeJson}</pre>
        </Modal>
      </div>
    </Flex>
  );
};

export default BaseLayoutHeader;
