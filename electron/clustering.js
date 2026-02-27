/**
 * Calculates cosine similarity between two vectors
 */
export function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Very basic hierarchical clustering based on cosine similarity
 * @param {Array<{path: string, embedding: number[]}>} items
 * @param {number} threshold similarity threshold (0 to 1)
 */
export function clusterFiles(items, threshold = 0.75) {
    const clusters = [];

    for (const item of items) {
        let placed = false;

        for (const cluster of clusters) {
            // Compare with the centroid/first item of the cluster
            const similarity = cosineSimilarity(item.embedding, cluster.centroid);
            if (similarity >= threshold) {
                cluster.files.push(item);
                placed = true;
                break;
            }
        }

        if (!placed) {
            clusters.push({
                centroid: item.embedding,
                files: [item]
            });
        }
    }

    return clusters.map(c => c.files.map(f => f.path));
}
