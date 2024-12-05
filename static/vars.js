//#region colors
function updateCSSColor(inputId, cssVarName, onChange) {
    const input = document.getElementById(inputId);

    const storedColor = localStorage.getItem(cssVarName);
    if (storedColor) {
        input.value = storedColor;
        document.documentElement.style.setProperty(`--${cssVarName}`, storedColor);
    } else {
        document.documentElement.style.setProperty(`--${cssVarName}`, input.value);
    }

    input.addEventListener("input", () => {
        if (onChange) {
            onChange();
        }
        document.documentElement.style.setProperty(`--${cssVarName}`, input.value);
        localStorage.setItem(cssVarName, input.value);
    });
}
updateCSSColor("inp-bg-highlight", "main-background-highlight");
updateCSSColor("inp-bg", "main-background");
updateCSSColor("inp-text", "main-text");
updateCSSColor("inp-text-highlight", "main-text-highlight");
updateCSSColor("inp-border", "main-border", () => onChangeBorderColor());

function onChangeBorderColor() {
    debugger;
    const check = document.getElementById('inp-check-border');
    check.value = '1';
    check.checked = true;
    const event = new Event('input', { bubbles: true });
    check.dispatchEvent(event);
}
//#endregion
//#region selects
const fontInput = document.getElementById('inp-font');
const storedFont = localStorage.getItem('font-family');

if (storedFont) {
    fontInput.value = storedFont;
    document.documentElement.style.setProperty('--main-font-family', storedFont);
} else {
    document.documentElement.style.setProperty('--main-font-family', fontInput.value);
}

fontInput.addEventListener('change', () => {
    const selectedFont = fontInput.value;
    document.documentElement.style.setProperty('--main-font-family', selectedFont);
    localStorage.setItem('font-family', selectedFont);
});
//#endregion
//#region range inputs
function setupRangeInput(inputId, cssVarName, storageKey, min = 0, max = 100, defaultValue = 50, unit = '') {
    const input = document.getElementById(inputId);
    const storedValue = localStorage.getItem(storageKey);

    let value = storedValue !== null ? parseFloat(storedValue) : defaultValue;
    input.value = value;

    updateRangeCSS(input, cssVarName, value, unit, min, max);

    input.addEventListener('input', () => {
        let currentValue = parseFloat(input.value);
        updateRangeCSS(input, cssVarName, currentValue, unit, min, max);
        localStorage.setItem(storageKey, currentValue);
    });
}

function updateRangeCSS(input, cssVarName, value, unit, min, max) {
    const normalizedValue = ((value - min) / (max - min)) * 100;

    document.documentElement.style.setProperty(`--${cssVarName}`, `${value}${unit}`);
    input.style.setProperty('--value', `${normalizedValue}%`);
}

setupRangeInput('inp-opacity', 'main-opacity', 'opacity', 0.2, 1, 1); // Opacidade de 0.2 a 1
setupRangeInput('inp-font-weight', 'main-font-weight', 'font-weight', 100, 900, 500); // Peso da fonte de 100 a 900
setupRangeInput('inp-body-width', 'main-body-width', 'body-width', 30, 100, 100, '%'); // Largura do body de 30% a 100%
//#endregion
//#region checkboxes
const checkBorder = document.getElementById('inp-check-border');
const storedCheckBorder = localStorage.getItem('check-border');
const storedBorderColor = localStorage.getItem('main-border') || '#000000';

if (storedCheckBorder === '0') {
    updateBorderColor(storedBorderColor, 0);
} else {
    updateBorderColor(storedBorderColor, 1);
}

checkBorder.checked = storedCheckBorder === '1';

checkBorder.addEventListener('input', () => {
    const isChecked = checkBorder.checked;
    const opacity = isChecked ? 1 : 0;

    updateBorderColor(document.getElementById('inp-border').value, opacity);
    localStorage.setItem('check-border', isChecked ? '1' : '0');
});

function updateBorderColor(hexColor, opacity) {
    const rgbaColor = hexToRgba(hexColor, opacity);
    document.documentElement.style.setProperty('--main-border', rgbaColor);
}

function hexToRgba(hex, opacity) {
    const rgb = hexToRgb(hex);
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

function hexToRgb(hex) {
    hex = hex.replace('#', '');

    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    const bigint = parseInt(hex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}
//#endregion