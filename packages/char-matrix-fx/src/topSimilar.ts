import topSimilarData from "./assets/top_similar.json";

export interface TopSimilar {
  [key: string]: string[];
}
const TOP_SIMILAR: TopSimilar = topSimilarData;
// add character itself to the top similar list
for (const key in TOP_SIMILAR) {
  TOP_SIMILAR[key].unshift(key);
}

export default TOP_SIMILAR;
