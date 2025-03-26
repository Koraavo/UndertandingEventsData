
// DOM elements cached for better performance
const elements = {
    paramsInput: document.getElementById("paramsInput"),
    output: document.getElementById("output"),
    loopVar: document.getElementById("loopVar"),
    listVar: document.getElementById("listVar"),
    varList: document.getElementById("varList"),
    extractedValues: document.getElementById("extractedValues")
};

// Initialize event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
    document.getElementById("startButton").addEventListener("click", extractValues);
    document.getElementById("rawDataButton").addEventListener("click", () => displayData(false, false));
    document.getElementById("prettifyDataButton").addEventListener("click", () => displayData(true, false));
    document.getElementById("highlightRawButton").addEventListener("click", () => displayData(false, true));
    document.getElementById("highlightPrettyButton").addEventListener("click", () => displayData(true, true));
}

// Helper function to normalize path first segments - DRY implementation
function normalizePathFirstSegment(pathArray) {
    if (pathArray[0] === "params" || pathArray[0] === "data") {
        pathArray[0] = "data"; // Standardize to "data"
    }
    return pathArray;
}

// Central data processing function - gets the raw input and parses it
function processData() {
    const inputText = elements.paramsInput.value.trim();

    if (!inputText) {
        return { raw: "", parsed: null };
    }

    try {
        return {
            raw: inputText,
            parsed: JSON.parse(inputText)
        };
    } catch (error) {
        throw new Error("Invalid JSON data");
    }
}

// Display data with options for prettify and highlight
function displayData(prettify = false, highlight = false) {
    try {
        // Use the common processData function to get and parse input
        const data = processData();

        if (!data.raw) {
            elements.output.innerText = "";
            return;
        }

        // Use the parsed data for display
        let displayText = prettify ? JSON.stringify(data.parsed, null, 2) : data.raw;

        if (highlight) {
            displayText = highlightVariables(displayText);
            elements.output.innerHTML = displayText;
        } else {
            elements.output.innerText = displayText;
        }
    } catch (error) {
        elements.output.innerText = "Error: " + error.message;
    }
}


function highlightVariables(text) {
    const listVar = elements.listVar.value.trim();
    const varList = elements.varList.value.split(",").map(v => v.trim());

    // Create a temporary div to safely work with HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerText = text;
    let htmlString = tempDiv.innerHTML;

    // Process each variable for highlighting
    for (let variable of varList) {
        const props = normalizePathFirstSegment(variable.split("."));
        
        // Skip the first part (data) and process other parts
        for (let i = 1; i < props.length; i++) {
            const propName = props[i];
            
            let propPattern;
            if (listVar) {
                // If a list variable is specified, create a precise regex for list context
                const listPath = normalizePathFirstSegment(listVar.split("."));
                const listPathRegex = listPath.map(p => `"${p}"\\s*:\\s*`).join('');
                
                // Regex to match property only within the list context
                propPattern = new RegExp(`${listPathRegex}\\[\\s*\\{[^}]*"${propName}"\\s*:`, 'gs');
            } else {
                // For non-list variables, highlight globally
                propPattern = new RegExp(`"${propName}"\\s*:`, 'g');
            }
            
            htmlString = htmlString.replace(propPattern, match =>
                `<span class="highlight">${match}</span>`);
        }
    }

    return htmlString;
}


// function highlightVariables(text) {
//     const listVar = elements.listVar.value.trim();
//     const varList = elements.varList.value.split(",").map(v => v.trim());

//     // Create a temporary div to safely work with HTML
//     const tempDiv = document.createElement('div');
//     tempDiv.innerText = text;
//     let htmlString = tempDiv.innerHTML;


//     // Create a pattern to find the list name in the JSON
//         /*
//         This regular expression is used to search for a specific pattern in text, particularly for finding a JSON property that starts a list. Let me break down each part:

//         `const listPattern = new RegExp(`"${lastPart}"\\s*:\\s*\\[`, 'g');`

//         1. `"${lastPart}"` - This looks for the literal string value of the `lastPart` variable surrounded by double quotes. For example, if `lastPart` is "items", it would search for `"items"`.

//         2. `\\s*` - This matches zero or more whitespace characters. The double backslash is needed because in JavaScript string literals, backslashes need to be escaped.

//         3. `:` - This matches a literal colon character, which in JSON separates property names from values.

//         4. `\\s*` - Again, this matches zero or more whitespace characters after the colon.

//         5. `\\[` - This matches an opening square bracket `[`, which in JSON indicates the start of an array. The backslash is needed to escape the square bracket since it's a special character in regex.

//         6. `'g'` - This flag makes the search global, meaning it will find all matches in the text rather than just the first one.

//         Altogether, this regex is searching for a pattern like `"property": [` with optional whitespace around the colon, where "property" is whatever value is stored in the `lastPart` variable. This would be useful for locating the beginning of a specific array in a JSON string.
        
//         */

//     // Highlight the list if provided
//     if (listVar) {
//         const listPath = normalizePathFirstSegment(listVar.split("."));
//         const lastPart = listPath[listPath.length - 1];

//         // Modified regex to ensure we're highlighting within the list context
//         const listPattern = new RegExp(`"${lastPart}"\\s*:\\s*\\[`, 'g');
//         htmlString = htmlString.replace(listPattern, match =>
//             `<span class="highlight">${match}</span>`);
//     }

