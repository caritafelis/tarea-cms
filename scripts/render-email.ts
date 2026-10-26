import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import path from 'path';

async function main() {
    const [,, componentName, propsJson] = process.argv;
    if (!componentName) {
        console.error("Component name required.");
        process.exit(1);
    }

    const props = propsJson ? JSON.parse(propsJson) : {};

    try {
        const modulePath = path.resolve(__dirname, '../resources/js/emails', `${componentName}.tsx`);
        const module = await import(modulePath);
        const Component = module.default || module[componentName];
        
        if (!Component) {
            console.error(`Component ${componentName} not found in ${modulePath}`);
            process.exit(1);
        }

        const html = renderToStaticMarkup(React.createElement(Component, props));
        console.log(html);
    } catch (e: any) {
        console.error("Error rendering React component:", e.message);
        process.exit(1);
    }
}

main();
