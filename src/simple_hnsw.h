#ifndef SIMPLE_HNSW_H
#define SIMPLE_HNSW_H

#include <vector>
#include <queue>
#include <cmath>
#include <algorithm>
#include <stdexcept>
#include <random>
#include <limits>
#include <cstdint>
#include <nlohmann/json.hpp>
#include "not_implemented_exception.h"

using json = nlohmann::json;

// Public types
using Vector = std::vector<double>;
using Distance = double;
using NodeIndex = std::size_t;
static constexpr NodeIndex INVALID_NODE = std::numeric_limits<NodeIndex>::max();

struct LayerNode {
    Vector vector;
    std::vector<NodeIndex> connections;
    NodeIndex layerBelow = INVALID_NODE;
};

using Layer = std::vector<LayerNode>;

// Use squared Euclidean distance for comparisons to avoid sqrt costs
inline double squaredEuclideanDistance(const Vector& a, const Vector& b) {
    if (a.size() != b.size()) {
        throw std::invalid_argument("Vectors must have the same length");
    }
    double sum = 0.0;
    for (size_t i = 0; i < a.size(); ++i) {
        double diff = a[i] - b[i];
        sum += diff * diff;
    }
    return sum;
}

// Return actual Euclidean distance when caller needs it
inline double euclideanDistance(const Vector& a, const Vector& b) {
    return std::sqrt(squaredEuclideanDistance(a, b));
}

class SimpleHNSWIndex {
private:
    int L;
    double mL;
    int efc;
    int maxConnections;
    std::vector<Layer> index;

    // RNG for deterministic/controllable layer selection
    std::mt19937 rng;

    static bool containsConnection(const LayerNode& node, NodeIndex target) {
        return std::find(node.connections.begin(), node.connections.end(), target) != node.connections.end();
    }

    void pruneNodeConnections(Layer& layer, NodeIndex nodeIndex) {
        if (nodeIndex == INVALID_NODE || nodeIndex >= layer.size()) {
            return;
        }

        LayerNode& node = layer[nodeIndex];
        if (node.connections.empty()) {
            return;
        }

        std::vector<std::pair<double, NodeIndex>> scored;
        scored.reserve(node.connections.size());
        for (NodeIndex connection : node.connections) {
            if (connection == nodeIndex || connection >= layer.size()) {
                continue;
            }
            const LayerNode& neighbor = layer[connection];
            scored.emplace_back(squaredEuclideanDistance(node.vector, neighbor.vector), connection);
        }

        if (scored.empty()) {
            node.connections.clear();
            return;
        }

        size_t target = static_cast<size_t>(maxConnections);
        if (scored.size() > target) {
            auto nth = scored.begin() + static_cast<typename decltype(scored)::difference_type>(target);
            std::nth_element(scored.begin(), nth, scored.end(), [](const auto& lhs, const auto& rhs) { return lhs.first < rhs.first; });
            scored.resize(target);
        }

        std::sort(scored.begin(), scored.end(), [](const auto& lhs, const auto& rhs) {
            return lhs.first < rhs.first;
        });

        node.connections.clear();
        node.connections.reserve(scored.size());
        for (const auto& entry : scored) {
            if (!containsConnection(node, entry.second)) {
                node.connections.push_back(entry.second);
            }
        }
    }

