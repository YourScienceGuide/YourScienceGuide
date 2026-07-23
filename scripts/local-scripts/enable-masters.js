const Mux = require('@mux/mux-node');
const { video } = new Mux({
  tokenId: process.env.MUX_TOKEN_ID,
  tokenSecret: process.env.MUX_TOKEN_SECRET
});

async function enableAllMasters() {
  // Use 'video.assets.list' (lowercase)
  const assets = await video.assets.list({ limit: 50 });

  for (const asset of assets.data) {
    console.log(`Enabling master access for: ${asset.id}`);
    await video.assets.update(asset.id, { master_access: 'temporary' });
  }
  console.log('Done!');
}

enableAllMasters();