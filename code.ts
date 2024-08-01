// This plugin will open a window to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for plugins. Code in this file has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser environment (See https://www.figma.com/plugin-docs/how-plugins-run).

// This shows the HTML page in "ui.html".
figma.showUI(__html__);

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = (msg: { type: string; count: number }) => {
  // One way of distinguishing between different types of messages sent from
  // your HTML page is to use an object with a "type" property like this.
  if (msg.type === "create-rectangles") {
    const nodes: SceneNode[] = [];
    for (let i = 0; i < msg.count; i++) {
      const rect = figma.createRectangle();
      rect.x = i * 150;
      rect.fills = [{ type: "SOLID", color: { r: 1, g: 0.5, b: 0 } }];
      figma.currentPage.appendChild(rect);
      nodes.push(rect);
    }
    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
  }

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
};
figma.ui.onmessage = async (msg) => {
  if (msg.type === "process-tokens") {
    const { tokens } = msg;
    // Handle colors
    if (tokens.colors) {
      for (const [name, value] of Object.entries(tokens.colors)) {
        const paint = { type: "SOLID", color: hexToRgb(value as string) };
        const style = figma.createPaintStyle();
        style.paints = [paint as SolidPaint];
        style.name = name;
      }
    }

    // Handle typography
    if (tokens.typography) {
      const { fontFamily, fontSize, fontWeight, lineHeight } =
        tokens.typography;
      if (fontSize) {
        for (const [name, value] of Object.entries(fontSize)) {
          const style = figma.createTextStyle();
          style.setBoundVariable("fontSize", parseInt(value));
          style.fontSize = parseInt(value as string, 10);
          style.name = `font-size/${name}`;
        }
      }
      // TODO: Handle font weight
      // if (fontWeight) {
      //   for (const [name, value] of Object.entries(fontWeight)) {
      //     const style = figma.createTextStyle();
      //     style.fontWeight = value as number;
      //     style.name = `font-weight/${name}`;
      //   }
      // }
      if (lineHeight) {
        for (const [name, value] of Object.entries(lineHeight)) {
          const style = figma.createTextStyle();
          style.lineHeight = {
            value: parseFloat(value as string),
            unit: "PIXELS",
          };
          style.name = `line-height/${name}`;
        }
      }
      if (fontFamily) {
        const style = figma.createTextStyle();
        style.fontName = { family: fontFamily, style: "Regular" };
        style.name = `font-family/${fontFamily
          .replace(/\s+/g, "-")
          .toLowerCase()}`;
      }
    }

    // Handle spacing
    if (tokens.spacing) {
      for (const [name, value] of Object.entries(tokens.spacing)) {
        const style = figma.createGridStyle();
        style.layoutGrids = [
          {
            pattern: "COLUMNS",
            sectionSize: parseInt(value as string, 10),
            visible: false,
            alignment: "STRETCH",
            gutterSize: 0,
            count: 1,
          },
        ];
        style.name = `spacing/${name}`;
      }
    }

    // Handle border radius
    if (tokens.borderRadius) {
      for (const [name, value] of Object.entries(tokens.borderRadius)) {
        const style = figma.createEffectStyle();
        style.effects = [
          {
            type: "LAYER_BLUR",
            radius: parseInt(value as string, 10),
            visible: true,
          },
        ];
        style.name = `border-radius/${name}`;
      }
    }

    // Handle shadows
    if (tokens.shadows) {
      for (const [name, value] of Object.entries(tokens.shadows)) {
        const shadowValues = value as string;
        const [offsetX, offsetY, blur, color] = shadowValues.split(" ");
        const style = figma.createEffectStyle();
        style.effects = [
          {
            type: "DROP_SHADOW",
            color: hexToRgba(color),
            offset: { x: parseFloat(offsetX), y: parseFloat(offsetY) },
            radius: parseFloat(blur),
            visible: true,
            blendMode: "NORMAL",
          },
        ];
        style.name = `shadow/${name}`;
      }
    }

    // Handle other token types (e.g., text styles) similarly

    figma.notify("Design tokens applied successfully!");
  }
};

// Utility function to convert hex color to RGB
function hexToRgb(hex: string) {
  const bigint = parseInt(hex.replace("#", ""), 16);
  return {
    r: ((bigint >> 16) & 255) / 255,
    g: ((bigint >> 8) & 255) / 255,
    b: (bigint & 255) / 255,
  };
}
// Utility function to convert hex color to RGBA
function hexToRgba(hex: string) {
  let alpha = 1;
  if (hex.length === 9) {
    alpha = parseInt(hex.slice(7, 9), 16) / 255;
    hex = hex.slice(0, 7);
  }
  const rgb = hexToRgb(hex);
  return {
    ...rgb,
    a: alpha
  };
}
