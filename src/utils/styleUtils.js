export function css(node, properties) {
    const setProps = (props) => {
        Object.keys(props).forEach((prop) => (node.style[prop] = props[prop]));
    };
    setProps(properties);
    return {
        update: setProps,
    };
}

// example:
//      use:css={{fontSize: `${pxToEm(value)}em`}}