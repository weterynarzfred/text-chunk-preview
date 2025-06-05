import assert from 'node:assert/strict';
import { test } from 'node:test';
import formatString from '../src/formatString.js';

// JSON formatting

test('formats JSON string with indentation', () => {
  const result = formatString('{"a":1}');
  assert.equal(result, '<code>{\n  &quot;a&quot;: 1\n}</code>');
});

// Escapes HTML

test('escapes HTML tags', () => {
  const result = formatString('<div>');
  assert.equal(result, '&lt;div&gt;');
});


// Prompt formatting

test('formats SD prompts', () => {
  const result = formatString(`very awa, 1girl, solo, redhead, french braid, (freckles, elk antlers, nose blush, round nose:1.2), <lora:illustrious\FKEY_WAI:0.5>
Negative prompt: censored, bar censor, mosaic censoring, wide hips, short skirt, miniskirt, pleated skirt, print shirt, symmetry, pattern
Steps: 20, TI hashes: "", Version: ComfyUI, Hashes: {"model": "1704e50726", "vae": "235745af8d"}`);
  assert.equal(result, `<table><tr class="prompt-part"><td><b>prompt</b></td><td><code>very awa, 1girl, solo, redhead, french braid, (freckles, elk antlers, nose blush, round nose:1.2), &lt;lora:illustrious\FKEY_WAI:0.5&gt;</code></td></tr><tr class="prompt-part"><td><b>negative prompt</b></td><td><code>censored, bar censor, mosaic censoring, wide hips, short skirt, miniskirt, pleated skirt, print shirt, symmetry, pattern</code></td></tr><tr class="prompt-part"><td><b>Steps</b></td><td><code>20</code></td></tr><tr class="prompt-part"><td><b>TI hashes</b></td><td><code>&quot;&quot;</code></td></tr><tr class="prompt-part"><td><b>Version</b></td><td><code>ComfyUI</code></td></tr><tr class="prompt-part"><td><b>Hashes</b></td><td><code>{
  &quot;model&quot;: &quot;1704e50726&quot;,
  &quot;vae&quot;: &quot;235745af8d&quot;
}</code></td></tr></table><span class="png-text-chunk-key">raw parameters: </span>very awa, 1girl, solo, redhead, french braid, (freckles, elk antlers, nose blush, round nose:1.2), &lt;lora:illustrious\FKEY_WAI:0.5&gt;
Negative prompt: censored, bar censor, mosaic censoring, wide hips, short skirt, miniskirt, pleated skirt, print shirt, symmetry, pattern
Steps: 20, TI hashes: &quot;&quot;, Version: ComfyUI, Hashes: {&quot;model&quot;: &quot;1704e50726&quot;, &quot;vae&quot;: &quot;235745af8d&quot;}`);
});
