Firexplorer
A wildfire exposure explorer for California communities, built with Next.js and the ArcGIS Maps SDK for JavaScript.

---

## Why this project exists

On September 5, 2024, the Line Fire started in Highland, CA, less than a minute from where I live. It burned more than 43,000 acres and pushed one question to the front for my community:

**How exposed are we, really?**

Firexplorer started as an ArcGIS Pro analysis, evolved into a StoryMap, and then became a full web application so this question could be explored quickly by anyone.

---

## What Firexplorer does today

- Landing experience with direct paths to the map, about page, and resources
- Search any California city and analyze nearby wildfire perimeter history
- Adjustable proximity radius (5, 10, 15, 20 miles)
- Real-time pan-to-update behavior (analysis refreshes as map context changes)
- Focus mode to emphasize fires inside the current analysis area
- Fire detail interaction on click (name, year, acres, cause)
- Exposure scoring panel with concise rationale and suggested next steps
- Mobile-optimized panel behavior and responsive page layouts

---

## Routes

- `/` - Landing page
- `/explore` - Interactive map application
- `/about` - Project context, motivation, and methodology overview
- `/resources` - Data + platform stack used in the project

---

## Data sources

- **CAL FIRE** wildfire perimeter dataset (processed/published as hosted feature layers)
- **U.S. Census Bureau** populated places dataset (city/community context)
- **ArcGIS Online** hosted layers and platform services

> Note: The wildfire layer represents mapped fire perimeters, not every ignition event. Smaller/contained incidents may not be represented as perimeter polygons.

---

## Tech stack

- Next.js (App Router) + TypeScript
- React
- Tailwind CSS
- ArcGIS Maps SDK for JavaScript (`@arcgis/core`)
- ArcGIS Online (hosted feature layers)
- Vercel (deployment)

---

## Live app

The app is hosted online. If you are reading this from the repo and want to share it, add your production URL here:

- `https://firexplorer.vercel.app`

---

## Running locally (optional)

Even though the app is hosted, local run is still useful for development/testing.

### 1) Install

```bash
git clone https://github.com/landscamp04/firexplorer.git
cd firexplorer
npm install
```

### 2) Create `.env.local`

```bash
NEXT_PUBLIC_FIRES_LAYER_URL=https://services7.arcgis.com/ugxBfvMK7LG0g5Q9/arcgis/rest/services/Fires_Final/FeatureServer/9/
NEXT_PUBLIC_CITIES_LAYER_URL=https://services7.arcgis.com/ugxBfvMK7LG0g5Q9/ArcGIS/rest/services/Cities_Final_Public/FeatureServer/18
NEXT_PUBLIC_FIRE_MIN_ACRES=450
```

### 3) Run

```bash
npm run dev
```

Open `http://localhost:3000`.

---

## Project structure (high-level)

```text
app/
  page.tsx              # Landing route
  explore/page.tsx      # Main ArcGIS experience
  about/page.tsx        # Background + methodology
  resources/page.tsx    # Resource/data stack page

components/
  ArcGISMap.tsx         # Map init, layers, query + interaction logic
  Sidebar.tsx           # Search, radius, score, detail panels
  LandingPage.tsx       # Landing UI
  TopNav.tsx            # Shared nav across pages
  SiteFooter.tsx        # Shared footer across pages

lib/
  arcgis.ts             # Fire querying + helper logic

types/
  index.ts              # Shared TypeScript interfaces
```

---

## Related

- ArcGIS StoryMap version of the analysis (pre-web-app phase)
- `https://storymaps.arcgis.com/stories/6ef09b9cb4d6480ea4826a7dfd557635`

---

## Author

Landon Campos
Software Development Engineer + CS student (CSUSB)  
Highland, California
