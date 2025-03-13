import { jsonrepair } from 'jsonrepair';

function escapeHTML(htmlString) {
  return htmlString.toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatPrompt(string) {
  const splitString = string.split(/\n(Negative prompt|Steps): /, 5);

  if (splitString.length !== 5) throw ("unknown prompt format");

  const data = {
    "prompt": splitString[0],
    "negative prompt": splitString[2],
  };
  splitString[4] = "Steps: " + splitString[4];
  splitString[4].match(/[a-zA-Z0-9 ]+: (\{.*?\}|[^\{\}:,]+)(, |$)/g).forEach(e => {
    const split = e.split(/: (.+)/, 2);
    if (split.length !== 2) return;
    data[split[0]] = split[1].replace(/, $/, "");
    if (data[split[0]].startsWith('{')) {
      try {
        const formatted = JSON.stringify(JSON.parse(data[split[0]]), null, 2);
        data[split[0]] = formatted;
      } catch (e) { }
    }
  });

  return "<table>" + Object.entries(data).map(([key, value]) => `<tr class="prompt-part"><td><b>${key}</b></td><td><code>${escapeHTML(value)}</code></td></tr>`).join("") + "</table>" + `<span class="png-text-chunk-key">raw parameters: </span>` + escapeHTML(string);
}

function formatString(string) {
  if (typeof string !== "string") return string;

  if (string.startsWith('{')) {
    try {
      const data = JSON.parse(jsonrepair(string));
      return "<code>" + escapeHTML(JSON.stringify(data, null, 2)) + "</code>";
    } catch (e) { }
  }

  if (string.includes("Negative prompt")) {
    try {
      const data = formatPrompt(string);
      return data;
    } catch (e) { console.error(e); }
  }

  return (escapeHTML(string));
}

export default formatString;
