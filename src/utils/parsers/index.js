export const onlyLatinasAndNumbersSymbols = (v) =>
    v.replace(/[^A-Za-z0-9 \-—']/g, '');

export const formatDomain = (text) => {
    return text + '.art';
};