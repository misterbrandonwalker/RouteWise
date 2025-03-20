import React, { useContext } from "react";
import { Button, Flex, message } from "antd";
import { MainContext } from "../../contexts/MainContext";
import { mapGraphDataToCytoscape } from "../../helpers/commonHelpers";

// File name in the public assets directory
const exampleJsonFiles = [
  {
    name: "Demo Reactions",
    fileName: "demo_rxns.json"
  },
  {
    name: "Example 1",
    fileName: "json_example_1.json",
  },
  {
    name: "Example 2",
    fileName: "json_example_2.json",
  },
  {
    name: "Example 3",
    fileName: "json_example_3.json",
  },
  {
    name: "ASKCOS Route Sample",
    fileName: "askcos_route_sample.json",
    askcosRoute: true
  }
];

const ExampleGraphs = () => {
  const { setAicpGraph, updateCytoscapeGraph, appSettings } =
    useContext(MainContext);

  const handleLoadExample = async (exampleFileName, askcosRoute) => {
    if (exampleFileName) {
      try {
        const response = await fetch(
          `${appSettings.staticContentPath}/public/${exampleFileName}`
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();

        // Update the graph with the new data
        setAicpGraph(data);
        const mappedData = mapGraphDataToCytoscape(data, askcosRoute);
        updateCytoscapeGraph(mappedData);
      } catch (error) {
        console.error("Error loading example JSON:", error);
        message.error("Error loading example JSON");
      }
    } else {
      message.error("Example not found");
    }
  };

  const EXAMPLES_TITLE = "Load Example JSON";

  return (
    <div className="example-container">
      <h4>{EXAMPLES_TITLE}</h4>
      <Flex align="flex-start" gap="small">
        {exampleJsonFiles.map((example) => (
          <div key={"load_div_" + example.fileName}>
            <Button onClick={() => handleLoadExample(example.fileName, example.askcosRoute || false)}>
              {example.name}
            </Button>
            <br />
          </div>
        ))}
      </Flex>
    </div>
  );
};

export default ExampleGraphs;
