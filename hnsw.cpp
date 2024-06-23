#include <vector>
#include <queue>
#include <cmath>
#include <set>
#include <algorithm>
#include <iostream>
#include<functional>

using namespace std;

// Type definitions
using Vector = std::vector<double>;
using Distance = double;
using NodeIndex = int;

struct LayerNode {
    Vector vector;
    std::vector<NodeIndex> connections;
    NodeIndex layerBelow;
};

using Layer = std::vector<LayerNode>;

// Simple Priority Queue Implementation
template<typename T>
class PriorityQueue {
private:
    std::vector<T> elements;
    std::function<bool(T, T)> compareFn;

public:
    PriorityQueue(std::vector<T> elements, std::function<bool(T, T)> compareFn)
        : elements(elements), compareFn(compareFn) {
        std::sort(this->elements.begin(), this->elements.end(), this->compareFn);
    }

    void push(T element) {
        elements.push_back(element);
        std::sort(elements.begin(), elements.end(), compareFn);
    }

    T pop() {
        T element = elements.front();
        elements.erase(elements.begin());
        return element;
    }

    bool isEmpty() const {
        return elements.empty();
    }
};

double EuclideanDistance(const Vector& a, const Vector& b) {
    if (a.size() != b.size()) {
        throw std::invalid_argument("Vectors must have the same length");
    }

    double sum = 0.0;
    for (size_t i = 0; i < a.size(); ++i) {
        sum += std::pow(a[i] - b[i], 2);
    }
    return std::sqrt(sum);
}

int getInsertLayer(int L, double mL) {
    return std::min(static_cast<int>(-std::floor(std::log(std::rand() / static_cast<double>(RAND_MAX)) * mL)), L - 1);
}

std::vector<std::pair<Distance, NodeIndex>> _searchLayer(
    const Layer& graph, NodeIndex entry, const Vector& query, int ef) {
    if (entry < 0 || entry >= graph.size()) {
        throw std::invalid_argument("Invalid entry index");
    }

    const LayerNode& graphEntry = graph[entry];
    std::pair<Distance, NodeIndex> best = { EuclideanDistance(graphEntry.vector, query), entry };
    std::vector<std::pair<Distance, NodeIndex>> nns = { best };
    std::set<NodeIndex> visited = { best.second };
    PriorityQueue<std::pair<Distance, NodeIndex>> candidates({ best }, [](auto a, auto b) { return a.first < b.first; });

    while (!candidates.isEmpty()) {
        auto current = candidates.pop();
        if (nns.back().first < current.first) break;

        const LayerNode& graphCurrent = graph[current.second];
        for (const auto& e : graphCurrent.connections) {
            const LayerNode& graphE = graph[e];
            double dist = EuclideanDistance(graphE.vector, query);
            if (visited.find(e) == visited.end()) {
                visited.insert(e);
                if (dist < nns.back().first || nns.size() < ef) {
                    candidates.push({ dist, e });
                    nns.push_back({ dist, e });
                    std::sort(nns.begin(), nns.end(), [](auto a, auto b) { return a.first < b.first; });
                    if (nns.size() > ef) {
                        nns.pop_back();
                    }
                }
            }
        }
    }

    return nns;
}

class ExperimentalHNSWIndex {
private:
    int L;
    double mL;
    int efc;
    std::vector<Layer> index;

public:
    ExperimentalHNSWIndex(int L = 5, double mL = 0.62, int efc = 10)
        : L(L), mL(mL), efc(efc), index(L) {}

    void setIndex(const std::vector<Layer>& index) {
        this->index = index;
    }

    void insert(const Vector& vec) {
        int l = getInsertLayer(L, mL);
        int startV = 0;

        for (int n = 0; n < L; ++n) {
            Layer& graph = index[n];

            if (graph.empty()) {
                graph.push_back({ vec, {}, n < L - 1 ? index[n + 1].size() : -1 });
                continue;
            }

            if (n < l) {
                auto searchLayerResult = _searchLayer(graph, startV, vec, 1);
                startV = searchLayerResult[0].second;
            } else {
                LayerNode node = { vec, {}, n < L - 1 ? index[n + 1].size() : -1 };
                auto nns = _searchLayer(graph, startV, vec, efc);
                for (const auto& nn : nns) {
                    node.connections.push_back(nn.second);
                    graph[nn.second].connections.push_back(graph.size());
                }
                graph.push_back(node);
                startV = graph[startV].layerBelow;
            }
        }
    }

    std::vector<std::pair<Distance, NodeIndex>> search(const Vector& query, int ef = 1) {
        if (index[0].empty()) {
            return {};
        }

        int bestV = 0;
        for (const auto& graph : index) {
            auto searchLayer = _searchLayer(graph, bestV, query, ef);
            bestV = searchLayer[0].second;
            if (graph[bestV].layerBelow == -1) {
                return _searchLayer(graph, bestV, query, ef);
            }
            bestV = graph[bestV].layerBelow;
        }
        return {};
    }

    std::string toJSON() const {
        // Serialization logic (omitted for brevity)
        return "";
    }

    static ExperimentalHNSWIndex fromJSON(const std::string& json) {
        // Deserialization logic (omitted for brevity)
        return ExperimentalHNSWIndex();
    }

    std::vector<uint8_t> toBinary() const {
        // Serialization logic (omitted for brevity)
        return {};
    }

    static ExperimentalHNSWIndex fromBinary(const std::vector<uint8_t>& binary) {
        // Deserialization logic (omitted for brevity)
        return ExperimentalHNSWIndex();
    }
};

int main() {
    // Example usage of the ExperimentalHNSWIndex class
    ExperimentalHNSWIndex index;
    Vector vec1 = { 1.0, 2.0, 3.0 };
    Vector vec2 = { 1.0, 2.0, 2.9 };
    index.insert(vec1);
    index.insert(vec2);

    Vector query = { 1.1, 2.1, 3.1 };
    auto results = index.search(query);

    for (const auto& result : results) {
        std::cout << "Distance: " << result.first << ", NodeIndex: " << result.second << std::endl;
    }

    return 0;
}


