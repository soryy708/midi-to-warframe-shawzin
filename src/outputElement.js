import { writeToClipboard } from './util/clipboard';

function getOutputElementContents() {
    const outputContainerElement = document.getElementById('outputContainer');
    const outputElement = document.getElementById('output');
    if (outputContainerElement.classList.contains('active')) {
        return outputElement.innerText;
    }
    return '';
}

document.getElementById('copyButton').addEventListener('click', () => {
    const text = getOutputElementContents();
    if (text !== '') {
        writeToClipboard(text);
    }
});

function hideCopyButton() {
    const copyButton = document.getElementById('copyButton');
    copyButton.style.display = 'none';
}

function showCopyButton() {
    const copyButton = document.getElementById('copyButton');
    copyButton.style.display = 'block';
}

export function hideOutputElement() {
    const outputContainerElement = document.getElementById('outputContainer');
    outputContainerElement.classList.remove('active');
}

export function writeOutputElement(type, outputString) {
    const outputElement = document.getElementById('output');
    outputElement.innerText = outputString;
    switch (type) {
        case 'good':
            outputElement.classList.add('good');
            outputElement.classList.remove('bad');
            hideCopyButton();
            break;
        case 'bad':
        case 'error':
            outputElement.classList.remove('good');
            outputElement.classList.add('bad');
            hideCopyButton();
            break;
        default:
            outputElement.classList.remove('good');
            outputElement.classList.remove('bad');
            showCopyButton();
    }

    const outputContainerElement = document.getElementById('outputContainer');
    outputContainerElement.classList.add('active');
}

export default {
    hide: hideOutputElement,
    write: writeOutputElement,
};
