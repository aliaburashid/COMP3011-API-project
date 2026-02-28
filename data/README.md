# Seed data for COMP3011 API

## Option 1: Instagram influencers (Kaggle dataset) – recommended for “creative” coursework

Use the **Top Instagram Influencers** dataset so authors are seeded from a cited external source.

1. **Download the dataset**
   - Go to: [Top Instagram Influencers Dataset (Kaggle)](https://www.kaggle.com/datasets/visabelsarahsargunar/top-intagram-influencers-dataset)
   - Sign in to Kaggle, click **Download**, and unzip.

2. **Add the CSV to this project**
   - Place the main CSV file in this folder and name it exactly:  
     **`instagram-influencers.csv`**
   - If the downloaded file has another name (e.g. `influencers.csv`), rename or copy it to `instagram-influencers.csv`.

3. **Run the seed**
   ```bash
   npm run seed
   ```
   The script maps CSV columns to authors:
   - **name** ← `Name` or `Username` or `Instagram`
   - **email** ← generated from username (e.g. `username@example.com`)
   - **password** ← `seedpass1` (hashed on import)
   - **bio** ← built from `Category`, `Followers`, `Country` if present
   - **location** ← `Country` if present

   Column names are matched case-insensitively (e.g. `Username`, `username`, `Category`, `category` all work).

4. **Cite in your technical report**
   - Dataset: “Top Instagram Influencers Dataset”
   - Source: https://www.kaggle.com/datasets/visabelsarahsargunar/top-intagram-influencers-dataset
   - Licence: check the dataset page on Kaggle and cite it.
   - Example: “The authors (influencers) collection was seeded from the Top Instagram Influencers Dataset (Kaggle) for demo and testing; usernames/names mapped to API author profiles.”

---

## Option 2: Built-in JSON (no download)

If you don’t use the CSV, the seed script falls back to **`seed-authors.json`** (sample authors already in this folder). Run:

```bash
npm run seed
```

Duplicate emails are skipped. Safe to run multiple times.

---

## Summary

| File in `data/`                 | Behaviour |
|--------------------------------|-----------|
| `instagram-influencers.csv`   | Seed from Kaggle Instagram influencers (authors). |
| (no CSV)                      | Seed from `seed-authors.json`. |