    // Internal search in a single layer. Returns vector of (squaredDistance, NodeIndex) sorted ascending.
    std::vector<std::pair<double, NodeIndex>> _searchLayer(const Layer& graph, NodeIndex entry, const Vector& query, int ef) const {
        if (graph.empty()) return {};
        if (entry == INVALID_NODE || entry >= graph.size()) {
            throw std::invalid_argument("Invalid entry index");
        }
        if (ef <= 0) return {};

        // compute entry distance
        const LayerNode& graphEntry = graph[entry];
        double entryDist = squaredEuclideanDistance(graphEntry.vector, query);

        std::vector<char> visited(graph.size(), false);
        visited[entry] = true;

        auto maxHeapComp = [](const std::pair<double, NodeIndex>& lhs, const std::pair<double, NodeIndex>& rhs) {
            return lhs.first < rhs.first; // max-heap by distance
        };

        std::vector<std::pair<double, NodeIndex>> best;
        best.reserve(static_cast<size_t>(ef));

        auto emplaceBest = [&](const std::pair<double, NodeIndex>& candidate) {
            if (best.size() < static_cast<size_t>(ef)) {
                best.push_back(candidate);
                std::push_heap(best.begin(), best.end(), maxHeapComp);
            } else if (candidate.first < best.front().first) {
                std::pop_heap(best.begin(), best.end(), maxHeapComp);
                best.back() = candidate;
                std::push_heap(best.begin(), best.end(), maxHeapComp);
            }
        };

        emplaceBest({ entryDist, entry });

        auto minHeapComp = [](const std::pair<double, NodeIndex>& lhs, const std::pair<double, NodeIndex>& rhs) {
            return lhs.first > rhs.first; // min-heap by distance
        };
        std::priority_queue<std::pair<double, NodeIndex>, std::vector<std::pair<double, NodeIndex>>, decltype(minHeapComp)> candidates(minHeapComp);

        candidates.emplace(entryDist, entry);

        while (!candidates.empty()) {
            auto current = candidates.top();
            candidates.pop();

            if (!best.empty() && current.first > best.front().first) {
                continue;
            }

            const LayerNode& graphCurrent = graph[current.second];
            for (NodeIndex neighbor : graphCurrent.connections) {
                if (neighbor >= graph.size()) {
                    continue;
                }
                if (visited[neighbor]) continue;
                visited[neighbor] = true;

                const LayerNode& graphNeighbor = graph[neighbor];
                double dist = squaredEuclideanDistance(graphNeighbor.vector, query);

                if (best.size() < static_cast<size_t>(ef) || dist < best.front().first) {
                    candidates.emplace(dist, neighbor);
                    emplaceBest({ dist, neighbor });
                }
            }
        }

        std::sort(best.begin(), best.end(), [](const auto& lhs, const auto& rhs) { return lhs.first < rhs.first; });
        return best;
    }

public:
    SimpleHNSWIndex(int L_ = 5, double mL_ = 0.62, int efc_ = 10, int maxConnectionsPerLayer = 16, uint32_t seed = std::random_device{}())
        : L(L_), mL(mL_), efc(efc_), maxConnections(std::max(1, maxConnectionsPerLayer)), index(), rng(seed) {
        if (L <= 0) throw std::invalid_argument("L must be positive");
        index.resize(static_cast<size_t>(L));
    }

    // Deterministic or seeded layer assignment using uniform real and negative log:
    int getInsertLayer() {
        std::uniform_real_distribution<double> dist(0.0, 1.0);
        double u = dist(rng);
        // ensure u in (0,1], avoid log(0)
        if (u <= 0.0) u = std::numeric_limits<double>::min();
        int layer = static_cast<int>(std::floor(-std::log(u) * mL));
        if (layer < 0) layer = 0;
        if (layer >= L) layer = L - 1;
        return layer;
    }

    void setIndex(const std::vector<Layer>& newIndex) {
        index = newIndex;
        for (auto& layer : index) {
            for (size_t i = 0; i < layer.size(); ++i) {
                pruneNodeConnections(layer, static_cast<NodeIndex>(i));
            }
        }
    }

    void insert(const Vector& vec) {
        int l = getInsertLayer();
        NodeIndex startV = 0;
        // If layer 0 is empty, insert into all intermediate empty layers appropriately
        for (int n = 0; n < L; ++n) {
            Layer& graph = index[static_cast<size_t>(n)];

            if (graph.empty()) {
                LayerNode ln;
                ln.vector = vec;
                ln.layerBelow = (n < L - 1 ? static_cast<NodeIndex>(index[static_cast<size_t>(n + 1)].size()) : INVALID_NODE);
                graph.push_back(std::move(ln));
                continue;
            }

            if (n < l) {
                auto res = _searchLayer(graph, startV, vec, 1);
                if (res.empty()) {
                    startV = 0;
                } else {
                    startV = res[0].second;
                }
            } else {
                LayerNode node;
                node.vector = vec;
                node.layerBelow = (n < L - 1 ? static_cast<NodeIndex>(index[static_cast<size_t>(n + 1)].size()) : INVALID_NODE);
                auto nns = _searchLayer(graph, startV, vec, efc);
                std::vector<NodeIndex> selectedNeighbors;
                selectedNeighbors.reserve(std::min(static_cast<size_t>(maxConnections), nns.size()));
                for (const auto& nn : nns) {
                    if (selectedNeighbors.size() >= static_cast<size_t>(maxConnections)) break;
                    selectedNeighbors.push_back(nn.second);
                }
                node.connections = selectedNeighbors;

                NodeIndex newIndex = static_cast<NodeIndex>(graph.size());
                graph.push_back(std::move(node));

                pruneNodeConnections(graph, newIndex);

                for (NodeIndex neighborIndex : selectedNeighbors) {
                    if (neighborIndex >= graph.size()) continue;
                    LayerNode& neighborNode = graph[neighborIndex];
                    if (!containsConnection(neighborNode, newIndex)) {
                        neighborNode.connections.push_back(newIndex);
                    }
                    pruneNodeConnections(graph, neighborIndex);

                    // ensure symmetric-ish relationship: remove neighbor from new node if exceeded
                    auto& newConnections = graph[newIndex].connections;
                    newConnections.erase(std::remove(newConnections.begin(), newConnections.end(), neighborIndex), newConnections.end());
                }
                pruneNodeConnections(graph, newIndex);

                // prepare startV for next layer down
                if (startV < graph.size()) {
                    startV = graph[startV].layerBelow;
                } else {
                    startV = INVALID_NODE;
                }
            }
        }
    }

