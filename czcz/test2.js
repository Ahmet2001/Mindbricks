const apiKey = process.env.OPENROUTER_API_KEY;

async function getKeyInfo() {
  const res = await fetch("https://openrouter.ai/api/v1/key", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

getKeyInfo().catch(console.error);