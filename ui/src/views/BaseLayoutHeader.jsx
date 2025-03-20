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

  const showModal = () => {
    setIsModalVisible(true);
    setSelectedEntity(null);
    setPreviewEntity(null);
  };

  const handleOk = () => {
    setIsModalVisible(false);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const graphJson = JSON.stringify(aicpGraph, null, 2);

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
        </div>
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
      </div>
    </Flex>
  );
};

export default BaseLayoutHeader;
