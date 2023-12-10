
export function pxToEm(pxValue) {
    const bodyFontSize = getComputedStyle(document.body).fontSize;
    const emValue = (pxValue * 10) /  parseFloat(bodyFontSize);

    return emValue;
}