    // Public search: returns actual Euclidean distances + node indices, limited by ef parameter
    std::vector<std::pair<Distance, NodeIndex>> search(const Vector& query, int ef = 1) const {
        if (index.empty() || index[0].empty()) {
            return {};
        }

        NodeIndex bestV = 0;
        for (const Layer& graph : index) {
            auto searchLayer = _searchLayer(graph, bestV, query, ef);
            if (searchLayer.empty()) continue;
            bestV = searchLayer[0].second;
            if (graph[bestV].layerBelow == INVALID_NODE) {
                // convert squared distances to actual distances
                std::vector<std::pair<Distance, NodeIndex>> out;
                out.reserve(searchLayer.size());
                for (const auto& p : _searchLayer(graph, bestV, query, ef)) {
                    out.emplace_back(std::sqrt(p.first), p.second);
                }
                return out;
            }
            bestV = graph[bestV].layerBelow;
            if (bestV == INVALID_NODE) break;
        }
        return {};
    }

    // JSON serialization with versioning and basic validation
    std::string toJSON() const {
        json j;
        j["version"] = 1;
        j["L"] = L;
        j["mL"] = mL;
        j["efc"] = efc;
        j["maxConnections"] = maxConnections;

        j["index"] = json::array();
        for (const auto& layer : index) {
            json layerData = json::array();
            for (const auto& node : layer) {
                json nodeData;
                nodeData["vector"] = node.vector;
                nodeData["connections"] = node.connections;
                // store layerBelow as -1 if INVALID_NODE for compatibility
                nodeData["layerBelow"] = (node.layerBelow == INVALID_NODE ? -1 : static_cast<long long>(node.layerBelow));
                layerData.push_back(nodeData);
            }
            j["index"].push_back(layerData);
        }
        return j.dump();
    }

    static SimpleHNSWIndex fromJSON(const std::string& str) {
        json j;
        try {
            j = json::parse(str);
        } catch (const std::exception& e) {
            throw std::invalid_argument(std::string("Invalid JSON: ") + e.what());
        }

        if (!j.contains("L") || !j.contains("mL") || !j.contains("index")) {
            throw std::invalid_argument("Missing required fields in JSON");
        }

        int L = j["L"].get<int>();
        double mL = j["mL"].get<double>();
        int efc = j.value("efc", 10);
        int maxConnections = j.value("maxConnections", 16);

        if (L <= 0) throw std::invalid_argument("Invalid L in JSON");

        std::vector<Layer> indexVec(static_cast<size_t>(L));
        if (!j["index"].is_array() || j["index"].size() != static_cast<size_t>(L)) {
            throw std::invalid_argument("Index layer count mismatch");
        }

        for (int i = 0; i < L; ++i) {
            for (const auto& nodeData : j["index"][i]) {
                LayerNode node;
                node.vector = nodeData.at("vector").get<std::vector<double>>();
                node.connections = nodeData.at("connections").get<std::vector<NodeIndex>>();
                long long layerBelowRaw = nodeData.value("layerBelow", -1);
                node.layerBelow = (layerBelowRaw < 0 ? INVALID_NODE : static_cast<NodeIndex>(layerBelowRaw));
                indexVec[static_cast<size_t>(i)].push_back(std::move(node));
            }
        }

        SimpleHNSWIndex h(L, mL, efc, maxConnections);
        h.setIndex(indexVec);
        return h;
    }

    std::vector<uint8_t> toBinary() const {
        throw NotImplementedException("Binary serialization is not implemented yet.");
    }

    static SimpleHNSWIndex fromBinary(const std::vector<uint8_t>& /*binary*/) {
        throw NotImplementedException("Binary deserialization is not implemented yet.");
    }
};

#endif // SIMPLE_HNSW_H
