const rxnSmiles2RdkitSvgPath = "rxsmiles2svg";
const molSmiles2RdkitSvgPath = "molsmiles2svg";
const apiStatusPath = "status";


// Fetch reaction full RDKIT SVG from rxn smiles
export const getReactionRdkitSvgByRxsmiles = async (baseUrl, rxsmiles) => {
  // Encode the rxsmiles string to ensure it's safely passed in the URL
  const encodedRxsmiles = encodeURIComponent(rxsmiles);

  // Construct the URL with query parameters
  const url = `${baseUrl.trim()}/${rxnSmiles2RdkitSvgPath}?rxsmiles=${encodedRxsmiles}&highlight=true&img_width=1800&img_height=600&base64_encode=true`;

  console.log("Fetching from:", url);

  try {
    // Perform the GET request without a body and without headers
    const response = await fetch(url);

    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // Assuming the response contains an "svg" field
    const data = await response.json();
    return data["svg_base64"];
  } catch (error) {
    console.error("Error fetching SVG:", error);
    return null;
  }
};

// Fetch molecule full RDKIT SVG from inchikey
export const getMoleculeRdkitSvgBySmiles = async (baseUrl, smiles) => {
  // Construct the URL with query parameters
  const encodedSmiles = encodeURIComponent(smiles);
  const url = `${baseUrl.trim()}/${molSmiles2RdkitSvgPath}?mol_smiles=${encodedSmiles}&img_width=300&img_height=300&base64_encode=true`;

  console.log("Fetching from:", url);

  try {
    // Perform the GET request without a body or custom headers
    const response = await fetch(url);

    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // Assuming the response contains an "svg" field
    const data = await response.json();
    return data["svg_base64"];
  } catch (error) {
    console.error("Error fetching SVG:", error);
    return null;
  }
};

const substanceNodes = ["substance"];
const reactionNodes = ["reaction"];

export const mapAicpGraphWithSVG = async (baseUrl, aicpGraph) => {
  // Create an array to hold all promises
  const promises = aicpGraph.nodes.map(async (node) => {
    const nodeType = node.node_type.toLowerCase();
    if (substanceNodes.includes(nodeType)) {
      const svg = await getMoleculeSvg(baseUrl, node.node_label);
      if (svg) {
        const base64Svg = btoa(svg);
        node.base64svg = base64Svg; // Add the base64 encoded SVG to the node
      }
    } else if (reactionNodes.includes(nodeType)) {
      const svg = await getReactionSvg(baseUrl, node.node_label);
      if (svg) {
        const base64Svg = btoa(svg);
        node.base64svg = base64Svg; // Add the base64 encoded SVG to the node
      }
    } else {
      // Nothing for now
    }
  });

  // Wait for all promises to resolve
  await Promise.all(promises);

  // Return the modified aicpGraph
  return aicpGraph;
};

export const checkApiStatus = async (baseUrl) => {
  try {
    const url = `${baseUrl.trim()}/${apiStatusPath}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    // Check if the response was successful (status 200-299)
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data); // Handle the data here
    return data; // This will return the data
  } catch (error) {
    console.error(error);
    return { error: true }; // This will return the error object if an error occurred
  }
};

export const moleculeSmilesToInchikey = async (baseUrl, smiles) => {
  const url = `${baseUrl.trim()}/api/v1/substance_utils/smiles2inchikey`;
  const body = JSON.stringify({ smiles: smiles });

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: body,
  });

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  const data = await response.json();
  return data.inchikey;
};

export const getInchikeysFromGraph = (graph = []) => {
  return graph.filter(item => item.data.inchikey !== undefined).map(item => item.data.inchikey);
}