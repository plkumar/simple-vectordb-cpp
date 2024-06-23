#include <vector>
#include <cmath>
#include <stdexcept>
#include <iomanip>
#include <sstream>

// Function to calculate cosine similarity
double cosineSimilarity(const std::vector<double>& vecA, const std::vector<double>& vecB, int precision = 6) {
    // Check if both vectors have the same length
    if (vecA.size() != vecB.size()) {
        throw std::invalid_argument("Vectors must have the same length");
    }

    // Compute dot product and magnitudes
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

    // Check if either magnitude is zero
    if (magnitudeA == 0 || magnitudeB == 0) {
        return 0;
    }

    // Calculate cosine similarity
    double cosineSim = dotProduct / (magnitudeA * magnitudeB);

    // Round to specified precision
    std::ostringstream oss;
    oss << std::fixed << std::setprecision(precision) << cosineSim;
    return std::stod(oss.str());
}

