#include <vector>
#include <cmath>
#include <stdexcept>
#include <iomanip>
#include <sstream>
#include <cmath>

// Function to calculate cosine similarity
// Returns double in range [-1, 1]. If either vector has zero magnitude, returns 0.0
// If rounding is required, caller can round; lightweight rounding option provided.
double cosineSimilarity(const std::vector<double>& vecA, const std::vector<double>& vecB, int precision = -1) {
    if (vecA.size() != vecB.size()) {
        throw std::invalid_argument("Vectors must have the same length");
    }

    double dotProduct = 0.0;
    double magnitudeA = 0.0;
    double magnitudeB = 0.0;

    for (size_t i = 0; i < vecA.size(); ++i) {
        dotProduct += vecA[i] * vecB[i];
        magnitudeA += vecA[i] * vecA[i];
        magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = std::sqrt(magnitudeA);
    magnitudeB = std::sqrt(magnitudeB);

    if (magnitudeA == 0.0 || magnitudeB == 0.0) {
        // Returning 0.0 is a pragmatic choice; callers should handle degenerate vectors.
        return 0.0;
    }

    double cosineSim = dotProduct / (magnitudeA * magnitudeB);

    // Clamp to [-1, 1] to avoid small floating point drift issues
    if (cosineSim > 1.0) cosineSim = 1.0;
    if (cosineSim < -1.0) cosineSim = -1.0;

    if (precision < 0) {
        return cosineSim;
    }

    double power = std::pow(10.0, precision);
    return std::round(cosineSim * power) / power;
}
