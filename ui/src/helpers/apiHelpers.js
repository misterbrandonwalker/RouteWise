const rxnSmiles2SimpleSvgPath = "rxsmiles2svg";
const rxnSmiles2RdkitSvgPath = "rxsmiles2svg";
const molSmiles2SimpleSvgPath = "molsmiles2svg";
const molSmiles2RdkitSvgPath = "molsmiles2svg";
const apiStatusPath = "status";

// Fetch reaction Simple SVG from rxn smiles
export const getReactionSimpleSvgByRxsmiles = async (baseUrl, rxsmiles, isPredicted = false, highlightAtoms = true) => {
  const url = `${baseUrl}/${rxnSmiles2SimpleSvgPath}`;
  const body = JSON.stringify({
    rxsmiles,
    base64_encode: true,
    retro: isPredicted,
    highlight_atoms: highlightAtoms,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data["svg"];
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Fetch reaction full RDKIT SVG from rxn smiles
export const getReactionRdkitSvgByRxsmiles = async (baseUrl, rxsmiles) => {
  const url = `${baseUrl}/${rxnSmiles2RdkitSvgPath}`;
  const body = JSON.stringify({
    rxsmiles: rxsmiles,
    depiction_mode: "simple",
    monochrome_atoms: true,
    base64_encode: true,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data["svg"];
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Fetch molecule Simple SVG from inchikey
export const getMoleculeSimpleSvgBySmiles = async (baseUrl, smiles) => {
  const url = `${baseUrl}/${molSmiles2SimpleSvgPath}`;
  const body = JSON.stringify({ smiles: smiles, base64_encode: true });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data["svg"];
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Fetch molecule full RDKIT SVG from inchikey
export const getMoleculeRdkitSvgBySmiles = async (baseUrl, smiles) => {
  const url = `${baseUrl}/${molSmiles2RdkitSvgPath}`;
  const body = JSON.stringify({
    smiles: smiles,
    monochrome_atoms: true,
    base64_encode: true,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data["svg"];
  } catch (error) {
    console.error(error);
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
    const url = `${baseUrl}/${apiStatusPath}`;
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
  const url = `${baseUrl}/api/v1/substance_utils/smiles2inchikey`;
  const body = JSON.stringify({ smiles: smiles });

  const response = await fetch(url, {
    method: "POST",
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