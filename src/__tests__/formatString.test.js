import formatString from '../formatString';

describe('formatString', () => {
  test('formats JSON string with indentation', () => {
    const result = formatString('{"a":1}');
    expect(result).toBe('<code>{\n  &quot;a&quot;: 1\n}</code>');
  });

  test('escapes HTML tags', () => {
    const result = formatString('<div>');
    expect(result).toBe('&lt;div&gt;');
  });

  test('formats SD prompts', () => {
    const input = `very awa, 1girl, solo, redhead, french braid, (freckles, elk antlers, nose blush, round nose:1.2), <lora:illustrious\\FKEY_WAI:0.5>
Negative prompt: censored, bar censor, mosaic censoring, wide hips, short skirt, miniskirt, pleated skirt, print shirt, symmetry, pattern
Steps: 20, TI hashes: "", Version: ComfyUI, Hashes: {"model": "1704e50726", "vae": "235745af8d"}`;
    const expected = `<table><tr class="prompt-part"><td><b>prompt</b></td><td><code>very awa, 1girl, solo, redhead, french braid, (freckles, elk antlers, nose blush, round nose:1.2), &lt;lora:illustrious\\FKEY_WAI:0.5&gt;</code></td></tr><tr class="prompt-part"><td><b>negative prompt</b></td><td><code>censored, bar censor, mosaic censoring, wide hips, short skirt, miniskirt, pleated skirt, print shirt, symmetry, pattern</code></td></tr><tr class="prompt-part"><td><b>Steps</b></td><td><code>20</code></td></tr><tr class="prompt-part"><td><b>TI hashes</b></td><td><code>&quot;&quot;</code></td></tr><tr class="prompt-part"><td><b>Version</b></td><td><code>ComfyUI</code></td></tr><tr class="prompt-part"><td><b>Hashes</b></td><td><code>{\n  &quot;model&quot;: &quot;1704e50726&quot;,\n  &quot;vae&quot;: &quot;235745af8d&quot;\n}</code></td></tr></table><span class="png-text-chunk-key">raw parameters: </span>very awa, 1girl, solo, redhead, french braid, (freckles, elk antlers, nose blush, round nose:1.2), &lt;lora:illustrious\\FKEY_WAI:0.5&gt;\nNegative prompt: censored, bar censor, mosaic censoring, wide hips, short skirt, miniskirt, pleated skirt, print shirt, symmetry, pattern\nSteps: 20, TI hashes: &quot;&quot;, Version: ComfyUI, Hashes: {&quot;model&quot;: &quot;1704e50726&quot;, &quot;vae&quot;: &quot;235745af8d&quot;}`;
    expect(formatString(input)).toBe(expected);
  });
});
