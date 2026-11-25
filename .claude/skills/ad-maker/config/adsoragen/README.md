# config/adsoragen/ — the four ComfyUI graphs Adsora Gen runs

Drop the ComfyUI "Export (API)" JSON here, one file per direction, with the
`__ADSORA_*__` placeholders in place of the per-job values:

    h3-t2v.json        text-to-video               (env alternative: ADSORA_WORKFLOW_H3_T2V)
    h3-i2v.json        image-to-video              (ADSORA_WORKFLOW_H3_I2V)
    h3-s2v.json        avatar: face + voice        (ADSORA_WORKFLOW_H3)
    h3-s2v-chain.json  avatar clips 2..N, optional (ADSORA_WORKFLOW_H3_CHAIN; falls back to h3-s2v)

`node tools/adsoragen.mjs --import-env <pulled.env>` writes them from the Adsora
webchat Vercel env. `node tools/adsoragen.mjs --health` lists what is here and
the placeholders each graph carries. Details: references/adsoragen-video.md §2.
These files are data the tool substitutes into — never author one from memory.
