import displayData from '../displayData';

describe('displayData', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="metadata-preview-buttons"></div>';
  });

  test('creates button and container with data', () => {
    const data = { foo: 'bar', baz: '<tag>' };
    displayData(data, 'LABEL');

    const button = document.getElementById('png-text-button');
    expect(button).not.toBeNull();
    expect(button.textContent).toBe('LABEL');

    const container = document.getElementById('png-text-chunks');
    expect(container).not.toBeNull();

    const chunks = container.querySelectorAll('.png-text-chunk');
    expect(chunks.length).toBe(2);
    expect(chunks[0].innerHTML).toBe('<span class="png-text-chunk-key">foo:</span> <span class="png-text-chunk-value">bar</span>');
    expect(chunks[1].innerHTML).toBe('<span class="png-text-chunk-key">baz:</span> <span class="png-text-chunk-value">&lt;tag&gt;</span>');
  });

  test('toggles container active class when button clicked', () => {
    const data = { foo: 'bar' };
    displayData(data, 'LABEL');

    const button = document.getElementById('png-text-button');
    const container = document.getElementById('png-text-chunks');

    expect(container.classList.contains('active')).toBe(false);
    button.dispatchEvent(new Event('click'));
    expect(container.classList.contains('active')).toBe(true);
    button.dispatchEvent(new Event('click'));
    expect(container.classList.contains('active')).toBe(false);
  });
});
