export function writeToClipboard(text) {
    const element = document.createElement('input');
    element.value = text;
    element.style.opacity = '0';
    document.body.appendChild(element);
    element.select();
    document.execCommand('copy');
    document.body.removeChild(element);
}

export default {
    write: writeToClipboard,
};
