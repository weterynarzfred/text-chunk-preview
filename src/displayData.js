import formatString from "./formatString";

function displayData(data, label) {
  let isDataActive = false;

  const button = document.createElement('div');
  button.id = 'png-text-button';
  button.classList.add('metadata-preview-button');
  button.textContent = label;
  button.addEventListener('click', () => {
    if (isDataActive)
      container.classList.remove('active');
    else
      container.classList.add('active');
    isDataActive = !isDataActive;
  });

  const container = document.createElement('div');
  container.id = 'png-text-chunks';
  for (const dataKey in data) {
    const dataElement = document.createElement('div');
    dataElement.classList.add('png-text-chunk');
    dataElement.innerHTML = `<span class="png-text-chunk-key">${dataKey}:</span> <span class="png-text-chunk-value">${formatString(data[dataKey])}</span>`;
    container.appendChild(dataElement);
  }

  document.getElementById('metadata-preview-buttons').appendChild(button);
  document.body.appendChild(container);
}

export default displayData;