//     // Highlight each property from the variables
//     for (let variable of varList) {
//         const props = normalizePathFirstSegment(variable.split("."));

//         // Skip the first part (data) and highlight all other parts
//         for (let i = 1; i < props.length; i++) {
//             const propName = props[i];
            
//             // More precise regex to avoid highlighting outside the intended context
//             let propPattern;
//             if (listVar) {
//                 // If a list variable is specified, ensure highlighting only within list items
//                 propPattern = new RegExp(`(?<=\\{[^\\}]*)"${propName}"\\s*:`, 'g');
//             } else {
//                 // For non-list variables, use the previous broader pattern
//                 propPattern = new RegExp(`"${propName}"\\s*:`, 'g');
//             }
            
//             htmlString = htmlString.replace(propPattern, match =>
//                 `<span class="highlight">${match}</span>`);
//         }
//     }

//     return htmlString;
// }


// Extract values from the JSON based on user input
function extractValues() {
    try {
        // Get user input using the common processData function
        const data = processData();

        if (!data.parsed) {
            throw new Error("Please enter JSON data in the params input field.");
        }

        const loopVar = elements.loopVar.value.trim();
        const listVar = elements.listVar.value.trim();
        const varListInput = elements.varList.value.trim();

        if (!varListInput) {
            throw new Error("Please enter at least one variable to extract.");
        }

        /*
        if the variable lists are name, price, url - the below code with split them into an array
        so if the user enters "name, price, url" it will be split into ["name", "price", "url"]
        */

        const varList = varListInput.split(",").map(v => v.trim());

        let extractedValues = "";

        if (!listVar) {
            // Handle direct variable extraction
            extractedValues = extractDirectVariables(data.parsed, varList);
        } else {
            // Handle list traversal
            extractedValues = extractListVariables(data.parsed, listVar, varList);
        }

        // Display the extracted values
        elements.extractedValues.innerText = extractedValues;

        // Highlight the raw data
        displayData(false, true);
    } catch (error) {
        elements.extractedValues.innerText = "Error: " + error.message + " Try again.";
    }
}

// Extract variables directly from the data object without traversing a list
function extractDirectVariables(paramsData, varList) {
    let result = "";

    // Process each variable path from the user input
    // Example: For input "params.affiliation, params.id", varList would be ["params.affiliation", "params.id"]
    for (let variable of varList) {
        // Split the path into key segments and normalize the first segment
        // Example: "params.affiliation" becomes ["data", "affiliation"]
        let keys = normalizePathFirstSegment(variable.split("."));

        // Start with the entire data object
        let value = paramsData;

        // Traverse through the object hierarchy following the path
        // Example: if keys is ["data", "affiliation"], we first access paramsData.data, then paramsData.data.affiliation
        // Traverse through the keys to get the value
        /*
        Now it will loop through the keys array and get the value of each key in the data object
        First iteration:
        key is "data"
        value starts as the entire JSON object
        value[key] is equivalent to value["data"] or value.data
        value becomes the data object (everything under the "data" key)


        Second iteration:

        key is "id"
        value is now the data object or value.data
        value[key] is equivalent to value["id"] or value.data.id
        value becomes 82850
        */
        for (let key of keys) {
            // Validate each step in the path exists
            if (value === undefined || value === null || value[key] === undefined) {
                throw new Error(`Invalid variable: ${variable}`);
            }

            // Move to the next level in the object hierarchy
            value = value[key];
        }

        // Format the output based on value type
        // For objects, stringify with pretty formatting; for primitives, display directly
        if (typeof value === "object" && value !== null) {
            // Example: params.billing_address: { "street": "123 Main St", "city": "Anytown" }
            result += `${variable}: ${JSON.stringify(value, null, 2)}\n`;
        } else {
            // Example: params.id: 82850
            result += `${variable}: ${value}\n`;
        }
    }

    return result;
}

// Extract variables from a list in the data object
function extractListVariables(paramsData, listVar, varList) {
    let result = "";

    // Navigate to the list - first split the path into segments
    // e.g., "params.items" becomes ["params", "items"]
    let listPath = normalizePathFirstSegment(listVar.split("."));
    let currentObj = paramsData;

    // Traverse through the object structure to find the list
    // For example: If listPath is ["data", "items"], we access paramsData.data.items
    for (let i = 0; i < listPath.length; i++) {
        if (currentObj === undefined || currentObj === null || currentObj[listPath[i]] === undefined) {
            throw new Error(`List not found: ${listVar}`);
        }
        currentObj = currentObj[listPath[i]];
    }

    // Ensure we have an array - if not, show error
    if (!Array.isArray(currentObj)) {
        throw new Error(`${listVar} is not an array`);
    }

    // Process each item in the array
    // For example: If currentObj is the "items" array, this iterates through each product
    for (let item of currentObj) {
        let itemOutput = "";

        // For each item, extract the requested properties
        // e.g., if varList contains "item.name", "item.price", we extract those values
        for (let variable of varList) {
            // Extract the property name after the dot
            // For example: "item.name" -> "name", "item.price" -> "price"
            let property = variable.split(".")[1];

            // Check if the property exists in the current item
            if (!(property in item)) {
                throw new Error(`Invalid variable: ${variable}`);
            }

            // Add the property and its value to the output
            // Format: "item.name: Product Name"
            itemOutput += `${variable}: ${item[property]}\n`;
        }

        // Add a blank line between items for better readability
        result += itemOutput + "\n";
    }

    return result;
}